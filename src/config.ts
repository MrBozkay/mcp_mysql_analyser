import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

// Environment configuration schema
export const envSchema = z.object({
  MYSQL_HOST: z.string().default('localhost'),
  MYSQL_PORT: z.coerce.number().default(3306),
  MYSQL_USER: z.string().default('root'),
  MYSQL_PASSWORD: z.string().default(''),
  MYSQL_DB: z.string().optional(),
  MYSQL_SSL: z.enum(['true', 'false']).default('false'),
  MYSQL_CONNECTION_LIMIT: z.coerce.number().default(5),
  DEFAULT_SAMPLE_LIMIT: z.coerce.number().default(10000),
  DEFAULT_QUERY_TIMEOUT: z.coerce.number().default(15000),
});

// Parse and validate environment variables
export const config = envSchema.parse(process.env);

// Tool parameter schemas
export const connectParamsSchema = z.object({
  host: z.string().optional(),
  port: z.number().optional(),
  user: z.string().optional(),
  password: z.string().optional(),
  database: z.string().optional(),
  ssl: z.boolean().optional(),
});

export const databaseParamsSchema = z.object({
  database: z.string().optional(),
});

export const tableParamsSchema = z.object({
  database: z.string().optional(),
  table: z.string(),
});

export const columnParamsSchema = z.object({
  database: z.string().optional(),
  table: z.string(),
  column: z.string(),
});

export const sampleParamsSchema = z.object({
  database: z.string().optional(),
  table: z.string(),
  sample_limit: z.number().default(config.DEFAULT_SAMPLE_LIMIT),
});

export const distributionParamsSchema = z.object({
  database: z.string().optional(),
  table: z.string(),
  column: z.string(),
  topk: z.number().default(20),
});

export const outlierParamsSchema = z.object({
  database: z.string().optional(),
  table: z.string(),
  column: z.string(),
  z_threshold: z.number().default(3),
  limit: z.number().default(100),
});

export const duplicatesParamsSchema = z.object({
  database: z.string().optional(),
  table: z.string(),
  columns: z.array(z.string()),
  limit_groups: z.number().default(100),
});

export const sqlParamsSchema = z.object({
  database: z.string().optional(),
  sql: z.string(),
  limit: z.number().optional(),
});

// Type exports
export type ConnectParams = z.infer<typeof connectParamsSchema>;
export type DatabaseParams = z.infer<typeof databaseParamsSchema>;
export type TableParams = z.infer<typeof tableParamsSchema>;
export type ColumnParams = z.infer<typeof columnParamsSchema>;
export type SampleParams = z.infer<typeof sampleParamsSchema>;
export type DistributionParams = z.infer<typeof distributionParamsSchema>;
export type OutlierParams = z.infer<typeof outlierParamsSchema>;
export type DuplicatesParams = z.infer<typeof duplicatesParamsSchema>;
export type SqlParams = z.infer<typeof sqlParamsSchema>;
