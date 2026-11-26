import { q, iso } from "@/lib/db";
import { requireUser, isManager } from "@/lib/auth";
import Modal from "../../_c/Modal";
import { Pill, Heading, Field, Actions } from "../../_c/ui";
import { addRecord, setRecordStatus } from "@/lib/actions";
import { ago } from "@/lib/format";

const CATS = ["General Documentation", "Technical Documentation", "Planning", "Hardware Components", "Software & Source Code", "Cybersecurity", "Budget & Expenses"];

export default async function Database({ searchParams }) {
  const u = await requireUser();
  const { cat = "", q: term = "" } = await searchParams;
  const counts = await q("SELECT category, count(*)::int n FROM records GROUP BY category");
  const rows = await q(`SELECT r.id,r.title,r.category,r.body,r.status,${iso("r.updated_at")} at,u.name author FROM records r LEFT JOIN users u ON u.id=r.author_id
    WHERE ($1='' OR r.category=$1) AND ($2='' OR r.title ILIKE '%'||$2||'%' OR r.body ILIKE '%'||$2||'%') ORDER BY r.updated_at DESC`, [cat, term]);
  const total = counts.reduce((a, c) => a + c.n, 0);
  return (
    <>
      <Heading title="Project Database" sub="Your central knowledge base for project information.">
        <Modal label="＋ Add record" title="Add a record"><form action={addRecord}>
          <Field label="Title"><input name="title" required /></Field>
          <Field label="Category"><select name="category">{CATS.map((c) => <option key={c}>{c}</option>)}</select></Field>
          <Field label="Content"><textarea name="body" placeholder="Notes, decisions, specifications..." /></Field>
          <Actions><button className="btn">Save record</button></Actions></form></Modal>
      </Heading>
      <div className="toolbar"><form><input className="search" name="q" defaultValue={term} placeholder="⌕  Search records..." /><input type="hidden" name="cat" value={cat} /><button className="btn secondary">Search</button></form></div>
      <div className="gridmain">
        <div className="card panel"><div className="panelhead"><h2>{cat || "All records"}</h2><span className="tag">{rows.length} record{rows.length === 1 ? "" : "s"}</span></div>
          {rows.length === 0 && <div className="empty">No records.</div>}
          {rows.map((r) => (<div className="taskrow" key={r.id}><div><div className="tasktitle">{r.title}</div><div className="taskmeta">{r.category} · {r.author} · Updated {ago(r.at)}</div>{r.body && <div className="taskmeta" style={{ color: "#475467" }}>{r.body}</div>}</div>
            <div className="row-actions"><Pill s={r.status} />{isManager(u) && <form action={setRecordStatus}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="status" value={r.status === "approved" ? "review" : "approved"} /><button className="btn secondary sm">{r.status === "approved" ? "Unapprove" : "Approve"}</button></form>}</div></div>))}
        </div>
        <div className="card panel"><div className="panelhead"><h2>Categories</h2></div>
          <a href="/database" className="taskrow"><div className="tasktitle">All records</div><span className="tag">{total} items</span></a>
          {CATS.map((c) => (<a href={"/database?cat=" + encodeURIComponent(c)} className="taskrow" key={c}><div className="tasktitle">{c}</div><span className="tag">{counts.find((x) => x.category === c)?.n || 0} items</span></a>))}
        </div>
      </div>
    </>
  );
}
