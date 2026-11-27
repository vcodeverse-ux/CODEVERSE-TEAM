import { q } from "@/lib/db";
import { currentUser } from "@/lib/auth";
export const dynamic = "force-dynamic";

// Shows images inline (only image types); everything else is refused here.
export async function GET(_req, { params }) {
  if (!(await currentUser())) return new Response("Unauthorized", { status: 401 });
  const { id } = await params;
  const [f] = await q("SELECT mime,data FROM files WHERE id=$1", [Number(id) || 0]);
  if (!f || !["image/jpeg", "image/png", "image/webp"].includes(f.mime)) return new Response("Not found", { status: 404 });
  return new Response(Buffer.from(f.data), { headers: { "content-type": f.mime, "cache-control": "private, max-age=86400", "x-content-type-options": "nosniff" } });
}
