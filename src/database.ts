import mysql from 'mysql2/promise';
import { config, ConnectParams } from './config.js';

let pool: mysql.Pool | null = null;
let currentConfig: any = null;

// SQL command whitelist for read-only operations
const READ_ONLY_PATTERNS = [
  /^\s*SELECT\s+/i,
  /^\s*SHOW\s+/i,
  /^\s*EXPLAIN\s+/i,
  /^\s*DESCRIBE\s+/i,
  /^\s*DESC\s+/i,
  /^\s*WITH\s+.*SELECT\s+/i, // CTE starting with SELECT
];

const WRITE_PATTERNS = [
  /\b(INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|TRUNCATE|REPLACE|MERGE)\b/i,
  /\b(GRANT|REVOKE|SET|CALL|EXECUTE|LOAD)\b/i,
];

export function isReadOnlyQuery(sql: string): boolean {
  const trimmedSql = sql.trim();
  
  // Check if it matches any read-only pattern
  return READ_ONLY_PATTERNS.some(pattern => pattern.test(trimmedSql));
}

export function enforceLimit(sql: string, limit?: number): string {
  const defaultLimit = limit || config.DEFAULT_SAMPLE_LIMIT;
  const trimmedSql = sql.trim().replace(/;+$/, '');
  
  // Don't add LIMIT to queries that already have one
  if (/\bLIMIT\s+\d+/i.test(trimmedSql)) {
    return trimmedSql;
  }
  
  // Only add LIMIT to SELECT queries
  if (/^\s*SELECT\s+/i.test(trimmedSql)) {
    return `${trimmedSql} LIMIT ${defaultLimit}`;
  }
  
  return trimmedSql;
}

export async function createPool(params?: ConnectParams): Promise<void> {
  // Close existing pool if any
  if (pool) {
    await pool.end();
    pool = null;
  }
  
  // Merge parameters with environment config
  const connectionConfig = {
    host: params?.host || config.MYSQL_HOST,
    port: params?.port || config.MYSQL_PORT,
    user: params?.user || config.MYSQL_USER,
    password: params?.password || config.MYSQL_PASSWORD,
    database: params?.database || config.MYSQL_DB,
    ssl: params?.ssl !== undefined ? params.ssl : config.MYSQL_SSL === 'true',
    connectionLimit: config.MYSQL_CONNECTION_LIMIT,
    waitForConnections: true,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    connectTimeout: config.DEFAULT_QUERY_TIMEOUT,
  };
  
  // Remove undefined database to connect without selecting one
  if (!connectionConfig.database) {
    delete (connectionConfig as any).database;
  }
  
  // Configure SSL if enabled
  let poolOptions: mysql.PoolOptions = {
    ...connectionConfig,
    ssl: connectionConfig.ssl ? {
      rejectUnauthorized: false, // For self-signed certificates
    } : undefined,
  } as mysql.PoolOptions;
  
  currentConfig = connectionConfig;
  pool = mysql.createPool(poolOptions);
  
  // Test connection
  const connection = await pool.getConnection();
  try {
    await connection.execute('SELECT 1');
  } finally {
    connection.release();
  }
}

export async function getConnection(): Promise<mysql.PoolConnection> {
  if (!pool) {
    await createPool();
  }
  return pool!.getConnection();
}

export async function executeQuery<T = any>(
  sql: string,
  params: any[] = [],
  database?: string
): Promise<T[]> {
  const connection = await getConnection();
  try {
    if (database) {
      // Use query() instead of execute() for USE command as it's not supported in prepared statements
      await connection.query(`USE \`${database}\``);
    }
    
    const [rows] = await connection.execute(sql, params);
    return rows as T[];
  } finally {
    connection.release();
  }
}

export async function executeReadOnlyQuery<T = any>(
  sql: string,
  params: any[] = [],
  database?: string,
  enforceReadOnly: boolean = true
): Promise<T[]> {
  if (enforceReadOnly && !isReadOnlyQuery(sql)) {
    throw new Error('Only read-only queries are allowed (SELECT, SHOW, EXPLAIN, DESCRIBE)');
  }
  
  return executeQuery<T>(sql, params, database);
}

export function getCurrentConfig(): any {
  return currentConfig || {
    host: config.MYSQL_HOST,
    port: config.MYSQL_PORT,
    user: config.MYSQL_USER,
    database: config.MYSQL_DB,
    ssl: config.MYSQL_SSL === 'true',
  };
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    currentConfig = null;
  }
}
