import { q } from "@/lib/db";
export const dynamic = "force-dynamic";

// GET /api/stats: public, aggregate-only project numbers (no personal data)
export async function GET() {
  const [t] = await q("SELECT count(*)::int total, count(*) FILTER (WHERE status='done')::int done FROM tasks");
  const [m] = await q("SELECT count(*)::int members FROM users");
  const [i] = await q("SELECT count(*)::int ideas FROM ideas");
  return Response.json({ members: m.members, tasks: t.total, completed: t.done, progress: t.total ? Math.round((t.done / t.total) * 100) : 0, ideas: i.ideas });
}
