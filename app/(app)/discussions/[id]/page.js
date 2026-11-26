import Link from "next/link";
import { notFound } from "next/navigation";
import { q, iso } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Avatar, Heading, Actions } from "../../../_c/ui";
import { addReply } from "@/lib/actions";
import { ago } from "@/lib/format";

export default async function Thread({ params }) {
  await requireUser();
  const { id } = await params;
  const [t] = await q("SELECT id,title,topic FROM threads WHERE id=$1", [Number(id) || 0]);
  if (!t) notFound();
  const msgs = await q(`SELECT r.body,${iso("r.created_at")} at,u.name FROM replies r LEFT JOIN users u ON u.id=r.author_id WHERE r.thread_id=$1 ORDER BY r.id`, [t.id]);
  return (
    <>
      <Heading title={t.title} sub={t.topic + " discussion"}><Link href="/discussions" className="btn secondary">← All discussions</Link></Heading>
      <div className="card panel">
        {msgs.map((m, i) => (<div className="thread-msg" key={i}><Avatar name={m.name} /><div><b style={{ fontSize: 12 }}>{m.name}</b> <small className="sub">{ago(m.at)}</small><p>{m.body}</p></div></div>))}
      </div>
      <form action={addReply} className="card panel"><input type="hidden" name="thread" value={t.id} />
        <label style={{ fontSize: 11, fontWeight: 700 }}>Your reply</label>
        <textarea name="body" required style={{ width: "100%", minHeight: 80, border: "1px solid var(--line)", borderRadius: 8, padding: 10, marginTop: 6, font: "inherit" }} />
        <Actions><button className="btn">Post reply</button></Actions></form>
    </>
  );
}
