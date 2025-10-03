import { describe, it, expect, afterAll, beforeAll } from '@jest/globals';
import { connect, listDatabases, listTables, getTableInfo, getTableDDL } from './schema.js';
import { profileTable, analyzeNumericColumns, getValueDistribution, detectOutliers, findDuplicates, getNullReport } from './analysis.js';
import { config } from '../config.js';
import { closePool, executeQuery } from '../database.js';

describe('Database Connection', () => {
  it('should connect to the database using .env credentials', async () => {
    const connectionParams = {
      host: config.MYSQL_HOST,
      port: config.MYSQL_PORT,
      user: config.MYSQL_USER,
      password: config.MYSQL_PASSWORD,
      database: config.MYSQL_DB,
      ssl: config.MYSQL_SSL === 'true',
    };

    const result = await connect(connectionParams);

    expect(result.ok).toBe(true);
    expect(result.using.host).toBe(config.MYSQL_HOST);
    expect(result.using.database).toBe(config.MYSQL_DB);
  }, 10000);
});

describe('Schema Tools', () => {
  beforeAll(async () => {
    await executeQuery('CREATE TABLE IF NOT EXISTS test_table (id INT PRIMARY KEY, name VARCHAR(255));');
  });

  afterAll(async () => {
    await executeQuery('DROP TABLE IF EXISTS test_table;');
  });

  it('should list databases', async () => {
    const databases = await listDatabases();
    expect(Array.isArray(databases)).toBe(true);
    expect(databases.length).toBeGreaterThan(0);
  });

  it('should list tables', async () => {
    const tables = await listTables({ database: config.MYSQL_DB });
    expect(Array.isArray(tables)).toBe(true);
    expect(tables.length).toBeGreaterThan(0);
  });

  it('should get table info', async () => {
    const tableInfo = await getTableInfo({ table: 'test_table' });
    expect(tableInfo).toHaveProperty('columns');
    expect(tableInfo).toHaveProperty('indexes');
    expect(tableInfo).toHaveProperty('foreignKeys');
  });

  it('should get table DDL', async () => {
    const ddl = await getTableDDL({ table: 'test_table' });
    expect(typeof ddl).toBe('string');
    expect(ddl).toContain('CREATE TABLE');
  });
});

describe('Analysis Tools', () => {
  beforeAll(async () => {
    await executeQuery('CREATE TABLE IF NOT EXISTS test_analysis_table (id INT, name VARCHAR(50), value INT, category VARCHAR(50));');
    await executeQuery("INSERT INTO test_analysis_table (id, name, value, category) VALUES (1, 'A', 10, 'X'), (2, 'B', 20, 'Y'), (3, 'A', 10, 'X'), (4, 'C', 30, NULL);");
  });

  afterAll(async () => {
    await executeQuery('DROP TABLE IF EXISTS test_analysis_table;');
    await closePool();
  });

  it('should profile a table', async () => {
    const profile = await profileTable({ table: 'test_analysis_table', sample_limit: 100 });
    expect(profile.tableName).toBe('test_analysis_table');
    expect(profile.totalRows).toBe(4);
    expect(profile.columns.length).toBe(4);
  });

  it('should analyze numeric columns', async () => {
    const analysis = await analyzeNumericColumns({ table: 'test_analysis_table', sample_limit: 100 });
    expect(analysis.columns.length).toBe(2);
    expect(analysis.columns[0].column).toBe('id');
    expect(analysis.columns[1].column).toBe('value');
  });

  it('should get value distribution', async () => {
    const distribution = await getValueDistribution({ table: 'test_analysis_table', column: 'category', topk: 10 });
    expect(distribution.topValues.length).toBe(3);
    expect(distribution.topValues[0].value).toBe('X');
  });

  it('should detect outliers', async () => {
    const outliers = await detectOutliers({ table: 'test_analysis_table', column: 'value', z_threshold: 1, limit: 10 });
    expect(outliers.outliers.length).toBe(1);
    expect(outliers.outliers[0].value).toBe(30);
  });

  it('should find duplicates', async () => {
    const duplicates = await findDuplicates({ table: 'test_analysis_table', columns: ['name', 'value'], limit_groups: 10 });
    expect(duplicates.duplicateGroups.length).toBe(1);
    expect(duplicates.duplicateGroups[0].count).toBe(2);
  });

  it('should get null report', async () => {
    const nullReport = await getNullReport({ table: 'test_analysis_table' });
    expect(nullReport.columns.length).toBe(4);
    expect(nullReport.columns[0].column).toBe('category');
    expect(nullReport.columns[0].nullCount).toBe(1);
  });
});
