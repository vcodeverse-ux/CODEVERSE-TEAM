import path from "node:path";
import { hashPassword } from "./password";
import schema from "./schema";

export const DEFAULT_PASSWORD = "TeamCore#2026";

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
  const pw = hashPassword(DEFAULT_PASSWORD);
  const people = [
    ["Adham Aiman", "admin", "Administration"], ["Ahmed Hassan", "member", "Hardware Team"], ["Mariam Ali", "leader", "Software Team"],
    ["Omar Khaled", "member", "Research Team"], ["Salma Mostafa", "member", "Documentation"], ["Youssef Adel", "member", "Hardware Team"],
    ["Nour Reda", "member", "Research Team"], ["Hana Samir", "member", "Software Team"], ["Karim Nabil", "member", "Hardware Team"],
    ["Laila Fathy", "member", "Documentation"], ["Mostafa Gamal", "member", "Software Team"], ["Rana Tarek", "member", "Research Team"],
    ["Tamer Wael", "member", "Hardware Team"], ["Dina Ashraf", "member", "Documentation"], ["Hossam Ehab", "member", "Software Team"],
    ["Farah Magdy", "member", "Research Team"],
  ];
  const id = {};
  for (const [n, r, t] of people) {
    const [u] = await q("INSERT INTO users(name,email,role,team,password_hash) VALUES($1,$2,$3,$4,$5) RETURNING id", [n, n.toLowerCase().replace(/ /g, ".") + "@teamcore.dev", r, t, pw]);
    id[n.split(" ")[0]] = u.id;
  }
  const task = (title, cat, who, off, pr, st, desc) =>
    q("INSERT INTO tasks(title,category,assignee_id,created_by,due,priority,status,description) VALUES($1,$2,$3,$4,CURRENT_DATE + $5::int,$6,$7,$8) RETURNING id", [title, cat, id[who], id.Adham, off, pr, st, desc]).then((r) => r[0].id);
  const t1 = await task("Research CNC Laser Components", "Hardware research", "Ahmed", 1, "High", "submitted", "Compare laser modules, power ratings and safety requirements.");
  await task("Prepare System Architecture", "Documentation", "Mariam", 2, "High", "progress", "Diagram the main modules and how they talk to each other.");
  await task("Estimate Hardware Budget", "Finance", "Omar", 4, "Medium", "todo", "Estimate component and tooling costs.");
  await task("Review Security Requirements", "Cybersecurity", "Adham", 6, "High", "done", "Check the security checklist for the prototype.");
  await task("Prepare Presentation Outline", "Presentation", "Salma", 8, "Low", "progress", "First outline for the graduation presentation.");
  const t6 = await task("Project Scope Document", "Documentation", "Salma", -2, "Medium", "submitted", "Write the scope and objectives.");
  const t7 = await task("Component Price List", "Finance", "Omar", -3, "Medium", "submitted", "List prices from three suppliers.");
  await task("Set up Git repository", "Software", "Hana", 3, "Medium", "todo", "Create the repo and branch rules.");
  const sub = (t, u, note, off) => q("INSERT INTO submissions(task_id,user_id,note,created_at) VALUES($1,$2,$3,now() - $4::int * interval '1 minute')", [t, u, note, off]);
  await sub(t1, id.Ahmed, "Compared three laser modules, summary attached in the doc.", 120);
  await sub(t6, id.Salma, "First version of the scope document.", 1500);
  await sub(t7, id.Omar, "Price list with links to suppliers.", 3200);
  const idea = (t, c, d, who, st, off, votes) => q("INSERT INTO ideas(title,category,description,author_id,status,created_at) VALUES($1,$2,$3,$4,$5,now() - $6::int * interval '1 minute') RETURNING id", [t, c, d, id[who], st, off]).then(async (r) => { for (const v of votes) await q("INSERT INTO idea_votes VALUES($1,$2)", [r[0].id, id[v]]); });
  await idea("Smart Material Inventory", "Hardware", "Track hardware components, quantities and usage through a connected inventory system.", "Mariam", "discussion", 120, ["Ahmed", "Omar", "Salma", "Nour"]);
  await idea("Device Access Monitoring", "Cyber Security", "A dashboard to monitor authorized devices and keep a clear access history.", "Ahmed", "approved", 1440, ["Mariam", "Omar", "Youssef"]);
  await idea("AI Documentation Assistant", "Software", "Help the team organize technical notes and create structured project documentation.", "Omar", "pending", 4000, ["Salma"]);
  const rec = (t, c, b, st, off) => q("INSERT INTO records(title,category,body,status,author_id,updated_at) VALUES($1,$2,$3,$4,$5,now() - $6::int * interval '1 minute')", [t, c, b, st, id.Adham, off]);
  await rec("Project Scope & Objectives", "General Documentation", "Build a CNC laser prototype with a software control layer and a documented security model.", "approved", 2800);
  await rec("System Architecture v1", "Technical Documentation", "Controller board, host app, safety interlock and logging service.", "review", 4300);
  await rec("Requirements Specification", "Planning", "Functional and non-functional requirements agreed with the supervisor.", "approved", 7000);
  await rec("Laser Module Comparison", "Hardware Components", "Notes on three candidate modules.", "review", 900);
  await rec("Budget Tracker", "Budget & Expenses", "Running list of purchases and estimates.", "review", 1500);
  await rec("API Notes", "Software & Source Code", "Draft endpoints for the control app.", "review", 3000);
  await rec("Threat Model", "Cybersecurity", "Assets, entry points and mitigations.", "review", 2000);
  const th = async (t, topic, who, off, replies) => { const [r] = await q("INSERT INTO threads(title,topic,author_id,created_at) VALUES($1,$2,$3,now() - $4::int * interval '1 minute') RETURNING id", [t, topic, id[who], off]); let i = 0; for (const [w, b] of replies) await q("INSERT INTO replies(thread_id,author_id,body,created_at) VALUES($1,$2,$3,now() - $4::int * interval '1 minute')", [r.id, id[w], b, Math.max(off - 5 * ++i, 1)]); };
  await th("Hardware selection: laser module", "Hardware", "Ahmed", 200, [["Ahmed", "I narrowed it to two modules. Power and price are close, safety features differ."], ["Mariam", "Which one has an interlock input? That matters for our software design."]]);
  await th("Database structure review", "Software", "Mariam", 1500, [["Mariam", "Please review the tables before we freeze them."], ["Hana", "Looks good. I would add an index on task deadlines."]]);
  await th("Next team meeting agenda", "Planning", "Adham", 4500, [["Adham", "Send topics you want on the agenda."]]);
  const ev = (t, k, off, h) => q("INSERT INTO events(title,kind,starts_at,created_by) VALUES($1,$2,date_trunc('day', now()) + $3::int * interval '1 day' + $4::int * interval '1 hour',$5)", [t, k, off, h, id.Adham]);
  await ev("System Architecture Deadline", "Deadline", 2, 21); await ev("Hardware Budget Review", "Meeting", 4, 14); await ev("Weekly Team Sync", "Meeting", 6, 18);
  const act = (u, text, subject, icon, off) => q("INSERT INTO activity(user_id,text,subject,icon,created_at) VALUES($1,$2,$3,$4,now() - $5::int * interval '1 minute')", [id[u], text, subject, icon, off]);
  await act("Ahmed", "submitted a task for review.", "Research CNC Laser Components", "up", 120);
  await act("Mariam", "added a new project idea.", "Smart Material Inventory", "idea", 120);
  await act("Adham", "approved a submission.", "System Requirements", "check", 1440);
  await act("Omar", "joined the workspace.", null, "user", 4300);
}

let ready;
export function db() { return (ready ??= open().catch((e) => { ready = undefined; throw e; })); }
export const q = async (sql, params) => (await db())(sql, params);
export const iso = (col) => `to_char(${col} at time zone 'utc','YYYY-MM-DD"T"HH24:MI:SS"Z"')`;
