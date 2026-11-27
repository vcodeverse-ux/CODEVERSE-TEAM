import { STATUS, initials } from "@/lib/format";

export const Pill = ({ s, children }) => { const [l, c] = STATUS[s] || [s, "s-pending"]; return <span className={"status " + c}>{children || l}</span>; };
export const Avatar = ({ name, size, id, av }) => (
  <div className="avatar" style={size ? { width: size, height: size, fontSize: size / 3 } : undefined}>
    {id && av ? <img src={`/avatar/${id}?v=${av}`} alt="" className="avatarimg" /> : initials(name)}
  </div>
);
export const Field = ({ label, children }) => <><label>{label}</label>{children}</>;
export const Actions = ({ children }) => <div className="modalactions">{children}</div>;
export function Heading({ title, sub, children }) {
  return (<div className="heading"><div><h1>{title}</h1><p className="sub">{sub}</p></div><div className="row-actions">{children}</div></div>);
}
export const Notice = ({ children, bad }) => <div className={"notice" + (bad ? " bad" : "")}>{children}</div>;
