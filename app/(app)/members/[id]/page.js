import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { q } from "@/lib/db";
import { requireUser, isManager } from "@/lib/auth";
import { Avatar, Heading } from "../../../_c/ui";

const ST = { todo: "To Do", progress: "In Progress", submitted: "Submitted", done: "Completed" };

export default async function MemberProgress({ params }) {
  const u = await requireUser();
  if (!isManager(u)) redirect("/");
  const { id } = await params;
  const [m] = await q("SELECT id,name,email,role,team FROM users WHERE id=$1", [Number(id) || 0]);
  if (!m) notFound();
  if (m.role === "admin" && u.role !== "admin") redirect("/members");
  const tasks = await q("SELECT id,title,category,due,priority,status FROM tasks WHERE assignee_id=$1 ORDER BY (status='done'), due NULLS LAST", [m.id]);
  const done = tasks.filter((t) => t.status === "done").length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  return (
    <>
      <Heading title={m.name} sub={m.team + " · " + m.email}><Link className="btn secondary" href="/members">Back to members</Link></Heading>
      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}><Avatar name={m.name} />
          <div><b>{done} done · {tasks.length - done} not done</b><br /><small>{pct}% of assigned tasks completed</small></div></div>
        <div style={{ background: "#e5e9f2", borderRadius: 8, height: 10, marginTop: 14 }}><div style={{ width: pct + "%", background: "#2f6bed", height: 10, borderRadius: 8 }} /></div>
      </div>
      <div className="card panel tablewrap">
        <table className="data"><thead><tr><th>Task</th><th>Deadline</th><th>Priority</th><th>Status</th></tr></thead>
          <tbody>{tasks.map((t) => (<tr key={t.id}><td><b>{t.title}</b><br /><small>{t.category}</small></td><td>{t.due ? new Date(t.due).toISOString().slice(0, 10) : "No deadline"}</td><td>{t.priority}</td><td>{ST[t.status] || t.status}</td></tr>))}
            {!tasks.length && <tr><td colSpan={4}>No tasks assigned yet.</td></tr>}</tbody></table>
      </div>
    </>
  );
}
