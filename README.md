# MySQL Analysis Server for Gemini

This project provides a set of tools for analyzing and interacting with a MySQL database, designed to be used as a custom tool server for Gemini.

It allows you to connect to a MySQL database, explore the schema, analyze table profiles, and generate complex SQL queries for churn analysis.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm
- A running MySQL database

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/mcp-mysql-analyzer.git
   cd mcp-mysql-analyzer
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

### Configuration

1. Create a `.env` file by copying the example file:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file with your MySQL database connection details:
   ```
   MYSQL_HOST=your_mysql_host
   MYSQL_PORT=your_mysql_port
   MYSQL_USER=your_mysql_user
   MYSQL_PASSWORD=your_mysql_password
   MYSQL_DB=your_mysql_database
   ```

## Running the Server

### Development

To run the server in development mode with hot-reloading:

```bash
npm run dev
```

### Production

1. Build the TypeScript code:
   ```bash
   npm run build
   ```

2. Start the server:
   ```bash
   npm start
   ```

### Docker

You can also run the server in a Docker container.

1. Build the Docker image:
   ```bash
   docker build -t mcp-mysql-analyzer .
   ```

2. Run the Docker container:
   ```bash
   docker run -i --rm \
     -e MYSQL_HOST=your_mysql_host \
     -e MYSQL_PORT=your_mysql_port \
     -e MYSQL_USER=your_mysql_user \
     -e MYSQL_PASSWORD=your_mysql_password \
     -e MYSQL_DB=your_mysql_database \
     mcp-mysql-analyzer
   ```

## Connecting as an MCP

To use this server as a custom tool for Gemini, you need to configure your Gemini application to connect to the server's standard input/output.

Here is an example of how you might configure this in a Node.js application:

```javascript
const { spawn } = require('child_process');

// Start the MCP server process
const mcpServer = spawn('npm', ['start'], { 
  cwd: '/path/to/mcp-mysql-analyzer',
  stdio: ['pipe', 'pipe', 'inherit'] 
});

// Now you can communicate with the server over mcpServer.stdin and mcpServer.stdout

// Example of sending a request
const request = {
  tool_code: 'default_api.listDatabases()'
};
mcpServer.stdin.write(JSON.stringify(request) + '\n');

// Listen for responses
mcpServer.stdout.on('data', (data) => {
  console.log(`Received response: ${data}`);
});
```

## Available Tools

### Schema Tools

#### `connect(params)`
Connects to the MySQL database.

- **Example:**
  ```
  default_api.connect({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'password',
    database: 'my_db'
  })
  ```

#### `listDatabases()`
Lists all databases.

- **Example:**
  ```
  default_api.listDatabases()
  ```

#### `listTables(params)`
Lists all tables in a database.

- **Example:**
  ```
  default_api.listTables({ database: 'my_db' })
  ```

#### `getTableInfo(params)`
Gets detailed information about a table, including columns, indexes, and foreign keys.

- **Example:**
  ```
  default_api.getTableInfo({ table: 'users' })
  ```

#### `getTableDDL(params)`
Gets the `CREATE TABLE` statement for a table.

- **Example:**
  ```
  default_api.getTableDDL({ table: 'users' })
  ```

### Analysis Tools

#### `profileTable(params)`
Profiles a table with basic statistics, including row count, column stats, and sample data.

- **Example:**
  ```
  default_api.profileTable({ table: 'users', sample_limit: 100 })
  ```

#### `analyzeNumericColumns(params)`
Analyzes all numeric columns in a table and returns statistics like min, max, average, and standard deviation.

- **Example:**
  ```
  default_api.analyzeNumericColumns({ table: 'sales', sample_limit: 1000 })
  ```

#### `getValueDistribution(params)`
Gets the value distribution for a column.

- **Example:**
  ```
  default_api.getValueDistribution({ table: 'users', column: 'country', topk: 20 })
  ```

#### `detectOutliers(params)`
Detects outliers in a numeric column using the Z-score method.

- **Example:**
  ```
  default_api.detectOutliers({ table: 'orders', column: 'amount', z_threshold: 3 })
  ```

#### `findDuplicates(params)`
Finds duplicate rows based on a combination of columns.

- **Example:**
  ```
  default_api.findDuplicates({ table: 'customers', columns: ['email', 'phone_number'] })
  ```

#### `getNullReport(params)`
Generates a report of NULL values for all columns in a table.

- **Example:**
  ```
  default_api.getNullReport({ table: 'products' })
  ```

### Churn Tools

These tools generate SQL queries for churn analysis. They return a SQL string that you can then execute.

#### `generateChurnSqlBasic(params)`
Generates SQL for a basic monthly churn analysis.

- **Example:**
  ```
  default_api.generateChurnSqlBasic({
    user_table: 'users',
    user_id_col: 'id',
    activity_table: 'user_activity',
    activity_user_col: 'user_id',
    activity_time_col: 'timestamp'
  })
  ```

#### `generateCohortSql(params)`
Generates SQL for a cohort retention analysis.

- **Example:**
  ```
  default_api.generateCohortSql({
    activity_table: 'user_activity',
    activity_user_col: 'user_id',
    activity_time_col: 'timestamp',
    observation_months: 12
  })
  ```

#### `generateSurvivalSql(params)`
Generates SQL for a Kaplan-Meier survival curve analysis.

- **Example:**
  ```
  default_api.generateSurvivalSql({
    activity_table: 'user_activity',
    activity_user_col: 'user_id',
    activity_time_col: 'timestamp'
  })
  ```

#### `generateMrrChurnSql(params)`
Generates SQL for an MRR churn analysis.

- **Example:**
  ```
  default_api.generateMrrChurnSql({
    revenue_table: 'subscriptions',
    rev_user_col: 'user_id',
    rev_amount_col: 'mrr',
    rev_time_col: 'timestamp'
  })
  ```

#### `suggestChurnMapping(params)`
Suggests potential user ID and timestamp columns for churn analysis.

- **Example:**
  ```
  default_api.suggestChurnMapping({ tables: ['users', 'user_activity'] })
  ```

## Development

### Running Tests

To run the test suite:

```bash
npm test
```
"# mcp_mysql_analyser" 
