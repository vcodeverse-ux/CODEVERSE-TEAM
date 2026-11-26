import { q, iso } from "@/lib/db";
import { requireUser, isManager } from "@/lib/auth";
import Modal from "../../_c/Modal";
import { Pill, Heading, Field, Actions } from "../../_c/ui";
import { reviewSubmission } from "@/lib/actions";
import { ago } from "@/lib/format";

export default async function Submissions() {
  const u = await requireUser();
  const mgr = isManager(u);
  const rows = await q(`SELECT s.id,s.note,s.status,s.feedback,s.file_id,${iso("s.created_at")} at,t.title,t.id tid,m.name member,f.name fname FROM submissions s JOIN tasks t ON t.id=s.task_id
    LEFT JOIN users m ON m.id=s.user_id LEFT JOIN files f ON f.id=s.file_id WHERE ($1 OR s.user_id=$2) ORDER BY (s.status='pending') DESC, s.created_at DESC`, [mgr, u.id]);
  const pending = rows.filter((r) => r.status === "pending").length;
  return (
    <>
      <Heading title="Submission Review" sub={mgr ? "Review member deliverables and provide feedback." : "Your submitted work and its review status."}>
        <span className="status s-review">{pending} awaiting review</span>
      </Heading>
      <div className="card panel tablewrap"><table className="data"><thead><tr><th>SUBMISSION</th><th>MEMBER</th><th>SUBMITTED</th><th>FILE</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody>
        {rows.length === 0 && <tr><td colSpan={6} className="empty">No submissions yet.</td></tr>}
        {rows.map((r) => (<tr key={r.id}>
          <td><b>{r.title}</b><br /><small className="sub">Task #TC-{String(r.tid).padStart(3, "0")}{r.note ? " · " + r.note : ""}</small>{r.feedback && <><br /><small className="sub">Feedback: {r.feedback}</small></>}</td>
          <td>{r.member}</td><td>{ago(r.at)}</td><td>{r.file_id ? <a className="mutelink" href={"/download/" + r.file_id}>{r.fname}</a> : "-"}</td><td><Pill s={r.status} /></td>
          <td>{mgr && r.status === "pending" ? (
            <Modal label="Review" title={"Review: " + r.title} className="btn light sm"><form action={reviewSubmission}><input type="hidden" name="id" value={r.id} />
              <Field label="Feedback (optional)"><textarea name="feedback" placeholder="What is good, what should change?" /></Field>
              <Actions><button className="btn secondary" name="decision" value="changes">Request changes</button><button className="btn" name="decision" value="approve">Approve</button></Actions></form></Modal>) : "-"}</td></tr>))}
      </tbody></table></div>
    </>
  );
}
