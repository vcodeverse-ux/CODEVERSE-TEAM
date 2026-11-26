import { q, iso } from "@/lib/db";
import { requireUser, isManager } from "@/lib/auth";
import Modal from "../../_c/Modal";
import { Heading, Field, Actions } from "../../_c/ui";
import { addEvent } from "@/lib/actions";
import { fmtDateTime, fmtDate } from "@/lib/format";

export default async function Calendar() {
  const u = await requireUser();
  const ev = await q(`SELECT title,kind,${iso("starts_at")} at,starts_at FROM events WHERE starts_at >= now() - interval '1 day'`);
  const due = await q("SELECT t.title,t.due::text due,u.name FROM tasks t LEFT JOIN users u ON u.id=t.assignee_id WHERE t.status<>'done' AND t.due >= CURRENT_DATE - 1 AND ($1 OR u.role IS DISTINCT FROM 'admin')", [u.role === "admin"]);
  const items = [
    ...ev.map((e) => ({ title: e.title, when: e.at, label: fmtDateTime(e.at), kind: e.kind, cls: e.kind === "Deadline" ? "s-review" : "s-progress" })),
    ...due.map((d) => ({ title: d.title + (d.name ? " (" + d.name + ")" : ""), when: d.due + "T23:59:00Z", label: fmtDate(d.due) + " · task deadline", kind: "Task due", cls: "s-pending" })),
  ].sort((a, b) => (a.when < b.when ? -1 : 1));
  return (
    <>
      <Heading title="Team Calendar" sub="Upcoming milestones and team deadlines.">
        {isManager(u) && <Modal label="＋ Add event" title="Add an event"><form action={addEvent}>
          <Field label="Title"><input name="title" required /></Field>
          <Field label="Type"><select name="kind"><option>Meeting</option><option>Deadline</option></select></Field>
          <Field label="Date and time (Cairo)"><input name="when" type="datetime-local" required /></Field>
          <Actions><button className="btn">Add event</button></Actions></form></Modal>}
      </Heading>
      <div className="card panel">
        {items.length === 0 && <div className="empty">Nothing scheduled.</div>}
        {items.map((i, k) => (<div className="taskrow" key={k}><div><div className="tasktitle">{i.title}</div><div className="taskmeta">{i.label}</div></div><span className={"status " + i.cls}>{i.kind}</span></div>))}
      </div>
    </>
  );
}
