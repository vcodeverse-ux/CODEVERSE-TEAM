import { q } from "@/lib/db";
import { requireUser, isManager } from "@/lib/auth";
import Modal from "../../_c/Modal";
import TaskForm from "../../_c/TaskForm";
import { Pill, Heading, Field, Actions, Notice } from "../../_c/ui";
import { createTask, startTask, submitTask, deleteTask } from "@/lib/actions";
import { fmtDate, daysLeft } from "@/lib/format";

export default async function Tasks({ searchParams }) {
  const u = await requireUser();
  const { q: term = "", status = "", who = "", err = "" } = await searchParams;
  const users = await q("SELECT id,name FROM users ORDER BY name");
  const rows = await q(
    `SELECT t.id,t.title,t.category,t.priority,t.status,t.due::text due,t.assignee_id,u.name assignee FROM tasks t LEFT JOIN users u ON u.id=t.assignee_id
     WHERE ($1='' OR t.title ILIKE '%'||$1||'%' OR t.category ILIKE '%'||$1||'%') AND ($2='' OR t.status=$2) AND ($3='' OR t.assignee_id::text=$3) AND ($4 OR u.role IS DISTINCT FROM 'admin')
     ORDER BY (t.status='done'), t.due NULLS LAST, t.id`, [term, status, who, u.role === "admin"]);
  const mgr = isManager(u);
  return (
    <>
      <Heading title="Tasks Management" sub="Assign work, track progress and manage deadlines.">
        <Modal label="＋ Create task" title="Create a new task"><TaskForm users={users} me={u} action={createTask} /></Modal>
      </Heading>
      {err && <Notice bad>That file is larger than 3 MB.</Notice>}
      <div className="toolbar"><form>
        <input className="search" name="q" defaultValue={term} placeholder="⌕  Search tasks..." />
        <select className="filter" name="status" defaultValue={status}><option value="">All statuses</option><option value="todo">To Do</option><option value="progress">In Progress</option><option value="submitted">Submitted</option><option value="done">Completed</option></select>
        <select className="filter" name="who" defaultValue={who}><option value="">All members</option>{users.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
        <button className="btn secondary">Filter</button>
      </form></div>
      <div className="card panel tablewrap"><table className="data"><thead><tr><th>TASK</th><th>ASSIGNED TO</th><th>DEADLINE</th><th>PRIORITY</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody>
        {rows.length === 0 && <tr><td colSpan={6} className="empty">No tasks match.</td></tr>}
        {rows.map((t) => { const mine = t.assignee_id === u.id || mgr; const late = t.status !== "done" && t.due && daysLeft(t.due) < 0;
          return (<tr key={t.id}>
            <td><b>{t.title}</b><br /><small className="sub">{t.category}</small></td><td>{t.assignee || "Unassigned"}</td>
            <td className={late ? "late" : ""}>{fmtDate(t.due)}{late ? " · late" : ""}</td><td><span className="tag">{t.priority}</span></td><td><Pill s={t.status} /></td>
            <td><div className="row-actions">
              {mine && t.status === "todo" && <form action={startTask}><input type="hidden" name="id" value={t.id} /><button className="btn light sm">Start</button></form>}
              {mine && (t.status === "progress" || t.status === "todo") && (
                <Modal label="Submit" title={"Submit: " + t.title} className="btn light sm">
                  <form action={submitTask}><input type="hidden" name="id" value={t.id} />
                    <Field label="Note for the reviewer"><textarea name="note" placeholder="What did you deliver?" /></Field>
                    <Field label="File (optional, up to 3 MB)"><input type="file" name="file" /></Field>
                    <Actions><button className="btn">Submit for review</button></Actions></form>
                </Modal>)}
              {mgr && <form action={deleteTask}><input type="hidden" name="id" value={t.id} /><button className="btn danger sm">Delete</button></form>}
            </div></td></tr>); })}
      </tbody></table></div>
    </>
  );
}
