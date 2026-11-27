import path from "node:path";
import { hashPassword } from "./password";
import schema from "./schema";


async function open() {
  let q;
  if (process.env.DATABASE_URL) {
    const { default: pg } = await import("pg");
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 3 });
    q = async (sql, params = []) => (await pool.query(sql, params)).rows;
    for (const s of schema.split(";").map((x) => x.trim()).filter(Boolean)) await q(s);
  } else {
    // Local development without a database: embedded Postgres (PGlite)
    const { PGlite } = await import("@electric-sql/pglite");
    const db = new PGlite(path.join(process.cwd(), ".pgdata"));
    await db.waitReady;
    q = async (sql, params = []) => (await db.query(sql, params)).rows;
    await db.exec(schema);
  }
  // atomic "first run" guard: only one instance seeds
  const first = await q("INSERT INTO meta(k,v) VALUES('seeded','1') ON CONFLICT DO NOTHING RETURNING k");
  if (first.length) await seed(q);
  return q;
}

async function seed(q) {
  // Fresh database: one admin only, no demo data.
  const email = (process.env.ADMIN_EMAIL || "admin@teamcore.dev").toLowerCase();
  const pw = process.env.ADMIN_PASSWORD || "ChangeMe#2026";
  await q("INSERT INTO users(name,email,role,team,password_hash) VALUES($1,$2,'admin','Administration',$3) ON CONFLICT (email) DO NOTHING", ["Admin", email, hashPassword(pw)]);
}

let ready;
export function db() { return (ready ??= open().catch((e) => { ready = undefined; throw e; })); }
export const q = async (sql, params) => (await db())(sql, params);
export const iso = (col) => `to_char(${col} at time zone 'utc','YYYY-MM-DD"T"HH24:MI:SS"Z"')`;
