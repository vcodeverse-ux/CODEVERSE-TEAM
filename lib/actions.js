"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { q } from "./db";
import { requireUser, requireAdmin, isManager } from "./auth";
import { hashPassword, verifyPassword, signSession } from "./password";

const s = (f, k) => String(f.get(k) ?? "").trim();
const n = (f, k) => (s(f, k) ? Number(s(f, k)) : null);
const MAX_FILE = 3 * 1024 * 1024;
const done = (path) => { revalidatePath("/", "layout"); if (path) redirect(path); };
const log = (uid, text, subject, icon) => q("INSERT INTO activity(user_id,text,subject,icon) VALUES($1,$2,$3,$4)", [uid, text, subject || null, icon || "dot"]);

async function saveFile(f, uid) {
  const file = f.get("file");
  if (!file || typeof file !== "object" || !file.size) return null;
  if (file.size > MAX_FILE) return "toolarge";
  const buf = Buffer.from(await file.arrayBuffer());
  const name = String(file.name).replace(/[\\/]/g, "_").slice(0, 120);
  const [r] = await q("INSERT INTO files(name,mime,size,data,uploader_id) VALUES($1,$2,$3,$4,$5) RETURNING id", [name, file.type || "application/octet-stream", buf.length, buf, uid]);
  return r.id;
}

// ---- auth
export async function login(f) {
  const email = s(f, "email").toLowerCase();
  const [u] = await q("SELECT id,password_hash FROM users WHERE email=$1", [email]);
  if (!u || !verifyPassword(s(f, "password"), u.password_hash)) redirect("/login?error=1");
  (await cookies()).set("session", signSession(u.id), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 14 * 86400 });
  redirect("/");
}
export async function logout() {
  (await cookies()).delete("session");
  redirect("/login");
}
export async function changePassword(f) {
  const u = await requireUser();
  const [row] = await q("SELECT password_hash FROM users WHERE id=$1", [u.id]);
  const next = s(f, "next");
  if (!verifyPassword(s(f, "current"), row.password_hash) || next.length < 8) return done("/members?pw=bad");
  await q("UPDATE users SET password_hash=$1 WHERE id=$2", [hashPassword(next), u.id]);
  done("/members?pw=ok");
}

// ---- tasks
export async function createTask(f) {
  const u = await requireUser();
  const title = s(f, "title");
  if (!title) return;
  const assignee = isManager(u) ? n(f, "assignee") : u.id;
  const pr = ["High", "Medium", "Low"].includes(s(f, "priority")) ? s(f, "priority") : "Medium";
  await q("INSERT INTO tasks(title,category,description,assignee_id,created_by,due,priority) VALUES($1,$2,$3,$4,$5,$6,$7)", [title, s(f, "category") || "General", s(f, "description"), assignee, u.id, s(f, "due") || null, pr]);
  await log(u.id, "created a task.", title, "task");
  done();
}
export async function startTask(f) {
  const u = await requireUser();
  const id = n(f, "id");
  const [t] = await q("SELECT assignee_id,title,status FROM tasks WHERE id=$1", [id]);
  if (!t || (t.assignee_id !== u.id && !isManager(u)) || t.status !== "todo") return;
  await q("UPDATE tasks SET status='progress' WHERE id=$1", [id]);
  await log(u.id, "started working on a task.", t.title, "task");
  done();
}
export async function deleteTask(f) {
  const u = await requireUser();
  if (!isManager(u)) return;
  await q("DELETE FROM tasks WHERE id=$1", [n(f, "id")]);
  done();
}
export async function submitTask(f) {
  const u = await requireUser();
  const id = n(f, "id");
  const [t] = await q("SELECT assignee_id,title FROM tasks WHERE id=$1", [id]);
  if (!t || (t.assignee_id !== u.id && !isManager(u))) return;
  const fileId = await saveFile(f, u.id);
  if (fileId === "toolarge") return done("/tasks?err=file");
  await q("INSERT INTO submissions(task_id,user_id,note,file_id) VALUES($1,$2,$3,$4)", [id, u.id, s(f, "note"), fileId]);
  await q("UPDATE tasks SET status='submitted' WHERE id=$1", [id]);
  await log(u.id, "submitted a task for review.", t.title, "up");
  done();
}
export async function reviewSubmission(f) {
  const u = await requireUser();
  if (!isManager(u)) return;
  const id = n(f, "id"), approve = s(f, "decision") === "approve";
  const [sub] = await q("SELECT s.task_id, t.title FROM submissions s JOIN tasks t ON t.id=s.task_id WHERE s.id=$1 AND s.status='pending'", [id]);
  if (!sub) return;
  await q("UPDATE submissions SET status=$1, feedback=$2, reviewed_by=$3, reviewed_at=now() WHERE id=$4", [approve ? "approved" : "changes", s(f, "feedback"), u.id, id]);
  await q("UPDATE tasks SET status=$1 WHERE id=$2", [approve ? "done" : "progress", sub.task_id]);
  await log(u.id, approve ? "approved a submission." : "requested changes on a submission.", sub.title, approve ? "check" : "up");
  done();
}

// ---- ideas
export async function createIdea(f) {
  const u = await requireUser();
  const title = s(f, "title");
  if (!title) return;
  await q("INSERT INTO ideas(title,category,description,author_id) VALUES($1,$2,$3,$4)", [title, s(f, "category") || "Software", s(f, "description"), u.id]);
  await log(u.id, "added a new project idea.", title, "idea");
  done();
}
export async function toggleVote(f) {
  const u = await requireUser();
  const id = n(f, "id");
  const del = await q("DELETE FROM idea_votes WHERE idea_id=$1 AND user_id=$2 RETURNING idea_id", [id, u.id]);
  if (!del.length) await q("INSERT INTO idea_votes(idea_id,user_id) VALUES($1,$2) ON CONFLICT DO NOTHING", [id, u.id]);
  done();
}
export async function setIdeaStatus(f) {
  const u = await requireUser();
  const st = s(f, "status");
  if (!isManager(u) || !["pending", "discussion", "approved"].includes(st)) return;
  const r = await q("UPDATE ideas SET status=$1 WHERE id=$2 RETURNING title", [st, n(f, "id")]);
  if (r[0]) await log(u.id, `marked an idea as ${st}.`, r[0].title, "idea");
  done();
}

// ---- project database
export async function addRecord(f) {
  const u = await requireUser();
  const title = s(f, "title");
  if (!title) return;
  await q("INSERT INTO records(title,category,body,author_id) VALUES($1,$2,$3,$4)", [title, s(f, "category") || "General Documentation", s(f, "body"), u.id]);
  await log(u.id, "added a database record.", title, "db");
  done();
}
export async function setRecordStatus(f) {
  const u = await requireUser();
  const st = s(f, "status");
  if (!isManager(u) || !["review", "approved"].includes(st)) return;
  await q("UPDATE records SET status=$1, updated_at=now() WHERE id=$2", [st, n(f, "id")]);
  done();
}

// ---- files
export async function uploadFile(f) {
  const u = await requireUser();
  const id = await saveFile(f, u.id);
  if (id === "toolarge") return done("/files?err=size");
  if (id) await log(u.id, "uploaded a file.", String(f.get("file").name), "file");
  done();
}
export async function deleteFile(f) {
  const u = await requireUser();
  const id = n(f, "id");
  const [row] = await q("SELECT uploader_id FROM files WHERE id=$1", [id]);
  if (row && (isManager(u) || row.uploader_id === u.id)) await q("DELETE FROM files WHERE id=$1", [id]);
  done();
}

// ---- discussions and calendar
export async function createThread(f) {
  const u = await requireUser();
  const title = s(f, "title"), body = s(f, "body");
  if (!title || !body) return;
  const [t] = await q("INSERT INTO threads(title,topic,author_id) VALUES($1,$2,$3) RETURNING id", [title, s(f, "topic") || "General", u.id]);
  await q("INSERT INTO replies(thread_id,author_id,body) VALUES($1,$2,$3)", [t.id, u.id, body]);
  await log(u.id, "started a discussion.", title, "chat");
  done("/discussions/" + t.id);
}
export async function addReply(f) {
  const u = await requireUser();
  const id = n(f, "thread"), body = s(f, "body");
  if (!body) return;
  await q("INSERT INTO replies(thread_id,author_id,body) VALUES($1,$2,$3)", [id, u.id, body]);
  done("/discussions/" + id);
}
export async function addEvent(f) {
  const u = await requireUser();
  if (!isManager(u)) return;
  const title = s(f, "title"), when = s(f, "when");
  if (!title || !when) return;
  await q("INSERT INTO events(title,kind,starts_at,created_by) VALUES($1,$2,$3::timestamp AT TIME ZONE 'Africa/Cairo',$4)", [title, s(f, "kind") === "Deadline" ? "Deadline" : "Meeting", when, u.id]);
  await log(u.id, "added a calendar event.", title, "cal");
  done();
}

// ---- members (admin)
export async function addMember(f) {
  const a = await requireAdmin();
  const name = s(f, "name"), email = s(f, "email").toLowerCase(), pw = s(f, "password");
  if (!name || !email.includes("@") || pw.length < 8) return done("/members?add=bad");
  const role = ["admin", "leader", "member"].includes(s(f, "role")) ? s(f, "role") : "member";
  const r = await q("INSERT INTO users(name,email,role,team,password_hash) VALUES($1,$2,$3,$4,$5) ON CONFLICT (email) DO NOTHING RETURNING id", [name, email, role, s(f, "team") || "General", hashPassword(pw)]);
  if (!r.length) return done("/members?add=exists");
  await log(a.id, "added a team member.", name, "user");
  done("/members?add=ok");
}
export async function setRole(f) {
  const a = await requireAdmin();
  const id = n(f, "id"), role = s(f, "role");
  if (id === a.id || !["admin", "leader", "member"].includes(role)) return;
  await q("UPDATE users SET role=$1 WHERE id=$2", [role, id]);
  done();
}
export async function resetPassword(f) {
  await requireAdmin();
  const pw = s(f, "password");
  if (pw.length < 8) return done("/members?add=bad");
  await q("UPDATE users SET password_hash=$1 WHERE id=$2", [hashPassword(pw), n(f, "id")]);
  done("/members?add=reset");
}
