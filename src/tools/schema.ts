import { 
  connectParamsSchema, 
  databaseParamsSchema,
  tableParamsSchema,
  ConnectParams,
  DatabaseParams,
  TableParams 
} from '../config.js';
import { 
  createPool, 
  executeReadOnlyQuery, 
  getCurrentConfig 
} from '../database.js';

// Connect to MySQL
export async function connect(params: ConnectParams) {
  try {
    await createPool(params);
    const config = getCurrentConfig();
    
    return {
      ok: true,
      using: {
        host: config.host,
        port: config.port,
        user: config.user,
        database: config.database || 'none',
        ssl: config.ssl,
      },
    };
  } catch (error: any) {
    throw new Error(`Connection failed: ${error.message}`);
  }
}

// List all databases
export async function listDatabases() {
  const rows = await executeReadOnlyQuery<{ Database: string }>(
    'SHOW DATABASES'
  );
  
  return rows.map(row => row.Database);
}

// List tables in a database
export async function listTables(params: DatabaseParams) {
  const { database } = params;
  
  const query = database 
    ? `SHOW TABLES FROM \`${database}\``
    : 'SHOW TABLES';
  
  const rows = await executeReadOnlyQuery<Record<string, string>>(
    query,
    [],
    database
  );
  
  // The column name varies based on database name
  const columnName = Object.keys(rows[0] || {})[0];
  if (!columnName) return [];
  
  return rows.map(row => row[columnName]);
}

// Get detailed table information
export async function getTableInfo(params: TableParams) {
  const { database, table } = params;
  
  // Get column information
  const columnsQuery = `
    SELECT 
      COLUMN_NAME as name,
      DATA_TYPE as type,
      IS_NULLABLE as nullable,
      COLUMN_DEFAULT as defaultValue,
      COLUMN_KEY as keyType,
      EXTRA as extra,
      CHARACTER_MAXIMUM_LENGTH as maxLength,
      NUMERIC_PRECISION as numericPrecision,
      NUMERIC_SCALE as numericScale
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = IFNULL(?, DATABASE())
      AND TABLE_NAME = ?
    ORDER BY ORDINAL_POSITION
  `;
  
  const columns = await executeReadOnlyQuery(
    columnsQuery,
    [database || null, table],
    database
  );
  
  // Get index information
  const indexesQuery = `
    SELECT 
      INDEX_NAME as indexName,
      COLUMN_NAME as columnName,
      NON_UNIQUE as nonUnique,
      SEQ_IN_INDEX as seqInIndex,
      INDEX_TYPE as indexType
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = IFNULL(?, DATABASE())
      AND TABLE_NAME = ?
    ORDER BY INDEX_NAME, SEQ_IN_INDEX
  `;
  
  const indexRows = await executeReadOnlyQuery(
    indexesQuery,
    [database || null, table],
    database
  );
  
  // Group indexes by name
  const indexMap = new Map<string, any>();
  for (const row of indexRows) {
    if (!indexMap.has(row.indexName)) {
      indexMap.set(row.indexName, {
        name: row.indexName,
        columns: [],
        unique: !row.nonUnique,
        type: row.indexType,
      });
    }
    indexMap.get(row.indexName)!.columns.push(row.columnName);
  }
  
  // Get foreign key information
  const fkQuery = `
    SELECT 
      CONSTRAINT_NAME as constraintName,
      COLUMN_NAME as columnName,
      REFERENCED_TABLE_SCHEMA as referencedSchema,
      REFERENCED_TABLE_NAME as referencedTable,
      REFERENCED_COLUMN_NAME as referencedColumn
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = IFNULL(?, DATABASE())
      AND TABLE_NAME = ?
      AND REFERENCED_TABLE_NAME IS NOT NULL
    ORDER BY CONSTRAINT_NAME, ORDINAL_POSITION
  `;
  
  const fkRows = await executeReadOnlyQuery(
    fkQuery,
    [database || null, table],
    database
  );
  
  // Group foreign keys
  const fkMap = new Map<string, any>();
  for (const row of fkRows) {
    if (!fkMap.has(row.constraintName)) {
      fkMap.set(row.constraintName, {
        name: row.constraintName,
        columns: [],
        referencedTable: `${row.referencedSchema}.${row.referencedTable}`,
        referencedColumns: [],
      });
    }
    const fk = fkMap.get(row.constraintName)!;
    fk.columns.push(row.columnName);
    fk.referencedColumns.push(row.referencedColumn);
  }
  
  return {
    columns: columns.map(col => ({
      name: col.name,
      type: col.type,
      nullable: col.nullable === 'YES',
      default: col.defaultValue,
      key: col.keyType,
      extra: col.extra,
      maxLength: col.maxLength,
      precision: col.numericPrecision,
      scale: col.numericScale,
    })),
    indexes: Array.from(indexMap.values()),
    foreignKeys: Array.from(fkMap.values()),
  };
}

// Get table DDL
export async function getTableDDL(params: TableParams) {
  const { database, table } = params;
  
  const rows = await executeReadOnlyQuery<{ 'Create Table': string }>(
    `SHOW CREATE TABLE \`${table}\``,
    [],
    database
  );
  
  if (rows.length === 0) {
    throw new Error(`Table ${table} not found`);
  }
  
  return rows[0]['Create Table'];
}
