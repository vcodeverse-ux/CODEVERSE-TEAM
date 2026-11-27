import { q } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import Modal from "../../_c/Modal";
import { Avatar, Heading, Field, Actions, Notice } from "../../_c/ui";
import Link from "next/link";
import ProfilePhoto from "../../_c/ProfilePhoto";
import { addMember, setRole, resetPassword, changePassword, deleteMember, deleteDemoMembers } from "@/lib/actions";

const ROLE = { admin: "Administrator", leader: "Team Leader", member: "Member" };

export default async function Members({ searchParams }) {
  const u = await requireUser();
  const { pw = "", add = "" } = await searchParams;
  const rows = await q("SELECT u.id,u.name,floor(extract(epoch from u.avatar_at))::int AS av,u.email,u.role,u.team, count(t.id) FILTER (WHERE t.status='done')::int AS done, count(t.id) FILTER (WHERE t.status<>'done')::int AS open FROM users u LEFT JOIN tasks t ON t.assignee_id=u.id GROUP BY u.id ORDER BY (u.role='admin') DESC, (u.role='leader') DESC, u.name");
  const adminCount = rows.filter((r) => r.role === "admin").length;

  const admin = u.role === "admin";
  return (
    <>
      <Heading title="Team Members" sub="Manage access and responsibilities across the workspace.">
        <Modal label="My profile photo" title="My profile photo" className="btn secondary"><ProfilePhoto me={u} /></Modal>
        <Modal label="Change my password" title="Change my password" className="btn secondary"><form action={changePassword}>
          <Field label="Current password"><input name="current" type="password" required /></Field>
          <Field label="New password (8+ characters)"><input name="next" type="password" minLength={8} required /></Field>
          <Actions><button className="btn">Update password</button></Actions></form></Modal>
        {admin && <Modal label="Clear demo data" title="Clear all demo data?" className="btn secondary"><form action={deleteDemoMembers}><p>This deletes every demo account (emails ending in @teamcore.dev) except yours, and all demo tasks, ideas, records, discussions, events and files. Make sure you can log in with your own admin account first.</p><Actions><button className="btn">Yes, remove them</button></Actions></form></Modal>}
        {admin && <Modal label="＋ Add member" title="Add a team member"><form action={addMember}>
          <Field label="Full name"><input name="name" required /></Field>
          <Field label="Email"><input name="email" type="email" required /></Field>
          <Field label="Team"><input name="team" placeholder="e.g. Hardware Team" /></Field>
          <Field label="Role"><select name="role"><option value="member">Member</option><option value="leader">Team Leader</option><option value="admin">Administrator</option></select></Field>
          <Field label="Temporary password (8+ characters)"><input name="password" minLength={8} required /></Field>
          <Actions><button className="btn">Add member</button></Actions></form></Modal>}
      </Heading>
      {add === "photo" && <Notice>Profile photo updated.</Notice>}{add === "photobad" && <Notice bad>Photo not saved. Choose a PNG, JPG or WebP picture.</Notice>}{pw === "ok" && <Notice>Password updated.</Notice>}{pw === "bad" && <Notice bad>Password not changed. Check the current password and use 8+ characters.</Notice>}
      {add === "ok" && <Notice>Member added.</Notice>}{add === "exists" && <Notice bad>That email already exists.</Notice>}{add === "bad" && <Notice bad>Check the name, email and a password of 8+ characters.</Notice>}{add === "maxadmin" && <Notice bad>Only 3 administrators are allowed.</Notice>}{add === "deleted" && <Notice>Removed.</Notice>}{add === "nodelete" && <Notice bad>You cannot remove your own account.</Notice>}{add === "reset" && <Notice>Password reset.</Notice>}
      <div className="membergrid">
        {rows.map((m) => (
          <div className="card member" key={m.id}><Avatar name={m.name} id={m.id} av={m.av} /><b>{m.name}</b><small>{m.team}</small><small>{m.email}</small><span className="tag">{ROLE[m.role]}</span>
            {admin || (u.role === "leader" && m.role !== "admin") ? <small><Link href={"/members/" + m.id}><b>{m.done} done · {m.open} not done</b></Link></small> : null}
            {admin && m.id !== u.id && (
              <div className="row-actions" style={{ justifyContent: "center", marginTop: 10 }}>
                <form action={setRole}><input type="hidden" name="id" value={m.id} /><input type="hidden" name="role" value={m.role === "admin" ? "member" : m.role === "leader" ? "member" : "leader"} /><button className="btn secondary sm" disabled={m.role === "admin" && adminCount <= 1}>{m.role === "admin" ? "Remove admin" : m.role === "leader" ? "Make member" : "Make leader"}</button></form>
                {m.role !== "admin" && adminCount < 3 && <form action={setRole}><input type="hidden" name="id" value={m.id} /><input type="hidden" name="role" value="admin" /><button className="btn secondary sm">Make admin</button></form>}
                <Modal label="Delete" title={"Delete " + m.name + "?"} className="btn danger sm"><form action={deleteMember}><input type="hidden" name="id" value={m.id} /><p>This removes the account. Their tasks stay but become unassigned.</p><Actions><button className="btn">Yes, delete</button></Actions></form></Modal>
                <Modal label="Reset password" title={"Reset password: " + m.name} className="btn secondary sm"><form action={resetPassword}><input type="hidden" name="id" value={m.id} />
                  <Field label="New password (8+ characters)"><input name="password" minLength={8} required /></Field><Actions><button className="btn">Reset</button></Actions></form></Modal>
              </div>)}
          </div>))}
      </div>
    </>
  );
}
