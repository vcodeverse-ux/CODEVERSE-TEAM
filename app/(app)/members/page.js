import { q } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import Modal from "../../_c/Modal";
import { Avatar, Heading, Field, Actions, Notice } from "../../_c/ui";
import { addMember, setRole, resetPassword, changePassword } from "@/lib/actions";

const ROLE = { admin: "Administrator", leader: "Team Leader", member: "Member" };

export default async function Members({ searchParams }) {
  const u = await requireUser();
  const { pw = "", add = "" } = await searchParams;
  const rows = await q("SELECT id,name,email,role,team FROM users ORDER BY (role='admin') DESC, (role='leader') DESC, name");
  const admin = u.role === "admin";
  return (
    <>
      <Heading title="Team Members" sub="Manage access and responsibilities across the workspace.">
        <Modal label="Change my password" title="Change my password" className="btn secondary"><form action={changePassword}>
          <Field label="Current password"><input name="current" type="password" required /></Field>
          <Field label="New password (8+ characters)"><input name="next" type="password" minLength={8} required /></Field>
          <Actions><button className="btn">Update password</button></Actions></form></Modal>
        {admin && <Modal label="＋ Add member" title="Add a team member"><form action={addMember}>
          <Field label="Full name"><input name="name" required /></Field>
          <Field label="Email"><input name="email" type="email" required /></Field>
          <Field label="Team"><input name="team" placeholder="e.g. Hardware Team" /></Field>
          <Field label="Role"><select name="role"><option value="member">Member</option><option value="leader">Team Leader</option><option value="admin">Administrator</option></select></Field>
          <Field label="Temporary password (8+ characters)"><input name="password" minLength={8} required /></Field>
          <Actions><button className="btn">Add member</button></Actions></form></Modal>}
      </Heading>
      {pw === "ok" && <Notice>Password updated.</Notice>}{pw === "bad" && <Notice bad>Password not changed. Check the current password and use 8+ characters.</Notice>}
      {add === "ok" && <Notice>Member added.</Notice>}{add === "exists" && <Notice bad>That email already exists.</Notice>}{add === "bad" && <Notice bad>Check the name, email and a password of 8+ characters.</Notice>}{add === "reset" && <Notice>Password reset.</Notice>}
      <div className="membergrid">
        {rows.map((m) => (
          <div className="card member" key={m.id}><Avatar name={m.name} /><b>{m.name}</b><small>{m.team}</small><small>{m.email}</small><span className="tag">{ROLE[m.role]}</span>
            {admin && m.id !== u.id && (
              <div className="row-actions" style={{ justifyContent: "center", marginTop: 10 }}>
                <form action={setRole}><input type="hidden" name="id" value={m.id} /><input type="hidden" name="role" value={m.role === "leader" ? "member" : "leader"} /><button className="btn secondary sm">{m.role === "leader" ? "Make member" : "Make leader"}</button></form>
                <Modal label="Reset password" title={"Reset password: " + m.name} className="btn secondary sm"><form action={resetPassword}><input type="hidden" name="id" value={m.id} />
                  <Field label="New password (8+ characters)"><input name="password" minLength={8} required /></Field><Actions><button className="btn">Reset</button></Actions></form></Modal>
              </div>)}
          </div>))}
      </div>
    </>
  );
}
