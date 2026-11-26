import { q, iso } from "@/lib/db";
import { requireUser, isManager } from "@/lib/auth";
import Modal from "../../_c/Modal";
import { Pill, Heading, Field, Actions } from "../../_c/ui";
import { createIdea, toggleVote, setIdeaStatus } from "@/lib/actions";
import { ago, CATEGORIES } from "@/lib/format";

export default async function Ideas({ searchParams }) {
  const u = await requireUser();
  const { q: term = "", cat = "", status = "" } = await searchParams;
  const rows = await q(
    `SELECT i.id,i.title,i.category,i.description,i.status,${iso("i.created_at")} at,a.name author,
       (SELECT count(*)::int FROM idea_votes v WHERE v.idea_id=i.id) votes, EXISTS(SELECT 1 FROM idea_votes v WHERE v.idea_id=i.id AND v.user_id=$4) voted
     FROM ideas i LEFT JOIN users a ON a.id=i.author_id
     WHERE ($1='' OR i.title ILIKE '%'||$1||'%' OR i.description ILIKE '%'||$1||'%') AND ($2='' OR i.category=$2) AND ($3='' OR i.status=$3) ORDER BY i.created_at DESC`, [term, cat, status, u.id]);
  return (
    <>
      <Heading title="Ideas Hub" sub="A shared space to propose, discuss and develop ideas.">
        <Modal label="＋ Submit an idea" title="Submit a project idea"><form action={createIdea}>
          <Field label="Idea title"><input name="title" required placeholder="Give your idea a clear title" /></Field>
          <Field label="Category"><select name="category">{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
          <Field label="Description"><textarea name="description" placeholder="Explain the idea and its expected value..." /></Field>
          <Actions><button className="btn">Submit idea</button></Actions></form></Modal>
      </Heading>
      <div className="toolbar"><form>
        <input className="search" name="q" defaultValue={term} placeholder="⌕  Search ideas..." />
        <select className="filter" name="cat" defaultValue={cat}><option value="">All categories</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
        <select className="filter" name="status" defaultValue={status}><option value="">All statuses</option><option value="pending">Pending</option><option value="discussion">Under Discussion</option><option value="approved">Approved</option></select>
        <button className="btn secondary">Filter</button></form></div>
      <div className="idea-grid">
        {rows.length === 0 && <div className="card empty" style={{ gridColumn: "1/-1" }}>No ideas yet.</div>}
        {rows.map((i) => (
          <div className="card idea" key={i.id}><span className="tag">{i.category.toUpperCase()}</span><h3>{i.title}</h3><p>{i.description}</p>
            <div className="ideabottom"><span>By {i.author} · {ago(i.at)}</span>
              <form action={toggleVote}><input type="hidden" name="id" value={i.id} /><button className="btn light sm">{i.voted ? "♥" : "♡"} {i.votes} vote{i.votes === 1 ? "" : "s"}</button></form></div>
            <div style={{ marginTop: 11 }} className="row-actions"><Pill s={i.status} />
              {isManager(u) && ["pending", "discussion", "approved"].filter((s) => s !== i.status).map((s) => (
                <form action={setIdeaStatus} key={s}><input type="hidden" name="id" value={i.id} /><input type="hidden" name="status" value={s} /><button className="btn secondary sm">→ {s === "discussion" ? "discuss" : s}</button></form>))}
            </div></div>))}
      </div>
    </>
  );
}
