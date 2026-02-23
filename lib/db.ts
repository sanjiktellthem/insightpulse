import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL_READONLY ?? process.env.DATABASE_URL });

const forbidden = /\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|GRANT|REVOKE|CREATE)\b/i;

export function validateReadOnlySql(inputSql: string) {
  const sql = inputSql.trim().replace(/\s+/g, " ");
  if (sql.includes(";")) throw new Error("Semicolons are not allowed.");
  if (forbidden.test(sql)) throw new Error("Only read-only SELECT statements are allowed.");
  if (!/^(SELECT\b|WITH\b)/i.test(sql)) throw new Error("Query must start with SELECT or WITH.");
  return enforceLimit(sql);
}

export function enforceLimit(sql: string) {
  const hasLimit = /\bLIMIT\s+(\d+)\b/i.exec(sql);
  if (!hasLimit) return `${sql} LIMIT 500`;
  const limitValue = Number(hasLimit[1]);
  if (limitValue > 500) {
    return sql.replace(/\bLIMIT\s+\d+\b/i, "LIMIT 500");
  }
  return sql;
}

export async function runSafeSql(inputSql: string) {
  const sql = validateReadOnlySql(inputSql);
  const result = await pool.query(sql);
  return {
    sql,
    columns: result.fields.map((f) => f.name),
    rows: result.rows.map((row) => Object.values(row) as (string | number | null)[]),
  };
}
