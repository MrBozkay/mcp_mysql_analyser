import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { generateChurnSqlBasic, generateCohortSql, generateSurvivalSql, generateMrrChurnSql, suggestChurnMapping } from './churn.js';
import { executeQuery, closePool } from '../database.js';

describe('Churn Tools', () => {
  beforeAll(async () => {
    await executeQuery('CREATE TABLE IF NOT EXISTS users (id INT, name VARCHAR(50));');
    await executeQuery('CREATE TABLE IF NOT EXISTS activity (user_id INT, timestamp DATETIME);');
    await executeQuery('CREATE TABLE IF NOT EXISTS revenue (user_id INT, amount INT, timestamp DATETIME);');
    await executeQuery("INSERT INTO users (id, name) VALUES (1, 'A'), (2, 'B'), (3, 'C');");
    await executeQuery("INSERT INTO activity (user_id, timestamp) VALUES (1, '2025-01-15'), (2, '2025-01-20'), (1, '2025-02-10'), (3, '2025-03-05');");
    await executeQuery("INSERT INTO revenue (user_id, amount, timestamp) VALUES (1, 10, '2025-01-15'), (2, 20, '2025-01-20'), (1, 10, '2025-02-15');");
  });

  afterAll(async () => {
    await executeQuery('DROP TABLE IF EXISTS users;');
    await executeQuery('DROP TABLE IF EXISTS activity;');
    await executeQuery('DROP TABLE IF EXISTS revenue;');
    await closePool();
  });

  it('should generate and execute basic churn SQL', async () => {
    const params = {
      user_table: 'users',
      user_id_col: 'id',
      activity_table: 'activity',
      activity_user_col: 'user_id',
      activity_time_col: 'timestamp',
      inactivity_days: 30,
      month_floor: true,
    };

    const { sql } = await generateChurnSqlBasic(params);
    const results = await executeQuery(sql);
    expect(results.length).toBeGreaterThan(0);
  });

  it('should generate and execute cohort SQL', async () => {
    const params = {
      activity_table: 'activity',
      activity_user_col: 'user_id',
      activity_time_col: 'timestamp',
      observation_months: 3,
    };

    const { sql } = await generateCohortSql(params);
    const results = await executeQuery(sql);
    expect(results.length).toBeGreaterThan(0);
  });

  it('should generate and execute survival SQL', async () => {
    const params = {
      activity_table: 'activity',
      activity_user_col: 'user_id',
      activity_time_col: 'timestamp',
      inactivity_days: 30,
      max_months: 3,
    };

    const { sql } = await generateSurvivalSql(params);
    const results = await executeQuery(sql);
    expect(results.length).toBeGreaterThan(0);
  });

  it('should generate and execute MRR churn SQL', async () => {
    const params = {
      revenue_table: 'revenue',
      rev_user_col: 'user_id',
      rev_amount_col: 'amount',
      rev_time_col: 'timestamp',
      amount_is_monthly: true,
    };

    const { sql } = await generateMrrChurnSql(params);
    const results = await executeQuery(sql);
    expect(results.length).toBeGreaterThan(0);
  });

  it('should suggest churn mapping', async () => {
    const params = {
      tables: ['users', 'activity', 'revenue'],
    };

    const suggestions = await suggestChurnMapping(params);
    expect(suggestions.recommendations.length).toBeGreaterThan(0);
  });
});
