import { z } from 'zod';
import dotenv from 'dotenv';
import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import { join, dirname, resolve } from 'path';

dotenv.config();

// Environment configuration schema with enhanced validation
export const envSchema = z.object({
  MYSQL_HOST: z.string().min(1, 'MySQL host cannot be empty').default('localhost'),
  MYSQL_PORT: z.coerce.number().min(1).max(65535, 'Port must be between 1 and 65535').default(3306),
  MYSQL_USER: z.string().min(1, 'MySQL user cannot be empty').default('root'),
  MYSQL_PASSWORD: z.string().default(''),
  MYSQL_DB: z.string().optional(),
  MYSQL_SSL: z.enum(['true', 'false']).default('false'),
  MYSQL_CONNECTION_LIMIT: z.coerce.number().min(1).max(100, 'Connection limit must be between 1 and 100').default(5),
  DEFAULT_SAMPLE_LIMIT: z.coerce.number().min(1).max(1000000, 'Sample limit must be between 1 and 1,000,000').default(10000),
  DEFAULT_QUERY_TIMEOUT: z.coerce.number().min(1000).max(300000, 'Query timeout must be between 1 and 300 seconds').default(15000),
});

// MCP Configuration interface
export interface MCPConfig {
  serverName: string;
  command: string;
  args: string[];
  env: Record<string, string>;
  autoApprove?: string[];
  disabled?: boolean;
}

// Environment validation result interface
export interface EnvValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  config: z.infer<typeof envSchema>;
}

// Configuration management class
export class EnvironmentValidator {
  /**
   * Validate environment variables and return detailed results
   */
  static validate(env: NodeJS.ProcessEnv = process.env): EnvValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    try {
      const config = envSchema.parse(env);
      
      // Additional validation warnings
      if (!env.MYSQL_PASSWORD) {
        warnings.push('MySQL password is empty - this may cause connection issues');
      }
      
      if (config.MYSQL_CONNECTION_LIMIT > 20) {
        warnings.push('High connection limit may impact database performance');
      }
      
      if (config.DEFAULT_SAMPLE_LIMIT > 100000) {
        warnings.push('Large sample limit may cause memory issues');
      }
      
      return {
        isValid: true,
        errors,
        warnings,
        config
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push(...error.errors.map(e => `${e.path.join('.')}: ${e.message}`));
      } else {
        errors.push('Unknown validation error');
      }
      
      // Return default config for failed validation
      const defaultConfig = envSchema.parse({});
      return {
        isValid: false,
        errors,
        warnings,
        config: defaultConfig
      };
    }
  }
  
  /**
   * Apply default values to partial configuration
   */
  static applyDefaults(config: Partial<z.infer<typeof envSchema>>): z.infer<typeof envSchema> {
    return envSchema.parse(config);
  }
  
  /**
   * Validate required configuration fields
   */
  static validateRequired(config: z.infer<typeof envSchema>): string[] {
    const errors: string[] = [];
    
    if (!config.MYSQL_HOST) {
      errors.push('MYSQL_HOST is required');
    }
    
    if (!config.MYSQL_USER) {
      errors.push('MYSQL_USER is required');
    }
    
    return errors;
  }
}

// MCP Configuration Manager class
export class MCPConfigManager {
  /**
   * Generate Kiro IDE MCP configuration
   */
  static generateKiroConfig(): MCPConfig {
    const validation = EnvironmentValidator.validate();
    
    if (!validation.isValid) {
      throw new Error(`Environment validation failed: ${validation.errors.join(', ')}`);
    }
    
    // Use absolute path for better compatibility
    const serverPath = resolve(process.cwd(), 'dist/server.js');
    
    return {
      serverName: 'mcp-mysql-analyzer',
      command: 'node',
      args: [serverPath],
      env: {
        MYSQL_HOST: validation.config.MYSQL_HOST,
        MYSQL_PORT: validation.config.MYSQL_PORT.toString(),
        MYSQL_USER: validation.config.MYSQL_USER,
        MYSQL_PASSWORD: validation.config.MYSQL_PASSWORD,
        MYSQL_DB: validation.config.MYSQL_DB || '',
        MYSQL_SSL: validation.config.MYSQL_SSL,
        MYSQL_CONNECTION_LIMIT: validation.config.MYSQL_CONNECTION_LIMIT.toString(),
        DEFAULT_SAMPLE_LIMIT: validation.config.DEFAULT_SAMPLE_LIMIT.toString(),
        DEFAULT_QUERY_TIMEOUT: validation.config.DEFAULT_QUERY_TIMEOUT.toString(),
      },
      autoApprove: [
        'connect',
        'list_databases',
        'list_tables',
        'table_info',
        'get_table_ddl',
        'profile_table'
      ],
      disabled: false
    };
  }
  
  /**
   * Validate MCP configuration
   */
  static validateConfig(config: MCPConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!config.serverName || config.serverName.trim() === '') {
      errors.push('Server name is required');
    }
    
    if (!config.command || config.command.trim() === '') {
      errors.push('Command is required');
    }
    
    if (!Array.isArray(config.args)) {
      errors.push('Args must be an array');
    }
    
    if (!config.env || typeof config.env !== 'object') {
      errors.push('Environment variables must be an object');
    }
    
    // Validate environment variables in MCP config
    if (config.env) {
      const envValidation = EnvironmentValidator.validate(config.env);
      if (!envValidation.isValid) {
        errors.push(...envValidation.errors.map(e => `Environment: ${e}`));
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Write MCP configuration file to specified path
   */
  static writeConfigFile(path: string, config: MCPConfig): void {
    const validation = this.validateConfig(config);
    
    if (!validation.isValid) {
      throw new Error(`Invalid MCP configuration: ${validation.errors.join(', ')}`);
    }
    
    // Ensure directory exists
    const dir = dirname(path);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    
    // Read existing config if it exists
    let existingConfig: any = { mcpServers: {} };
    if (existsSync(path)) {
      try {
        existingConfig = JSON.parse(readFileSync(path, 'utf8'));
      } catch (error) {
        // If file is corrupted, start fresh
        existingConfig = { mcpServers: {} };
      }
    }
    
    // Update with new server config
    existingConfig.mcpServers[config.serverName] = {
      command: config.command,
      args: config.args,
      env: config.env,
      autoApprove: config.autoApprove || [],
      disabled: config.disabled || false
    };
    
    // Write updated config
    writeFileSync(path, JSON.stringify(existingConfig, null, 2));
  }
  
  /**
   * Generate and write Kiro MCP configuration
   */
  static setupKiroConfig(configPath: string = '.kiro/settings/mcp.json'): void {
    const config = this.generateKiroConfig();
    this.writeConfigFile(configPath, config);
  }
}

// Validate environment on module load and export results
export const envValidation = EnvironmentValidator.validate();

// Export validated configuration or defaults
export const config = envValidation.config;

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
