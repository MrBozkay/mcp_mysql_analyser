# MCP Server for MySQL

**MCP Server for MySQL** is a powerful tool that bridges the gap between Large Language Models (LLMs) like Claude and your MySQL databases. It allows you to interact with your database using natural language, inspect schemas, execute queries, and perform data analysis without writing a single line of SQL.

This tool is designed for developers, data analysts, and database administrators who want to leverage the power of AI for database management and exploration.

## Key Features

- **Natural Language Interaction:** Interact with your database using plain English.
- **Schema Inspection:** Allow LLMs to understand your database structure without manual explanations.
- **SQL Query Execution:** Send SQL queries directly to your MySQL database from your conversations with an LLM.
- **Data Analysis:** Have an LLM analyze your database data and return insights.

## Installation

This package is hosted on the GitHub Packages registry. To install it, you first need to authenticate with GitHub Packages.

1.  **Authenticate with GitHub Packages**

    Create a `.npmrc` file in your home directory (or in your project directory) and add the following lines. Replace `YOUR_PAT` with a [Personal Access Token](https://github.com/settings/tokens) that has the `read:packages` scope.

    ```
    //npm.pkg.github.com/:_authToken=YOUR_PAT
    @MrBozkay:registry=https://npm.pkg.github.com/
    ```

2.  **Install the Package**

    You can now install the package globally using npm:

    ```bash
    npm install -g @mrbozkay/mcp_mysql_analyser
    ```

    This will make the `mcp-mysql-analyzer` command available in your terminal.

## Usage

### As a Command-Line Tool

You can use the `mcp-mysql-analyzer` command-line tool to interact with your database.

-   **List Available Tools:**

    ```bash
    mcp-mysql-analyzer list
    ```

-   **Call a Tool:**

    ```bash
    mcp-mysql-analyzer call <tool_name> [argument1=value1] [argument2=value2] ...
    ```

    **Example:**

    ```bash
    mcp-mysql-analyzer call list_tables database=playbox
    ```

### As an MCP Server

You can use this project as an MCP server in applications like Claude Desktop and Cursor.

**For Claude Desktop:**

Add the following to your `claude_desktop_config.json` file:

```json
{
  "mcpServers": {
    "mcp_mysql_analyzer": {
      "command": "npx",
      "args": [
        "-y",
        "@mrbozkay/mcp_mysql_analyser"
      ],
      "env": {
        "MYSQL_HOST": "127.0.0.1",
        "MYSQL_PORT": "3306",
        "MYSQL_USER": "your_username",
        "MYSQL_PASS": "your_password",
        "MYSQL_DB": "your_database"
      }
    }
  }
}
```

**For Cursor IDE (Version: 0.47+):**

Add this to your `mcp.json`:

```json
{
  "mcpServers": {
    "MySQL": {
      "command": "npx",
      "args": [
        "mcprunner",
        "MYSQL_HOST=127.0.0.1",
        "MYSQL_PORT=3306",
        "MYSQL_USER=root",
        "MYSQL_PASS=root",
        "MYSQL_DB=demostore",
        "--",
        "npx",
        "-y",
        "@mrbozkay/mcp_mysql_analyser"
      ]
    }
  }
}
```

## Available Tools

- `connect(params)`: Connects to the MySQL database.
- `list_databases()`: Lists all databases.
- `list_tables(params)`: Lists all tables in a database.
- `table_info(params)`: Gets detailed information about a table.
- `get_table_ddl(params)`: Gets the `CREATE TABLE` statement for a table.
- `profile_table(params)`: Profiles a table with basic statistics.
- `analyze_numeric_columns(params)`: Analyzes numeric columns in a table.
- `get_value_distribution(params)`: Gets the value distribution for a column.
- `detect_outliers(params)`: Detects outliers in a numeric column.
- `find_duplicates(params)`: Finds duplicate rows based on a combination of columns.
- `get_null_report(params)`: Generates a report of NULL values for all columns in a table.
- `generate_churn_sql_basic(params)`: Generates SQL for a basic monthly churn analysis.
- `generate_cohort_sql(params)`: Generates SQL for a cohort retention analysis.
- `generate_survival_sql(params)`: Generates SQL for a Kaplan-Meier survival curve analysis.
- `generate_mrr_churn_sql(params)`: Generates SQL for an MRR churn analysis.
- `suggest_churn_mapping(params)`: Suggests potential user ID and timestamp columns for churn analysis.

## Contributing

Contributions are welcome! Please feel free to open an issue or submit a pull request on the [GitHub repository](https://github.com/MrBozkay/mcp_mysql_analyser).

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.