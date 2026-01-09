#!/usr/bin/env node

/**
 * CLI wrapper for MCP MySQL Analyzer
 * Allows running the server globally via npm
 */

import { spawn } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function showHelp() {
  console.log(`
MCP MySQL Analyzer - Global CLI

Usage:
  mcp-mysql-analyzer [command] [options]

Commands:
  server          Start MCP server (default)
  setup           Setup MCP configuration for Kiro IDE
  validate        Validate MCP configuration
  env             Show environment configuration
  help            Show this help message

Server Mode (default):
  mcp-mysql-analyzer
  mcp-mysql-analyzer server

Setup Commands:
  mcp-mysql-analyzer setup [--force] [--config=path]
  mcp-mysql-analyzer validate [--config=path]
  mcp-mysql-analyzer env

Examples:
  # Start MCP server
  mcp-mysql-analyzer

  # Setup for Kiro IDE
  mcp-mysql-analyzer setup

  # Setup with force overwrite
  mcp-mysql-analyzer setup --force

  # Validate existing configuration
  mcp-mysql-analyzer validate

Environment Variables:
  MYSQL_HOST              MySQL host (default: localhost)
  MYSQL_PORT              MySQL port (default: 3306)
  MYSQL_USER              MySQL user (default: root)
  MYSQL_PASSWORD          MySQL password
  MYSQL_DB                Default database
  MYSQL_SSL               Use SSL (default: false)
  MYSQL_CONNECTION_LIMIT  Connection limit (default: 5)
  DEFAULT_SAMPLE_LIMIT    Sample limit (default: 10000)
  DEFAULT_QUERY_TIMEOUT   Query timeout ms (default: 15000)
`);
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'server';

  switch (command) {
    case 'server':
    case undefined:
      // Start MCP server
      const serverPath = resolve(__dirname, 'server.js');
      const serverProcess = spawn('node', [serverPath], {
        stdio: 'inherit',
        env: process.env
      });
      
      serverProcess.on('error', (error) => {
        console.error('Failed to start MCP server:', error.message);
        process.exit(1);
      });
      
      serverProcess.on('exit', (code) => {
        process.exit(code || 0);
      });
      break;

    case 'setup':
    case 'validate':
    case 'env':
      // Run setup commands
      const setupPath = resolve(__dirname, 'setup-mcp.js');
      const setupArgs = [setupPath, command, ...args.slice(1)];
      
      const setupProcess = spawn('node', setupArgs, {
        stdio: 'inherit',
        env: process.env
      });
      
      setupProcess.on('error', (error) => {
        console.error('Failed to run setup command:', error.message);
        process.exit(1);
      });
      
      setupProcess.on('exit', (code) => {
        process.exit(code || 0);
      });
      break;

    case 'help':
    case '--help':
    case '-h':
      showHelp();
      break;

    default:
      console.error(`Unknown command: ${command}`);
      console.log('Use "mcp-mysql-analyzer help" for usage information');
      process.exit(1);
  }
}

// Handle process signals
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down...');
  process.exit(0);
});

main().catch(error => {
  console.error('CLI Error:', error);
  process.exit(1);
});