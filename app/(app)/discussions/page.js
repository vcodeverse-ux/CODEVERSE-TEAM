import Link from "next/link";
import { q, iso } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import Modal from "../../_c/Modal";
import { Heading, Field, Actions } from "../../_c/ui";
import { createThread } from "@/lib/actions";
import { ago } from "@/lib/format";

export default async function Discussions() {
  await requireUser();
  const rows = await q(`SELECT t.id,t.title,t.topic,u.name author,(SELECT count(*)::int FROM replies r WHERE r.thread_id=t.id)-1 replies,
    ${iso("coalesce((SELECT max(created_at) FROM replies r WHERE r.thread_id=t.id), t.created_at)")} last FROM threads t LEFT JOIN users u ON u.id=t.author_id ORDER BY last DESC`);
  return (
    <>
      <Heading title="Team Discussions" sub="Keep decisions and conversations connected to the work.">
        <Modal label="＋ Start discussion" title="Start a discussion"><form action={createThread}>
          <Field label="Discussion title"><input name="title" required placeholder="What should the team discuss?" /></Field>
          <Field label="Topic"><select name="topic"><option>Hardware</option><option>Software</option><option>Planning</option><option>General</option></select></Field>
          <Field label="Opening message"><textarea name="body" required placeholder="Add context for the discussion..." /></Field>
          <Actions><button className="btn">Start</button></Actions></form></Modal>
      </Heading>
      <div className="card panel">
        {rows.length === 0 && <div className="empty">No discussions yet.</div>}
        {rows.map((t) => (<Link href={"/discussions/" + t.id} className="taskrow" key={t.id}><div><div className="tasktitle">{t.title}</div><div className="taskmeta">{Math.max(t.replies, 0)} repl{t.replies === 1 ? "y" : "ies"} · Last update {ago(t.last)} · {t.author}</div></div><span className="status s-review">{t.topic}</span></Link>))}
      </div>
    </>
  );
}
