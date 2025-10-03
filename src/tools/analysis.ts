import {
  SampleParams,
  DistributionParams,
  OutlierParams,
  DuplicatesParams,
  TableParams,
  ColumnParams,
} from '../config.js';
import { executeReadOnlyQuery } from '../database.js';

// Profile table with basic statistics
export async function profileTable(params: SampleParams) {
  const { database, table, sample_limit } = params;
  
  // Get row count
  const countResult = await executeReadOnlyQuery<{ count: number }>(
    `SELECT COUNT(*) as count FROM \`${table}\``,
    [],
    database
  );
  const totalRows = Number(countResult[0].count);
  
  // Get sample rows
  const sampleRows = await executeReadOnlyQuery(
    `SELECT * FROM \`${table}\` LIMIT ?`,
    [sample_limit],
    database
  );
  
  // Get column statistics
  const columnStatsQuery = `
    SELECT 
      COLUMN_NAME as columnName,
      DATA_TYPE as dataType,
      IS_NULLABLE as isNullable,
      COLUMN_KEY as columnKey
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = IFNULL(?, DATABASE())
      AND TABLE_NAME = ?
    ORDER BY ORDINAL_POSITION
  `;
  
  const columns = await executeReadOnlyQuery(
    columnStatsQuery,
    [database || null, table],
    database
  );
  
  // For each column, get null count and cardinality
  const columnStats = await Promise.all(
    columns.map(async (col) => {
      const statsQuery = `
        SELECT 
          COUNT(*) as total,
          COUNT(DISTINCT \`${col.columnName}\`) as distinctCount,
          COUNT(\`${col.columnName}\`) as nonNullCount
        FROM \`${table}\`
        LIMIT ${sample_limit}
      `;
      
      const stats = await executeReadOnlyQuery<{
        total: number;
        distinctCount: number;
        nonNullCount: number;
      }>(statsQuery, [], database);
      
      const stat = stats[0];
      const nullCount = Number(stat.total) - Number(stat.nonNullCount);
      
      return {
        name: col.columnName,
        type: col.dataType,
        nullable: col.isNullable === 'YES',
        key: col.columnKey,
        nullCount,
        nullPercentage: (nullCount / Number(stat.total)) * 100,
        distinctCount: Number(stat.distinctCount),
        cardinality: Number(stat.distinctCount) / Number(stat.nonNullCount) || 0,
      };
    })
  );
  
  return {
    tableName: table,
    totalRows,
    sampleSize: sampleRows.length,
    columns: columnStats,
    sampleData: sampleRows.slice(0, 10), // Return first 10 rows as sample
  };
}

// Analyze numeric columns
export async function analyzeNumericColumns(params: SampleParams) {
  const { database, table, sample_limit } = params;
  
  // Get numeric columns
  const numericColsQuery = `
    SELECT COLUMN_NAME as columnName
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = IFNULL(?, DATABASE())
      AND TABLE_NAME = ?
      AND DATA_TYPE IN ('int', 'integer', 'tinyint', 'smallint', 'mediumint', 
                        'bigint', 'decimal', 'numeric', 'float', 'double', 'real')
    ORDER BY ORDINAL_POSITION
  `;
  
  const numericCols = await executeReadOnlyQuery<{ columnName: string }>(
    numericColsQuery,
    [database || null, table],
    database
  );
  
  if (numericCols.length === 0) {
    return {
      table,
      message: 'No numeric columns found',
      columns: [],
    };
  }
  
  // Build statistics query for all numeric columns
  const statsParts = numericCols.map(col => `
    MIN(\`${col.columnName}\`) as \`${col.columnName}_min\`,
    MAX(\`${col.columnName}\`) as \`${col.columnName}_max\`,
    AVG(\`${col.columnName}\`) as \`${col.columnName}_avg\`,
    STDDEV(\`${col.columnName}\`) as \`${col.columnName}_stddev\`,
    COUNT(\`${col.columnName}\`) as \`${col.columnName}_count\`,
    COUNT(DISTINCT \`${col.columnName}\`) as \`${col.columnName}_distinct\`
  `);
  
  const statsQuery = `
    SELECT ${statsParts.join(',')}
    FROM (SELECT * FROM \`${table}\` LIMIT ${sample_limit}) AS sampled
  `;
  
  const statsResult = await executeReadOnlyQuery(statsQuery, [], database);
  const stats = statsResult[0] || {};
  
  // Parse results
  const columnStats = numericCols.map(col => {
    const name = col.columnName;
    return {
      column: name,
      min: stats[`${name}_min`],
      max: stats[`${name}_max`],
      avg: stats[`${name}_avg`],
      stddev: stats[`${name}_stddev`],
      nonNullCount: stats[`${name}_count`],
      distinctCount: stats[`${name}_distinct`],
    };
  });
  
  return {
    table,
    sampleSize: sample_limit,
    columns: columnStats,
  };
}

// Get value distribution for a column
export async function getValueDistribution(params: DistributionParams) {
  const { database, table, column, topk } = params;
  
  // Get top K values and their counts
  const distQuery = `
    SELECT 
      \`${column}\` as value,
      COUNT(*) as count,
      COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage
    FROM \`${table}\`
    GROUP BY \`${column}\`
    ORDER BY count DESC
    LIMIT ?
  `;
  
  const distribution = await executeReadOnlyQuery(
    distQuery,
    [topk],
    database
  );
  
  // Get total distinct count
  const totalDistinctQuery = `
    SELECT COUNT(DISTINCT \`${column}\`) as distinctCount
    FROM \`${table}\`
  `;
  
  const distinctResult = await executeReadOnlyQuery<{ distinctCount: number }>(
    totalDistinctQuery,
    [],
    database
  );
  
  // Calculate approximate entropy
  const entropy = distribution.reduce((sum, row: any) => {
    const p = Number(row.percentage) / 100;
    return sum - (p > 0 ? p * Math.log2(p) : 0);
  }, 0);
  
  return {
    table,
    column,
    topValues: distribution.map((row: any) => ({
      value: row.value,
      count: Number(row.count),
      percentage: Number(row.percentage),
    })),
    totalDistinct: Number(distinctResult[0].distinctCount),
    entropyEstimate: entropy,
    showingTop: topk,
  };
}

// Detect outliers using Z-score
export async function detectOutliers(params: OutlierParams) {
  const { database, table, column, z_threshold, limit } = params;
  
  // First get mean and stddev
  const statsQuery = `
    SELECT 
      AVG(\`${column}\`) as mean,
      STDDEV(\`${column}\`) as stddev
    FROM \`${table}\`
    WHERE \`${column}\` IS NOT NULL
  `;
  
  const stats = await executeReadOnlyQuery<{ mean: number; stddev: number }>(
    statsQuery,
    [],
    database
  );
  
  const { mean, stddev } = stats[0];
  
  if (stddev === 0 || stddev === null || mean === null) {
    return {
      table,
      column,
      message: 'Cannot detect outliers: standard deviation is 0 or null, or mean is null',
      outliers: [],
    };
  }
  
  // Find outliers
  const outliersQuery = `
    SELECT *,
      ABS(\`${column}\` - ?) / ? as z_score
    FROM \`${table}\`
    WHERE \`${column}\` IS NOT NULL
      AND ABS(\`${column}\` - ?) / ? > ?
    ORDER BY ABS(\`${column}\` - ?) / ? DESC
    LIMIT ?
  `;
  
  const queryParams = [
    Number(mean),
    Number(stddev),
    Number(mean),
    Number(stddev),
    Number(z_threshold),
    Number(mean),
    Number(stddev),
    Number(limit),
  ];

  const outliers = await executeReadOnlyQuery(
    outliersQuery,
    queryParams,
    database
  );
  
  return {
    table,
    column,
    statistics: {
      mean: Number(mean),
      stddev: Number(stddev),
      zThreshold: z_threshold,
    },
    outlierCount: outliers.length,
    outliers: outliers.map((row: any) => ({
      ...row,
      z_score: Number(row.z_score),
    })),
  };
}

// Find duplicate rows based on column combination
export async function findDuplicates(params: DuplicatesParams) {
  const { database, table, columns, limit_groups } = params;
  
  const columnList = columns.map(col => `\`${col}\``).join(', ');
  
  // Find duplicate groups
  const duplicatesQuery = `
    SELECT ${columnList}, COUNT(*) as duplicate_count
    FROM \`${table}\`
    GROUP BY ${columnList}
    HAVING COUNT(*) > 1
    ORDER BY duplicate_count DESC
    LIMIT ?
  `;
  
  const duplicateGroups = await executeReadOnlyQuery(
    duplicatesQuery,
    [limit_groups],
    database
  );
  
  // Get total duplicate rows count
  const totalDuplicatesQuery = `
    SELECT SUM(cnt - 1) as totalDuplicates
    FROM (
      SELECT COUNT(*) as cnt
      FROM \`${table}\`
      GROUP BY ${columnList}
      HAVING COUNT(*) > 1
    ) as dup_groups
  `;
  
  const totalResult = await executeReadOnlyQuery<{ totalDuplicates: number }>(
    totalDuplicatesQuery,
    [],
    database
  );
  
  return {
    table,
    columns,
    totalDuplicateRows: Number(totalResult[0]?.totalDuplicates || 0),
    duplicateGroups: duplicateGroups.map((group: any) => ({
      values: columns.reduce((obj, col) => {
        obj[col] = group[col];
        return obj;
      }, {} as any),
      count: Number(group.duplicate_count),
    })),
    showingTopGroups: limit_groups,
  };
}

// Get NULL report for all columns
export async function getNullReport(params: TableParams) {
  const { database, table } = params;
  
  // Get all columns
  const columnsQuery = `
    SELECT COLUMN_NAME as columnName
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = IFNULL(?, DATABASE())
      AND TABLE_NAME = ?
    ORDER BY ORDINAL_POSITION
  `;
  
  const columns = await executeReadOnlyQuery<{ columnName: string }>(
    columnsQuery,
    [database || null, table],
    database
  );
  
  // Get total row count
  const countQuery = `SELECT COUNT(*) as total FROM \`${table}\``;
  const countResult = await executeReadOnlyQuery<{ total: number }>(
    countQuery,
    [],
    database
  );
  const totalRows = Number(countResult[0].total);
  
  if (totalRows === 0) {
    return {
      table,
      totalRows: 0,
      message: 'Table is empty',
      columns: [],
    };
  }
  
  // Build NULL count query for all columns
  const nullCountParts = columns.map(col => 
    `SUM(CASE WHEN \`${col.columnName}\` IS NULL THEN 1 ELSE 0 END) as \`${col.columnName}_nulls\``
  );
  
  const nullCountQuery = `
    SELECT ${nullCountParts.join(',')}
    FROM \`${table}\`
  `;
  
  const nullCounts = await executeReadOnlyQuery(nullCountQuery, [], database);
  const nullData = nullCounts[0] || {};
  
  // Format results
  const columnNullInfo = columns.map(col => {
    const nullCount = Number(nullData[`${col.columnName}_nulls`] || 0);
    return {
      column: col.columnName,
      nullCount,
      nullPercentage: (nullCount / totalRows) * 100,
      nonNullCount: totalRows - nullCount,
      nonNullPercentage: ((totalRows - nullCount) / totalRows) * 100,
    };
  });
  
  // Sort by null percentage descending
  columnNullInfo.sort((a, b) => b.nullPercentage - a.nullPercentage);
  
  return {
    table,
    totalRows,
    columns: columnNullInfo,
    summary: {
      columnsWithNulls: columnNullInfo.filter(c => c.nullCount > 0).length,
      columnsAllNull: columnNullInfo.filter(c => c.nullCount === totalRows).length,
      columnsNoNull: columnNullInfo.filter(c => c.nullCount === 0).length,
    },
  };
}
