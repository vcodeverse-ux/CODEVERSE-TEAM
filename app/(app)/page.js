import Link from "next/link";
import { q, iso } from "@/lib/db";
import { requireUser, isManager } from "@/lib/auth";
import Modal from "../_c/Modal";
import { Pill, Heading, Field, Actions } from "../_c/ui";
import { createTask } from "@/lib/actions";
import { fmtDate, ago, daysLeft } from "@/lib/format";
import TaskForm from "../_c/TaskForm";

const ICON = { up: "⇧", idea: "✧", check: "✓", user: "♙", task: "☷", file: "▱", chat: "☏", db: "▤", cal: "◫", dot: "•" };

export default async function Dashboard() {
  const u = await requireUser();
  const [st] = await q("SELECT (SELECT count(*) FROM users)::int members, count(*)::int total, count(*) FILTER (WHERE status='done')::int done, count(*) FILTER (WHERE created_at > now() - interval '30 days')::int added FROM tasks");
  const [ide] = await q("SELECT count(*)::int n, count(*) FILTER (WHERE created_at > now() - interval '7 days')::int fresh FROM ideas");
  const [pend] = await q("SELECT count(*)::int n FROM submissions WHERE status='pending'");
  const prio = await q("SELECT t.id,t.title,t.status,t.due::text due,u.name assignee FROM tasks t LEFT JOIN users u ON u.id=t.assignee_id WHERE t.status<>'done' AND ($1 OR u.role IS DISTINCT FROM 'admin') ORDER BY (t.priority='High') DESC, t.due NULLS LAST LIMIT 5", [u.role === "admin"]);
  const act = await q(`SELECT a.text,a.subject,a.icon,${iso("a.created_at")} at,u.name FROM activity a LEFT JOIN users u ON u.id=a.user_id WHERE ($1 OR u.role IS DISTINCT FROM 'admin') ORDER BY a.id DESC LIMIT 5`, [u.role === "admin"]);
  const soon = await q("SELECT t.title,t.due::text due FROM tasks t LEFT JOIN users u ON u.id=t.assignee_id WHERE t.status<>'done' AND t.due >= CURRENT_DATE AND ($1 OR u.role IS DISTINCT FROM 'admin') ORDER BY t.due LIMIT 3", [u.role === "admin"]);
  const users = await q("SELECT id,name FROM users ORDER BY name");
  const pct = st.total ? Math.round((st.done / st.total) * 100) : 0;
  const hour = new Date().toLocaleString("en-US", { hour: "numeric", hour12: false, timeZone: "Africa/Cairo" });
  const greet = hour >= 5 && hour < 12 ? "Good morning" : hour >= 12 && hour < 18 ? "Good afternoon" : "Good evening";
  return (
    <>
      <Heading title={`${greet}, ${u.name.split(" ")[0]} 👋`} sub="Here's what's happening with your project today.">
        {isManager(u) && <Modal label="＋ Create new task" title="Create a new task"><TaskForm users={users} me={u} action={createTask} /></Modal>}
      </Heading>
      <div className="stats">
        <div className="card stat"><div className="stathead">Team Members <span className="staticon">♙</span></div><strong>{st.members}</strong><span className="trend">● Active workspace</span></div>
        <div className="card stat"><div className="stathead">Total Tasks <span className="staticon">☷</span></div><strong>{st.total}</strong><span className="trend">↑ {st.added} added this month</span></div>
        <div className="card stat"><div className="stathead">Ideas Submitted <span className="staticon">✧</span></div><strong>{ide.n}</strong><span className="trend">↑ {ide.fresh} new this week</span></div>
        <div className="card stat"><div className="stathead">Pending Reviews <span className="staticon">◷</span></div><strong>{pend.n}</strong><span style={{ fontSize: 11, color: "var(--amber)" }}>{pend.n ? "Needs attention" : "All clear"}</span></div>
      </div>
      <div className="gridmain">
        <div>
          <div className="projectbox"><small>ACTIVE PROJECT · 2026 / 2027</small><h2>Graduation Project Workspace</h2><p>Central space for planning, collaboration, documentation and delivery.</p><div className="projectfoot"><span>Overall progress</span><b>{pct}%</b></div><div className="progressline" style={{ background: "#ffffff35" }}><span style={{ width: pct + "%", background: "#9dbaff" }} /></div></div>
          <div className="card panel"><div className="panelhead"><h2>Priority Tasks</h2><Link className="mutelink" href="/tasks">View all →</Link></div>
            {prio.length === 0 && <div className="empty">No open tasks.</div>}
            {prio.map((t) => (<div className="taskrow" key={t.id}><div><div className="tasktitle">{t.title}</div><div className="taskmeta">{t.assignee || "Unassigned"} · Due {fmtDate(t.due)}</div></div><Pill s={t.status} /></div>))}
          </div>
        </div>
        <div>
          <div className="card panel" style={{ marginBottom: 16 }}><div className="panelhead"><h2>Recent Activity</h2><Link className="mutelink" href="/activity">See all</Link></div><div className="activity">
            {act.map((a, i) => (<div className="activityitem" key={i}><div className="dot">{ICON[a.icon] || "•"}</div><div><p><b>{a.name}</b> {a.text}</p><small>{a.subject ? a.subject + " · " : ""}{ago(a.at)}</small></div></div>))}
          </div></div>
          <div className="card panel"><div className="panelhead"><h2>Upcoming Deadlines</h2><Link className="mutelink" href="/calendar">Calendar</Link></div>
            {soon.length === 0 && <div className="empty">Nothing due soon.</div>}
            {soon.map((t, i) => { const d = daysLeft(t.due); return (<div className="taskrow" key={i}><div><div className="tasktitle">{t.title}</div><div className="taskmeta">{fmtDate(t.due)} · {d === 0 ? "today" : d + " day" + (d === 1 ? "" : "s") + " left"}</div></div><span className={"status " + (d <= 3 ? "s-review" : "s-pending")}>{d <= 3 ? "Soon" : "Upcoming"}</span></div>); })}
          </div>
        </div>
      </div>
    </>
  );
}
