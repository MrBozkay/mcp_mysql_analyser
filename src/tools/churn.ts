import { z } from 'zod';

// Churn analysis parameter schemas
export const churnBasicParamsSchema = z.object({
  database: z.string().optional(),
  user_table: z.string(),
  user_id_col: z.string(),
  activity_table: z.string(),
  activity_user_col: z.string(),
  activity_time_col: z.string(),
  inactivity_days: z.number().min(7).max(180).default(30),
  month_floor: z.boolean().optional().default(true),
});

export const cohortParamsSchema = z.object({
  database: z.string().optional(),
  activity_table: z.string(),
  activity_user_col: z.string(),
  activity_time_col: z.string(),
  observation_months: z.number().min(2).max(36).default(12),
});

export const survivalParamsSchema = z.object({
  database: z.string().optional(),
  activity_table: z.string(),
  activity_user_col: z.string(),
  activity_time_col: z.string(),
  inactivity_days: z.number().min(7).max(180).default(30),
  max_months: z.number().min(2).max(36).default(12),
});

export const mrrChurnParamsSchema = z.object({
  database: z.string().optional(),
  revenue_table: z.string(),
  rev_user_col: z.string(),
  rev_amount_col: z.string(),
  rev_time_col: z.string(),
  amount_is_monthly: z.boolean().default(false),
});

export const churnMappingParamsSchema = z.object({
  database: z.string().optional(),
  tables: z.array(z.string()),
});

// Generate basic churn SQL
export async function generateChurnSqlBasic(params: z.infer<typeof churnBasicParamsSchema>) {
  const {
    user_table,
    user_id_col,
    activity_table,
    activity_user_col,
    activity_time_col,
    inactivity_days,
    month_floor,
  } = params;

  const sql = `
-- Monthly Churn Analysis
-- Inactivity threshold: ${inactivity_days} days

WITH monthly_activity AS (
  SELECT 
    ${month_floor ? 'DATE_FORMAT' : 'LAST_DAY'}(\`${activity_time_col}\`, '%Y-%m-01') AS month,
    \`${activity_user_col}\` AS user_id
  FROM \`${activity_table}\`
  GROUP BY 1, 2
),

user_lifecycle AS (
  SELECT 
    u.user_id,
    MIN(a.month) AS first_active_month,
    MAX(a.month) AS last_active_month
  FROM (SELECT DISTINCT \`${user_id_col}\` AS user_id FROM \`${user_table}\`) u
  LEFT JOIN monthly_activity a ON u.user_id = a.user_id
  GROUP BY u.user_id
),

monthly_status AS (
  SELECT 
    m.month,
    u.user_id,
    CASE 
      WHEN ma.user_id IS NOT NULL THEN 'active'
      WHEN u.first_active_month < m.month 
        AND DATEDIFF(m.month, u.last_active_month) > ${inactivity_days} THEN 'churned'
      WHEN u.first_active_month < m.month THEN 'inactive'
      ELSE 'never_active'
    END AS status,
    LAG(
      CASE 
        WHEN ma.user_id IS NOT NULL THEN 'active'
        WHEN u.first_active_month < m.month 
          AND DATEDIFF(m.month, u.last_active_month) > ${inactivity_days} THEN 'churned'
        WHEN u.first_active_month < m.month THEN 'inactive'
        ELSE 'never_active'
      END
    ) OVER (PARTITION BY u.user_id ORDER BY m.month) AS prev_status
  FROM (
    SELECT DISTINCT ${month_floor ? 'DATE_FORMAT' : 'LAST_DAY'}(\`${activity_time_col}\`, '%Y-%m-01') AS month
    FROM \`${activity_table}\`
  ) m
  CROSS JOIN user_lifecycle u
  LEFT JOIN monthly_activity ma ON m.month = ma.month AND u.user_id = ma.user_id
)

SELECT 
  month,
  COUNT(CASE WHEN status = 'active' THEN 1 END) AS active_users,
  COUNT(CASE WHEN status = 'churned' AND prev_status = 'active' THEN 1 END) AS new_churned,
  COUNT(CASE WHEN status = 'active' AND prev_status IN ('churned', 'inactive') THEN 1 END) AS reactivated,
  COUNT(CASE WHEN status = 'active' AND prev_status IS NULL THEN 1 END) AS new_users,
  ROUND(
    100.0 * COUNT(CASE WHEN status = 'churned' AND prev_status = 'active' THEN 1 END) / 
    NULLIF(COUNT(CASE WHEN prev_status = 'active' THEN 1 END), 0), 2
  ) AS churn_rate,
  ROUND(
    100.0 * COUNT(CASE WHEN status = 'active' AND prev_status IN ('churned', 'inactive') THEN 1 END) / 
    NULLIF(COUNT(CASE WHEN prev_status IN ('churned', 'inactive') THEN 1 END), 0), 2
  ) AS reactivation_rate
FROM monthly_status
GROUP BY month
ORDER BY month;`;

  return { sql, description: 'Monthly churn analysis with active, churned, and reactivated user counts' };
}

// Generate cohort retention SQL
export async function generateCohortSql(params: z.infer<typeof cohortParamsSchema>) {
  const {
    activity_table,
    activity_user_col,
    activity_time_col,
    observation_months,
  } = params;

  // Build dynamic columns for retention months
  const retentionColumns = Array.from({ length: observation_months }, (_, i) => 
    `MAX(CASE WHEN months_since_first = ${i} THEN 1 ELSE 0 END) AS M${i}`
  ).join(',\n    ');

  const sql = `
-- Cohort Retention Analysis
-- Observation period: ${observation_months} months

WITH user_cohorts AS (
  SELECT 
    \`${activity_user_col}\` AS user_id,
    DATE_FORMAT(MIN(\`${activity_time_col}\`), '%Y-%m-01') AS cohort_month,
    MIN(\`${activity_time_col}\`) AS first_activity
  FROM \`${activity_table}\`
  GROUP BY \`${activity_user_col}\`
),

monthly_activity AS (
  SELECT 
    a.\`${activity_user_col}\` AS user_id,
    DATE_FORMAT(a.\`${activity_time_col}\`, '%Y-%m-01') AS activity_month,
    c.cohort_month,
    PERIOD_DIFF(
      DATE_FORMAT(a.\`${activity_time_col}\`, '%Y%m'),
      DATE_FORMAT(c.cohort_month, '%Y%m')
    ) AS months_since_first
  FROM \`${activity_table}\` a
  JOIN user_cohorts c ON a.\`${activity_user_col}\` = c.user_id
),

cohort_retention AS (
  SELECT 
    cohort_month,
    user_id,
    ${retentionColumns}
  FROM monthly_activity
  WHERE months_since_first >= 0 AND months_since_first < ${observation_months}
  GROUP BY cohort_month, user_id
)

SELECT 
  cohort_month,
  COUNT(DISTINCT user_id) AS cohort_size,
  ${Array.from({ length: observation_months }, (_, i) => 
    `ROUND(100.0 * SUM(M${i}) / COUNT(DISTINCT user_id), 2) AS M${i}_retention`
  ).join(',\n  ')}
FROM cohort_retention
GROUP BY cohort_month
ORDER BY cohort_month;`;

  return { sql, description: 'Cohort retention matrix showing percentage of users retained each month' };
}

// Generate survival curve SQL
export async function generateSurvivalSql(params: z.infer<typeof survivalParamsSchema>) {
  const {
    activity_table,
    activity_user_col,
    activity_time_col,
    inactivity_days,
    max_months,
  } = params;

  const sql = `
-- Kaplan-Meier Survival Curve
-- Inactivity threshold: ${inactivity_days} days
-- Maximum observation: ${max_months} months

WITH user_lifecycle AS (
  SELECT 
    \`${activity_user_col}\` AS user_id,
    MIN(\`${activity_time_col}\`) AS first_activity,
    MAX(\`${activity_time_col}\`) AS last_activity,
    DATEDIFF(MAX(\`${activity_time_col}\`), MIN(\`${activity_time_col}\`)) AS lifetime_days
  FROM \`${activity_table}\`
  GROUP BY \`${activity_user_col}\`
),

survival_data AS (
  SELECT 
    user_id,
    first_activity,
    last_activity,
    lifetime_days,
    CASE 
      WHEN DATEDIFF(CURDATE(), last_activity) > ${inactivity_days} THEN 1 
      ELSE 0 
    END AS churned,
    LEAST(
      FLOOR(lifetime_days / 30.0),
      ${max_months}
    ) AS months_survived
  FROM user_lifecycle
),

survival_table AS (
  SELECT 
    month_num,
    COUNT(*) AS at_risk,
    SUM(CASE WHEN months_survived = month_num AND churned = 1 THEN 1 ELSE 0 END) AS events,
    SUM(CASE WHEN months_survived = month_num AND churned = 0 THEN 1 ELSE 0 END) AS censored
  FROM (
    SELECT n AS month_num FROM (
      ${Array.from({ length: max_months + 1 }, (_, i) => `SELECT ${i} AS n`).join(' UNION ALL ')}
    ) numbers
  ) months
  CROSS JOIN survival_data
  WHERE month_num <= months_survived
  GROUP BY month_num
)

SELECT 
  month_num AS month,
  at_risk AS n,
  events AS d,
  ROUND(1.0 - (events / NULLIF(at_risk, 0)), 4) AS survival_prob,
  ROUND(
    EXP(SUM(LOG(1.0 - events / NULLIF(at_risk, 0))) OVER (ORDER BY month_num)),
    4
  ) AS cumulative_survival
FROM survival_table
ORDER BY month_num;`;

  return { sql, description: 'Kaplan-Meier survival curve showing probability of user retention over time' };
}

// Generate MRR churn SQL
export async function generateMrrChurnSql(params: z.infer<typeof mrrChurnParamsSchema>) {
  const {
    revenue_table,
    rev_user_col,
    rev_amount_col,
    rev_time_col,
    amount_is_monthly,
  } = params;

  const amountField = amount_is_monthly 
    ? `\`${rev_amount_col}\`` 
    : `\`${rev_amount_col}\` * 12 / 365 * 30`; // Convert to monthly if needed

  const sql = `
-- MRR Churn Analysis
-- Revenue table: ${revenue_table}
-- Amount is monthly: ${amount_is_monthly}

WITH monthly_mrr AS (
  SELECT 
    DATE_FORMAT(\`${rev_time_col}\`, '%Y-%m-01') AS month,
    \`${rev_user_col}\` AS user_id,
    SUM(${amountField}) AS mrr
  FROM \`${revenue_table}\`
  WHERE \`${rev_amount_col}\` > 0
  GROUP BY 1, 2
),

mrr_changes AS (
  SELECT 
    month,
    user_id,
    mrr,
    LAG(mrr, 1) OVER (PARTITION BY user_id ORDER BY month) AS prev_mrr,
    CASE 
      WHEN LAG(mrr, 1) OVER (PARTITION BY user_id ORDER BY month) IS NULL THEN 'new'
      WHEN LAG(month, 1) OVER (PARTITION BY user_id ORDER BY month) < 
           DATE_SUB(month, INTERVAL 1 MONTH) THEN 'reactivated'
      WHEN mrr > LAG(mrr, 1) OVER (PARTITION BY user_id ORDER BY month) THEN 'expansion'
      WHEN mrr < LAG(mrr, 1) OVER (PARTITION BY user_id ORDER BY month) THEN 'contraction'
      ELSE 'retained'
    END AS status
  FROM monthly_mrr
),

monthly_metrics AS (
  SELECT 
    m.month,
    -- Starting MRR (previous month's ending MRR)
    COALESCE(SUM(pm.mrr), 0) AS starting_mrr,
    
    -- New MRR
    COALESCE(SUM(CASE WHEN mc.status = 'new' THEN mc.mrr ELSE 0 END), 0) AS new_mrr,
    
    -- Expansion MRR
    COALESCE(SUM(CASE WHEN mc.status = 'expansion' THEN mc.mrr - mc.prev_mrr ELSE 0 END), 0) AS expansion_mrr,
    
    -- Reactivation MRR
    COALESCE(SUM(CASE WHEN mc.status = 'reactivated' THEN mc.mrr ELSE 0 END), 0) AS reactivation_mrr,
    
    -- Contraction MRR
    COALESCE(SUM(CASE WHEN mc.status = 'contraction' THEN mc.prev_mrr - mc.mrr ELSE 0 END), 0) AS contraction_mrr,
    
    -- Churn MRR (users who were active last month but not this month)
    COALESCE(SUM(
      CASE 
        WHEN pm.user_id IS NOT NULL AND mc.user_id IS NULL THEN pm.mrr 
        ELSE 0 
      END
    ), 0) AS churn_mrr,
    
    -- Ending MRR
    COALESCE(SUM(mc.mrr), 0) AS ending_mrr
  FROM (
    SELECT DISTINCT month FROM monthly_mrr
  ) m
  LEFT JOIN mrr_changes mc ON m.month = mc.month
  LEFT JOIN mrr_changes pm ON m.month = DATE_ADD(pm.month, INTERVAL 1 MONTH)
  GROUP BY m.month
)

SELECT 
  month,
  starting_mrr,
  new_mrr,
  expansion_mrr,
  reactivation_mrr,
  -contraction_mrr AS contraction_mrr,
  -churn_mrr AS churn_mrr,
  ending_mrr,
  ROUND(100.0 * churn_mrr / NULLIF(starting_mrr, 0), 2) AS gross_churn_rate,
  ROUND(100.0 * (churn_mrr - expansion_mrr) / NULLIF(starting_mrr, 0), 2) AS net_churn_rate,
  starting_mrr + new_mrr + expansion_mrr + reactivation_mrr - contraction_mrr - churn_mrr AS calculated_ending_mrr
FROM monthly_metrics
ORDER BY month;`;

  return { sql, description: 'MRR churn analysis with gross and net churn rates, expansion, and contraction' };
}

// Suggest churn mapping
export async function suggestChurnMapping(params: z.infer<typeof churnMappingParamsSchema>) {
  const { tables } = params;
  
  const suggestions = {
    user_id_candidates: [] as Array<{ table: string; column: string; confidence: string }>,
    timestamp_candidates: [] as Array<{ table: string; column: string; confidence: string }>,
    recommendations: [] as string[],
  };
  
  // Common patterns for user ID columns
  const userIdPatterns = [
    /user.*id/i, /customer.*id/i, /member.*id/i, /account.*id/i,
    /id$/i, /uid$/i, /user$/i, /customer$/i
  ];
  
  // Common patterns for timestamp columns
  const timestampPatterns = [
    /.*_at$/i, /.*_date$/i, /.*_time$/i, /created/i, /updated/i,
    /timestamp/i, /occurred/i, /activity/i, /event/i
  ];
  
  // Simulate checking column names (in real implementation, would query INFORMATION_SCHEMA)
  tables.forEach(table => {
    // This is a placeholder - in real implementation, would query actual columns
    suggestions.recommendations.push(
      `Check table '${table}' columns in INFORMATION_SCHEMA for user_id and timestamp fields`
    );
  });
  
  // Add general recommendations
  suggestions.recommendations.push(
    'Look for columns with names matching: user_id, customer_id, member_id, account_id',
    'Look for timestamp columns with names ending in: _at, _date, _time',
    'Consider columns with high cardinality for user identification',
    'Consider datetime/timestamp type columns for activity tracking'
  );
  
  return suggestions;
}
