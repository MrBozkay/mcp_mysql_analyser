import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { EnvironmentValidator, MCPConfigManager, envSchema } from '../config.js';
import { writeFileSync, unlinkSync, existsSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';

describe('Configuration Management', () => {
  const testConfigPath = 'test-mcp-config.json';
  
  afterEach(() => {
    // Clean up test files
    if (existsSync(testConfigPath)) {
      unlinkSync(testConfigPath);
    }
  });

  describe('EnvironmentValidator', () => {
    it('should validate valid environment configuration', () => {
      const validEnv = {
        MYSQL_HOST: 'localhost',
        MYSQL_PORT: '3306',
        MYSQL_USER: 'testuser',
        MYSQL_PASSWORD: 'testpass',
        MYSQL_DB: 'testdb',
        MYSQL_SSL: 'true',
        MYSQL_CONNECTION_LIMIT: '10',
        DEFAULT_SAMPLE_LIMIT: '5000',
        DEFAULT_QUERY_TIMEOUT: '30000'
      };

      const result = EnvironmentValidator.validate(validEnv);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.config.MYSQL_HOST).toBe('localhost');
      expect(result.config.MYSQL_PORT).toBe(3306);
      expect(result.config.MYSQL_USER).toBe('testuser');
    });

    it('should apply defaults for missing values', () => {
      const minimalEnv = {
        MYSQL_USER: 'testuser'
      };

      const result = EnvironmentValidator.validate(minimalEnv);
      
      expect(result.isValid).toBe(true);
      expect(result.config.MYSQL_HOST).toBe('localhost');
      expect(result.config.MYSQL_PORT).toBe(3306);
      expect(result.config.MYSQL_CONNECTION_LIMIT).toBe(5);
    });

    it('should validate port ranges', () => {
      const invalidPortEnv = {
        MYSQL_PORT: '70000'
      };

      const result = EnvironmentValidator.validate(invalidPortEnv);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Port must be between 1 and 65535'))).toBe(true);
    });

    it('should validate connection limit ranges', () => {
      const invalidLimitEnv = {
        MYSQL_CONNECTION_LIMIT: '150'
      };

      const result = EnvironmentValidator.validate(invalidLimitEnv);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Connection limit must be between 1 and 100'))).toBe(true);
    });

    it('should generate warnings for empty password', () => {
      const noPasswordEnv = {
        MYSQL_USER: 'testuser',
        MYSQL_PASSWORD: ''
      };

      const result = EnvironmentValidator.validate(noPasswordEnv);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.includes('MySQL password is empty'))).toBe(true);
    });

    it('should generate warnings for high connection limits', () => {
      const highLimitEnv = {
        MYSQL_CONNECTION_LIMIT: '25'
      };

      const result = EnvironmentValidator.validate(highLimitEnv);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.includes('High connection limit'))).toBe(true);
    });
  });

  describe('MCPConfigManager', () => {
    beforeEach(() => {
      // Set up valid environment for MCP config generation
      process.env.MYSQL_HOST = 'localhost';
      process.env.MYSQL_PORT = '3306';
      process.env.MYSQL_USER = 'testuser';
      process.env.MYSQL_PASSWORD = 'testpass';
    });

    it('should generate valid Kiro MCP configuration', () => {
      const config = MCPConfigManager.generateKiroConfig();
      
      expect(config.serverName).toBe('mcp-mysql-analyzer');
      expect(config.command).toBe('node');
      expect(config.args).toHaveLength(1);
      expect(config.args[0]).toMatch(/dist[\\\/]server\.js$/); // Should end with dist/server.js or dist\server.js
      expect(config.env.MYSQL_HOST).toBe('localhost');
      expect(config.env.MYSQL_PORT).toBe('3306');
      expect(config.env.MYSQL_USER).toBe('testuser');
      expect(config.autoApprove).toContain('connect');
      expect(config.autoApprove).toContain('list_databases');
      expect(config.disabled).toBe(false);
    });

    it('should validate MCP configuration correctly', () => {
      const validConfig = {
        serverName: 'test-server',
        command: 'node',
        args: ['server.js'],
        env: {
          MYSQL_HOST: 'localhost',
          MYSQL_PORT: '3306',
          MYSQL_USER: 'testuser',
          MYSQL_PASSWORD: 'testpass',
          MYSQL_DB: '',
          MYSQL_SSL: 'false',
          MYSQL_CONNECTION_LIMIT: '5',
          DEFAULT_SAMPLE_LIMIT: '10000',
          DEFAULT_QUERY_TIMEOUT: '15000'
        }
      };

      const result = MCPConfigManager.validateConfig(validConfig);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid MCP configuration', () => {
      const invalidConfig = {
        serverName: '',
        command: '',
        args: 'not-an-array' as any,
        env: null as any
      };

      const result = MCPConfigManager.validateConfig(invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.includes('Server name is required'))).toBe(true);
      expect(result.errors.some(e => e.includes('Command is required'))).toBe(true);
    });

    it('should write configuration file correctly', () => {
      const config = MCPConfigManager.generateKiroConfig();
      
      MCPConfigManager.writeConfigFile(testConfigPath, config);
      
      expect(existsSync(testConfigPath)).toBe(true);
      
      const writtenConfig = JSON.parse(readFileSync(testConfigPath, 'utf8'));
      expect(writtenConfig.mcpServers['mcp-mysql-analyzer']).toBeDefined();
      expect(writtenConfig.mcpServers['mcp-mysql-analyzer'].command).toBe('node');
    });

    it('should merge with existing configuration file', () => {
      // Create existing config
      const existingConfig = {
        mcpServers: {
          'existing-server': {
            command: 'python',
            args: ['server.py']
          }
        }
      };
      writeFileSync(testConfigPath, JSON.stringify(existingConfig, null, 2));
      
      // Add new server
      const newConfig = MCPConfigManager.generateKiroConfig();
      MCPConfigManager.writeConfigFile(testConfigPath, newConfig);
      
      const mergedConfig = JSON.parse(readFileSync(testConfigPath, 'utf8'));
      expect(mergedConfig.mcpServers['existing-server']).toBeDefined();
      expect(mergedConfig.mcpServers['mcp-mysql-analyzer']).toBeDefined();
    });

    it('should setup Kiro config with default path', () => {
      const defaultPath = '.kiro/settings/mcp.json';
      
      // Create directory if it doesn't exist
      if (!existsSync('.kiro/settings')) {
        mkdirSync('.kiro/settings', { recursive: true });
      }
      
      MCPConfigManager.setupKiroConfig();
      
      expect(existsSync(defaultPath)).toBe(true);
      
      // Clean up
      if (existsSync(defaultPath)) {
        unlinkSync(defaultPath);
      }
    });
  });

  describe('Environment Schema Validation', () => {
    it('should enforce minimum values', () => {
      expect(() => envSchema.parse({ MYSQL_HOST: '' })).toThrow();
      expect(() => envSchema.parse({ MYSQL_PORT: 0 })).toThrow();
      expect(() => envSchema.parse({ MYSQL_CONNECTION_LIMIT: 0 })).toThrow();
    });

    it('should enforce maximum values', () => {
      expect(() => envSchema.parse({ MYSQL_PORT: 70000 })).toThrow();
      expect(() => envSchema.parse({ MYSQL_CONNECTION_LIMIT: 150 })).toThrow();
      expect(() => envSchema.parse({ DEFAULT_SAMPLE_LIMIT: 2000000 })).toThrow();
    });

    it('should coerce string numbers to numbers', () => {
      const result = envSchema.parse({
        MYSQL_PORT: '3306',
        MYSQL_CONNECTION_LIMIT: '10'
      });
      
      expect(typeof result.MYSQL_PORT).toBe('number');
      expect(typeof result.MYSQL_CONNECTION_LIMIT).toBe('number');
      expect(result.MYSQL_PORT).toBe(3306);
      expect(result.MYSQL_CONNECTION_LIMIT).toBe(10);
    });
  });
});