import { q, iso } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Heading } from "../../_c/ui";
import { fmtDateTime } from "@/lib/format";

const ICON = { up: "⇧", idea: "✧", check: "✓", user: "♙", task: "☷", file: "▱", chat: "☏", db: "▤", cal: "◫", dot: "•" };

export default async function Activity() {
  const me = await requireUser();
  const rows = await q(`SELECT a.text,a.subject,a.icon,${iso("a.created_at")} at,u.name FROM activity a LEFT JOIN users u ON u.id=a.user_id WHERE ($1 OR u.role IS DISTINCT FROM 'admin') ORDER BY a.id DESC LIMIT 100`, [me.role === "admin"]);
  return (
    <>
      <Heading title="Activity Logs" sub="A transparent record of important workspace actions." />
      <div className="card panel"><div className="activity">
        {rows.map((a, i) => (<div className="activityitem" key={i}><div className="dot">{ICON[a.icon] || "•"}</div><div><p><b>{a.name}</b> {a.text}{a.subject ? " " : ""}<b style={{ fontWeight: 600 }}>{a.subject}</b></p><small>{fmtDateTime(a.at)}</small></div></div>))}
      </div></div>
    </>
  );
}
