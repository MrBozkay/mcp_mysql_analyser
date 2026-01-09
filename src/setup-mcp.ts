#!/usr/bin/env node

/**
 * MCP Configuration Setup Utility
 * 
 * This utility helps set up the MCP MySQL Analyzer server configuration
 * for Kiro IDE and other MCP clients.
 */

import { MCPConfigManager, EnvironmentValidator } from './config.js';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

interface SetupOptions {
  configPath?: string;
  force?: boolean;
  validate?: boolean;
}

class MCPSetup {
  /**
   * Setup MCP configuration for Kiro IDE
   */
  static async setupKiro(options: SetupOptions = {}): Promise<void> {
    const configPath = options.configPath || '.kiro/settings/mcp.json';
    
    console.log('🔧 Setting up MCP MySQL Analyzer for Kiro IDE...\n');
    
    // Validate environment first
    console.log('1️⃣ Validating environment configuration...');
    const envValidation = EnvironmentValidator.validate();
    
    if (!envValidation.isValid) {
      console.error('❌ Environment validation failed:');
      envValidation.errors.forEach(error => console.error(`  - ${error}`));
      console.error('\n💡 Please fix your .env file or environment variables before continuing.');
      process.exit(1);
    }
    
    if (envValidation.warnings.length > 0) {
      console.warn('⚠️  Configuration warnings:');
      envValidation.warnings.forEach(warning => console.warn(`  - ${warning}`));
      console.log('');
    }
    
    console.log('✅ Environment configuration is valid\n');
    
    // Check if config file already exists
    console.log('2️⃣ Checking existing configuration...');
    if (existsSync(configPath) && !options.force) {
      console.log(`📄 Configuration file already exists: ${configPath}`);
      console.log('💡 Use --force to overwrite existing configuration');
      return;
    }
    
    // Generate and write configuration
    console.log('3️⃣ Generating MCP configuration...');
    try {
      const config = MCPConfigManager.generateKiroConfig();
      
      console.log('📋 Generated configuration:');
      console.log(`  - Server name: ${config.serverName}`);
      console.log(`  - Command: ${config.command} ${config.args.join(' ')}`);
      console.log(`  - Auto-approve tools: ${config.autoApprove?.length || 0} tools`);
      console.log(`  - MySQL host: ${config.env.MYSQL_HOST}:${config.env.MYSQL_PORT}`);
      console.log('');
      
      console.log('4️⃣ Writing configuration file...');
      MCPConfigManager.writeConfigFile(configPath, config);
      
      console.log(`✅ MCP configuration written to: ${configPath}`);
      console.log('');
      console.log('🎉 Setup complete! Next steps:');
      console.log('  1. Build the project: npm run build');
      console.log('  2. Restart Kiro IDE to load the new MCP server');
      console.log('  3. The server will be available as "mcp-mysql-analyzer"');
      
    } catch (error) {
      console.error('❌ Failed to generate MCP configuration:', (error as Error).message);
      process.exit(1);
    }
  }
  
  /**
   * Validate existing MCP configuration
   */
  static async validateConfig(configPath: string = '.kiro/settings/mcp.json'): Promise<void> {
    console.log('🔍 Validating MCP configuration...\n');
    
    if (!existsSync(configPath)) {
      console.error(`❌ Configuration file not found: ${configPath}`);
      console.log('💡 Run setup first: npm run setup-mcp');
      process.exit(1);
    }
    
    try {
      const configContent = readFileSync(configPath, 'utf8');
      const fullConfig = JSON.parse(configContent);
      
      if (!fullConfig.mcpServers || !fullConfig.mcpServers['mcp-mysql-analyzer']) {
        console.error('❌ MCP MySQL Analyzer server not found in configuration');
        process.exit(1);
      }
      
      const serverConfig = fullConfig.mcpServers['mcp-mysql-analyzer'];
      const mcpConfig = {
        serverName: 'mcp-mysql-analyzer',
        command: serverConfig.command,
        args: serverConfig.args,
        env: serverConfig.env,
        autoApprove: serverConfig.autoApprove,
        disabled: serverConfig.disabled
      };
      
      const validation = MCPConfigManager.validateConfig(mcpConfig);
      
      if (!validation.isValid) {
        console.error('❌ Configuration validation failed:');
        validation.errors.forEach(error => console.error(`  - ${error}`));
        process.exit(1);
      }
      
      console.log('✅ MCP configuration is valid');
      console.log(`📄 Configuration file: ${configPath}`);
      console.log(`🔧 Server name: ${mcpConfig.serverName}`);
      console.log(`⚡ Command: ${mcpConfig.command} ${mcpConfig.args.join(' ')}`);
      console.log(`🔒 Auto-approve: ${mcpConfig.autoApprove?.length || 0} tools`);
      console.log(`🚫 Disabled: ${mcpConfig.disabled ? 'Yes' : 'No'}`);
      
    } catch (error) {
      console.error('❌ Failed to validate configuration:', (error as Error).message);
      process.exit(1);
    }
  }
  
  /**
   * Show current environment configuration
   */
  static showEnvironment(): void {
    console.log('🌍 Current environment configuration:\n');
    
    const validation = EnvironmentValidator.validate();
    
    if (!validation.isValid) {
      console.error('❌ Environment validation failed:');
      validation.errors.forEach(error => console.error(`  - ${error}`));
      return;
    }
    
    const config = validation.config;
    
    console.log('📊 MySQL Configuration:');
    console.log(`  Host: ${config.MYSQL_HOST}`);
    console.log(`  Port: ${config.MYSQL_PORT}`);
    console.log(`  User: ${config.MYSQL_USER}`);
    console.log(`  Password: ${config.MYSQL_PASSWORD ? '***' : '(empty)'}`);
    console.log(`  Database: ${config.MYSQL_DB || '(not set)'}`);
    console.log(`  SSL: ${config.MYSQL_SSL}`);
    console.log('');
    console.log('⚙️  Performance Settings:');
    console.log(`  Connection Limit: ${config.MYSQL_CONNECTION_LIMIT}`);
    console.log(`  Sample Limit: ${config.DEFAULT_SAMPLE_LIMIT}`);
    console.log(`  Query Timeout: ${config.DEFAULT_QUERY_TIMEOUT}ms`);
    
    if (validation.warnings.length > 0) {
      console.log('');
      console.warn('⚠️  Warnings:');
      validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'setup':
    case undefined:
      await MCPSetup.setupKiro({
        force: args.includes('--force'),
        configPath: args.find(arg => arg.startsWith('--config='))?.split('=')[1]
      });
      break;
      
    case 'validate':
      await MCPSetup.validateConfig(
        args.find(arg => arg.startsWith('--config='))?.split('=')[1]
      );
      break;
      
    case 'env':
    case 'environment':
      MCPSetup.showEnvironment();
      break;
      
    case 'help':
    case '--help':
    case '-h':
      console.log('MCP MySQL Analyzer Setup Utility\n');
      console.log('Usage:');
      console.log('  npm run setup-mcp [command] [options]\n');
      console.log('Commands:');
      console.log('  setup     Set up MCP configuration for Kiro IDE (default)');
      console.log('  validate  Validate existing MCP configuration');
      console.log('  env       Show current environment configuration');
      console.log('  help      Show this help message\n');
      console.log('Options:');
      console.log('  --force           Overwrite existing configuration');
      console.log('  --config=<path>   Use custom configuration file path');
      break;
      
    default:
      console.error(`❌ Unknown command: ${command}`);
      console.log('💡 Use "npm run setup-mcp help" for usage information');
      process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('setup-mcp.js')) {
  main().catch(error => {
    console.error('💥 Setup error:', error);
    process.exit(1);
  });
}

export { MCPSetup };