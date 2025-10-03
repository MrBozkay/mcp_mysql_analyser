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

## Using the Client

This project includes a command-line client to interact with the server.

### Listing Available Tools

To see a list of all available tools, run:

```bash
node dist/client.js list
```

### Calling a Tool

To call a specific tool, use the `call` command, followed by the tool name and its arguments in `key=value` format.

- **Syntax:**
  ```bash
  node dist/client.js call <tool_name> [argument1=value1] [argument2=value2] ...
  ```

- **Example: List tables in a database**
  ```bash
  node dist/client.js call list_tables database=playbox
  ```

- **Example: Find duplicates with a JSON argument**
  ```bash
  node dist/client.js call find_duplicates database=playbox table=clients columns='["display_name"]'
  ```

## Available Tools

### Schema Tools

- `connect(params)`: Connects to the MySQL database.
- `list_databases()`: Lists all databases.
- `list_tables(params)`: Lists all tables in a database.
- `table_info(params)`: Gets detailed information about a table, including columns, indexes, and foreign keys.
- `get_table_ddl(params)`: Gets the `CREATE TABLE` statement for a table.

### Analysis Tools

- `profile_table(params)`: Profiles a table with basic statistics, including row count, column stats, and sample data.
- `analyze_numeric_columns(params)`: Analyzes all numeric columns in a table and returns statistics like min, max, average, and standard deviation.
- `get_value_distribution(params)`: Gets the value distribution for a column.
- `detect_outliers(params)`: Detects outliers in a numeric column using the Z-score method.
- `find_duplicates(params)`: Finds duplicate rows based on a combination of columns.
- `get_null_report(params)`: Generates a report of NULL values for all columns in a table.

### Churn Tools

These tools generate SQL queries for churn analysis. They return a SQL string that you can then execute.

- `generate_churn_sql_basic(params)`: Generates SQL for a basic monthly churn analysis.
- `generate_cohort_sql(params)`: Generates SQL for a cohort retention analysis.
- `generate_survival_sql(params)`: Generates SQL for a Kaplan-Meier survival curve analysis.
- `generate_mrr_churn_sql(params)`: Generates SQL for an MRR churn analysis.
- `suggest_churn_mapping(params)`: Suggests potential user ID and timestamp columns for churn analysis.

## Development

### Running Tests

To run the test suite:

```bash
npm test
```
