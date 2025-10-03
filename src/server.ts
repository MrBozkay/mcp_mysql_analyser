#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ErrorCode,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import { 
  connectParamsSchema, 
  databaseParamsSchema,
  tableParamsSchema,
  sampleParamsSchema,
  distributionParamsSchema,
  outlierParamsSchema,
  duplicatesParamsSchema,
  sqlParamsSchema,
  columnParamsSchema,
} from './config.js';

import { closePool } from './database.js';

// Import tools
import {
  connect,
  listDatabases,
  listTables,
  getTableInfo,
  getTableDDL
} from './tools/schema.js';
import {
  profileTable,
  analyzeNumericColumns,
  getValueDistribution,
  detectOutliers,
  findDuplicates,
  getNullReport,
} from './tools/analysis.js';
import {
  generateChurnSqlBasic,
  generateCohortSql,
  generateSurvivalSql,
  generateMrrChurnSql,
  suggestChurnMapping,
  churnBasicParamsSchema,
  cohortParamsSchema,
  survivalParamsSchema,
  mrrChurnParamsSchema,
  churnMappingParamsSchema,
} from './tools/churn.js';

// Create server instance
const server = new Server(
  {
    name: 'mcp-mysql-analyzer',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool definitions
const TOOLS = [
  {
    name: 'connect',
    description: 'Connect to MySQL database with optional parameters',
    inputSchema: {
      type: 'object',
      properties: {
        host: { type: 'string', description: 'MySQL host' },
        port: { type: 'number', description: 'MySQL port' },
        user: { type: 'string', description: 'MySQL user' },
        password: { type: 'string', description: 'MySQL password' },
        database: { type: 'string', description: 'Default database' },
        ssl: { type: 'boolean', description: 'Use SSL connection' },
      },
    },
    handler: connect,
    schema: connectParamsSchema,
  },
  {
    name: 'list_databases',
    description: 'List all available databases',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    handler: listDatabases,
    schema: z.object({}),
  },
  {
    name: 'list_tables',
    description: 'List all tables in the current or specified database',
    inputSchema: {
      type: 'object',
      properties: {
        database: { type: 'string', description: 'Database name (optional)' },
      },
    },
    handler: listTables,
    schema: databaseParamsSchema,
  },
  {
    name: 'table_info',
    description: 'Get detailed information about a table including columns, indexes, and foreign keys',
    inputSchema: {
      type: 'object',
      properties: {
        database: { type: 'string', description: 'Database name (optional)' },
        table: { type: 'string', description: 'Table name' },
      },
      required: ['table'],
    },
    handler: getTableInfo,
    schema: tableParamsSchema,
  },
  {
    name: 'get_table_ddl',
    description: 'Get the CREATE TABLE statement for a table',
    inputSchema: {
      type: 'object',
      properties: {
        database: { type: 'string', description: 'Database name (optional)' },
        table: { type: 'string', description: 'Table name' },
      },
      required: ['table'],
    },
    handler: getTableDDL,
    schema: tableParamsSchema,
  },
  {
    name: 'profile_table',
    description: 'Profile a table with basic statistics',
    inputSchema: {
      type: 'object',
      properties: {
        database: { type: 'string', description: 'Database name (optional)' },
        table: { type: 'string', description: 'Table name' },
        sample_limit: { type: 'number', description: 'Number of rows to sample' },
      },
      required: ['table'],
    },
    handler: profileTable,
    schema: sampleParamsSchema,
  },
  {
    name: 'analyze_numeric_columns',
    description: 'Analyze numeric columns in a table',
    inputSchema: {
      type: 'object',
      properties: {
        database: { type: 'string', description: 'Database name (optional)' },
        table: { type: 'string', description: 'Table name' },
        sample_limit: { type: 'number', description: 'Number of rows to sample' },
      },
      required: ['table'],
    },
    handler: analyzeNumericColumns,
    schema: sampleParamsSchema,
  },
  {
    name: 'get_value_distribution',
    description: 'Get value distribution for a column',
    inputSchema: {
      type: 'object',
      properties: {
        database: { type: 'string', description: 'Database name (optional)' },
        table: { type: 'string', description: 'Table name' },
        column: { type: 'string', description: 'Column name' },
        topk: { type: 'number', description: 'Number of top values to return' },
      },
      required: ['table', 'column'],
    },
    handler: getValueDistribution,
    schema: distributionParamsSchema,
  },
  {
    name: 'detect_outliers',
    description: 'Detect outliers in a numeric column using Z-score',
    inputSchema: {
      type: 'object',
      properties: {
        database: { type: 'string', description: 'Database name (optional)' },
        table: { type: 'string', description: 'Table name' },
        column: { type: 'string', description: 'Column name' },
        z_threshold: { type: 'number', description: 'Z-score threshold for outliers' },
        limit: { type: 'number', description: 'Maximum number of outliers to return' },
      },
      required: ['table', 'column'],
    },
    handler: detectOutliers,
    schema: outlierParamsSchema,
  },
  {
    name: 'find_duplicates',
    description: 'Find duplicate rows based on a combination of columns',
    inputSchema: {
      type: 'object',
      properties: {
        database: { type: 'string', description: 'Database name (optional)' },
        table: { type: 'string', description: 'Table name' },
        columns: { type: 'array', items: { type: 'string' }, description: 'Columns to check for duplicates' },
        limit_groups: { type: 'number', description: 'Maximum number of duplicate groups to return' },
      },
      required: ['table', 'columns'],
    },
    handler: findDuplicates,
    schema: duplicatesParamsSchema,
  },
  {
    name: 'get_null_report',
    description: 'Get a report of NULL values for all columns in a table',
    inputSchema: {
      type: 'object',
      properties: {
        database: { type: 'string', description: 'Database name (optional)' },
        table: { type: 'string', description: 'Table name' },
      },
      required: ['table'],
    },
    handler: getNullReport,
    schema: tableParamsSchema,
  },
  {
    name: 'generate_churn_sql_basic',
    description: 'Generate basic churn analysis SQL',
    inputSchema: {
      type: 'object',
      properties: {
        database: { type: 'string', description: 'Database name (optional)' },
        user_table: { type: 'string', description: 'Users table' },
        user_id_col: { type: 'string', description: 'User ID column' },
        activity_table: { type: 'string', description: 'Activity table' },
        activity_user_col: { type: 'string', description: 'Activity user column' },
        activity_time_col: { type: 'string', description: 'Activity time column' },
        inactivity_days: { type: 'number', description: 'Days of inactivity to be considered churn' },
        month_floor: { type: 'boolean', description: 'Floor the date to the beginning of the month' },
      },
      required: ['user_table', 'user_id_col', 'activity_table', 'activity_user_col', 'activity_time_col'],
    },
    handler: generateChurnSqlBasic,
    schema: churnBasicParamsSchema,
  },
  {
    name: 'generate_cohort_sql',
    description: 'Generate cohort retention analysis SQL',
    inputSchema: {
      type: 'object',
      properties: {
        database: { type: 'string', description: 'Database name (optional)' },
        activity_table: { type: 'string', description: 'Activity table' },
        activity_user_col: { type: 'string', description: 'Activity user column' },
        activity_time_col: { type: 'string', description: 'Activity time column' },
        observation_months: { type: 'number', description: 'Number of months to observe' },
      },
      required: ['activity_table', 'activity_user_col', 'activity_time_col'],
    },
    handler: generateCohortSql,
    schema: cohortParamsSchema,
  },
  {
    name: 'generate_survival_sql',
    description: 'Generate survival curve analysis SQL',
    inputSchema: {
      type: 'object',
      properties: {
        database: { type: 'string', description: 'Database name (optional)' },
        activity_table: { type: 'string', description: 'Activity table' },
        activity_user_col: { type: 'string', description: 'Activity user column' },
        activity_time_col: { type: 'string', description: 'Activity time column' },
        inactivity_days: { type: 'number', description: 'Days of inactivity to be considered churn' },
        max_months: { type: 'number', description: 'Maximum number of months to observe' },
      },
      required: ['activity_table', 'activity_user_col', 'activity_time_col'],
    },
    handler: generateSurvivalSql,
    schema: survivalParamsSchema,
  },
  {
    name: 'generate_mrr_churn_sql',
    description: 'Generate MRR churn analysis SQL',
    inputSchema: {
      type: 'object',
      properties: {
        database: { type: 'string', description: 'Database name (optional)' },
        revenue_table: { type: 'string', description: 'Revenue table' },
        rev_user_col: { type: 'string', description: 'Revenue user column' },
        rev_amount_col: { type: 'string', description: 'Revenue amount column' },
        rev_time_col: { type: 'string', description: 'Revenue time column' },
        amount_is_monthly: { type: 'boolean', description: 'Is the amount monthly?' },
      },
      required: ['revenue_table', 'rev_user_col', 'rev_amount_col', 'rev_time_col'],
    },
    handler: generateMrrChurnSql,
    schema: mrrChurnParamsSchema,
  },
  {
    name: 'suggest_churn_mapping',
    description: 'Suggest churn mapping for tables',
    inputSchema: {
      type: 'object',
      properties: {
        database: { type: 'string', description: 'Database name (optional)' },
        tables: { type: 'array', items: { type: 'string' }, description: 'Tables to map' },
      },
      required: ['tables'],
    },
    handler: suggestChurnMapping,
    schema: churnMappingParamsSchema,
  },
];

// Register handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOLS.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  const tool = TOOLS.find(t => t.name === name);
  if (!tool) {
    throw new McpError(
      ErrorCode.MethodNotFound,
      `Tool "${name}" not found`
    );
  }
  
  try {
    // Validate arguments
    const validatedArgs = tool.schema.parse(args || {});
    
    // Execute tool
    const result = await (tool.handler as any)(validatedArgs);
    
    // Return result as JSON text
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Invalid parameters: ${error.errors.map(e => e.message).join(', ')}`
      );
    }
    
    throw new McpError(
      ErrorCode.InternalError,
      error.message || 'An error occurred'
    );
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await closePool();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closePool();
  process.exit(0);
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error('MCP MySQL Analyzer Server started');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
