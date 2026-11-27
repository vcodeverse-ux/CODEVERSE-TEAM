import { q } from "@/lib/db";
import { currentUser } from "@/lib/auth";
export const dynamic = "force-dynamic";

export async function GET(_req, { params }) {
  if (!(await currentUser())) return new Response("Unauthorized", { status: 401 });
  const { id } = await params;
  const [r] = await q("SELECT avatar FROM users WHERE id=$1", [Number(id) || 0]);
  if (!r || !r.avatar) return new Response("Not found", { status: 404 });
  const buf = Buffer.from(r.avatar);
  const type = buf[0] === 0x89 ? "image/png" : buf[0] === 0x52 ? "image/webp" : "image/jpeg";
  return new Response(buf, { headers: { "content-type": type, "cache-control": "private, max-age=86400", "x-content-type-options": "nosniff" } });
}
