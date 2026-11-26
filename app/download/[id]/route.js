import { q } from "@/lib/db";
import { currentUser } from "@/lib/auth";
export const dynamic = "force-dynamic";

export async function GET(_req, { params }) {
  if (!(await currentUser())) return new Response("Unauthorized", { status: 401 });
  const { id } = await params;
  const [f] = await q("SELECT name,mime,data FROM files WHERE id=$1", [Number(id) || 0]);
  if (!f) return new Response("Not found", { status: 404 });
  return new Response(Buffer.from(f.data), {
    headers: { "content-type": f.mime || "application/octet-stream", "content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent(f.name)}`, "x-content-type-options": "nosniff" },
  });
}
