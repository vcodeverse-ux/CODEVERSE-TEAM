"use client";
import { useRef } from "react";

export default function Modal({ label, title, children, className = "btn" }) {
  const r = useRef(null);
  return (
    <>
      <button type="button" className={className} onClick={() => r.current.showModal()}>{label}</button>
      <dialog ref={r} className="modal" onClick={(e) => e.target === r.current && r.current.close()}>
        <div className="modalhead"><h2>{title}</h2><button type="button" className="iconbtn" onClick={() => r.current.close()}>✕</button></div>
        <div onSubmit={() => setTimeout(() => r.current?.close(), 80)}>{children}</div>
      </dialog>
    </>
  );
}
