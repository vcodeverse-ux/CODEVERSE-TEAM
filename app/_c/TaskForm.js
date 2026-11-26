import { isManager } from "@/lib/auth";
import { Field, Actions } from "./ui";

export default function TaskForm({ users, me, action }) {
  const mgr = isManager(me);
  return (
    <form action={action}>
      <Field label="Task title"><input name="title" required placeholder="e.g. Prepare system architecture" /></Field>
      <Field label="Assign to"><select name="assignee" defaultValue={me.id} disabled={!mgr}>{users.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></Field>
      <Field label="Category"><input name="category" placeholder="e.g. Hardware research" /></Field>
      <Field label="Priority"><select name="priority" defaultValue="Medium"><option>High</option><option>Medium</option><option>Low</option></select></Field>
      <Field label="Deadline"><input name="due" type="date" /></Field>
      <Field label="Description"><textarea name="description" placeholder="Describe the expected deliverable..." /></Field>
      <Actions><button className="btn">Create task</button></Actions>
    </form>
  );
}
