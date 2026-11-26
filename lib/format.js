export const initials = (n = "") => n.split(" ").filter(Boolean).slice(0, 2).map((x) => x[0]).join("").toUpperCase();
export const fmtDate = (d) => (d ? new Date(String(d).slice(0, 10) + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric", timeZone: "UTC" }) : "No deadline");
export const fmtDateTime = (d) => new Date(d).toLocaleString("en-US", { month: "long", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Cairo" });
export function ago(d) {
  const m = Math.max(0, Math.round((Date.now() - new Date(d).getTime()) / 60000));
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  if (m < 1440) return `${Math.round(m / 60)} hour${Math.round(m / 60) > 1 ? "s" : ""} ago`;
  const days = Math.round(m / 1440);
  return days === 1 ? "Yesterday" : `${days} days ago`;
}
export const daysLeft = (d) => Math.ceil((new Date(String(d).slice(0, 10) + "T00:00:00Z") - new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z")) / 864e5);
export const STATUS = {
  todo: ["To Do", "s-pending"], progress: ["In Progress", "s-progress"], submitted: ["Submitted", "s-review"], done: ["Completed", "s-done"],
  pending: ["Pending", "s-pending"], approved: ["Approved", "s-done"], changes: ["Changes requested", "s-progress"], discussion: ["Under Discussion", "s-review"], review: ["In Review", "s-review"],
};
export const CATEGORIES = ["Hardware", "Software", "Cyber Security", "Research", "Documentation", "Planning"];
