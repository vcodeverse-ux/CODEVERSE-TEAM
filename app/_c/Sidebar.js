"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const WORK = [["/", "Dashboard", "▦"], ["/tasks", "Tasks", "☷"], ["/ideas", "Ideas Hub", "✧"], ["/database", "Project Database", "▤"], ["/files", "File Center", "▱"], ["/discussions", "Discussions", "☏"], ["/calendar", "Team Calendar", "◫"]];
const ADMIN = [["/submissions", "Submissions", "⇧"], ["/members", "Team Members", "♙"], ["/activity", "Activity Logs", "◷"]];
export const TITLES = Object.fromEntries([...WORK, ...ADMIN].map(([h, l]) => [h, l]));

export function Crumb() {
  const p = usePathname();
  const key = p === "/" ? "/" : "/" + p.split("/")[1];
  return <div className="crumb">Workspace&nbsp; / &nbsp;<span>{TITLES[key] || ""}</span></div>;
}
export default function Sidebar({ pending }) {
  const p = usePathname();
  const on = (h) => (h === "/" ? p === "/" : p.startsWith(h));
  const link = ([h, l, i]) => (
    <Link key={h} href={h} className={on(h) ? "active" : ""}>
      <span className="ico">{i}</span><span className="navtext">{l}{h === "/submissions" && pending > 0 && <span style={{ color: "#9bb8ff" }}> • {pending}</span>}</span>
    </Link>
  );
  return (
    <>
      <div className="navlabel">WORKSPACE</div><nav className="nav">{WORK.map(link)}</nav>
      <div className="navlabel">ADMINISTRATION</div><nav className="nav">{ADMIN.map(link)}</nav>
    </>
  );
}
