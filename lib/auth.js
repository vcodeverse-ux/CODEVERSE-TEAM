import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { q } from "./db";
import { readSession } from "./password";

export async function currentUser() {
  const id = readSession((await cookies()).get("session")?.value);
  if (!id) return null;
  return (await q("SELECT id,name,email,role,team FROM users WHERE id=$1", [id]))[0] || null;
}
export async function requireUser() {
  const u = await currentUser();
  if (!u) redirect("/login");
  return u;
}
export const isManager = (u) => u.role === "admin" || u.role === "leader";
export async function requireAdmin() {
  const u = await requireUser();
  if (u.role !== "admin") redirect("/");
  return u;
}
