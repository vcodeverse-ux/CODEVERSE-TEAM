import { login } from "@/lib/actions";
import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";

export default async function Login({ searchParams }) {
  if (await currentUser()) redirect("/");
  const { error } = await searchParams;
  return (
    <div className="login-wrap">
      <section className="login-hero">
        <div className="brand" style={{ padding: 0 }}><div className="brandmark">T</div><div><strong>TEAM CORE</strong><small>PROJECT WORKSPACE</small></div></div>
        <div><h1>One workspace for the whole project team.</h1><p>Plan tasks, review submissions, share files and keep every decision in one place.</p></div>
        <ul><li>▦ Dashboard with live project progress</li><li>☷ Tasks, deadlines and review flow</li><li>✧ Ideas, discussions and shared files</li></ul>
      </section>
      <section className="login-panel">
        <form action={login} className="login-card">
          <h2>Sign in</h2><p className="sub">Use your team account.</p>
          {error && <div className="notice bad" style={{ marginTop: 14 }}>Wrong email or password.</div>}
          <label>Email</label><input name="email" type="email" required autoComplete="username" placeholder="name@teamcore.dev" />
          <label>Password</label><input name="password" type="password" required autoComplete="current-password" />
          <button className="btn">Sign in</button>
          <div className="hint">First run demo accounts use the email <b>first.last@teamcore.dev</b> (for example <b>adham.aiman@teamcore.dev</b>, the admin) and the default password listed in the README. Change it after signing in.</div>
        </form>
      </section>
    </div>
  );
}
