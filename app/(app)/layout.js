import { requireUser } from "@/lib/auth";
import { q } from "@/lib/db";
import { logout } from "@/lib/actions";
import { initials } from "@/lib/format";
import { Avatar } from "../_c/ui";
import Sidebar, { Crumb } from "../_c/Sidebar";

export const dynamic = "force-dynamic";
const ROLE = { admin: "Super Admin", leader: "Team Leader", member: "Member" };

export default async function AppLayout({ children }) {
  const u = await requireUser();
  const [{ n }] = await q("SELECT count(*)::int n FROM submissions WHERE status='pending'");
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand"><div className="brandmark">T</div><div><strong>TEAM CORE</strong><small>PROJECT WORKSPACE</small></div></div>
        <Sidebar pending={n} />
        <form action={logout} className="sidebottom">
          <Avatar name={u.name} id={u.id} av={u.av} />
          <div className="usertext"><b>{u.name}</b><small>{ROLE[u.role]}</small></div>
          <button className="signout" title="Sign out">⎋</button>
        </form>
      </aside>
      <main className="main">
        <div className="topbar"><Crumb /><div className="topright"><div className="profilemini"><Avatar name={u.name} id={u.id} av={u.av} /><div className="usertext"><b>{u.name}</b><small>{u.team}</small></div></div></div></div>
        {children}
      </main>
    </div>
  );
}
