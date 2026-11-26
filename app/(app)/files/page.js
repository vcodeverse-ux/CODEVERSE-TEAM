import { q, iso } from "@/lib/db";
import { requireUser, isManager } from "@/lib/auth";
import Modal from "../../_c/Modal";
import { Heading, Field, Actions, Notice } from "../../_c/ui";
import { uploadFile, deleteFile } from "@/lib/actions";
import { fmtDate } from "@/lib/format";

const size = (b) => (b > 1048576 ? (b / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(b / 1024)) + " KB");
const ext = (n) => (n.includes(".") ? n.split(".").pop().slice(0, 4).toUpperCase() : "FILE");

export default async function Files({ searchParams }) {
  const u = await requireUser();
  const { q: term = "", err = "" } = await searchParams;
  const rows = await q(`SELECT f.id,f.name,f.size,f.uploader_id,${iso("f.created_at")} at,u.name uploader FROM files f LEFT JOIN users u ON u.id=f.uploader_id WHERE ($1='' OR f.name ILIKE '%'||$1||'%') ORDER BY f.created_at DESC`, [term]);
  return (
    <>
      <Heading title="File Center" sub="Shared project files, organized in one place.">
        <Modal label="⇧ Upload file" title="Upload a file"><form action={uploadFile}>
          <Field label="File (up to 3 MB)"><input type="file" name="file" required /></Field>
          <Actions><button className="btn">Upload</button></Actions></form></Modal>
      </Heading>
      {err && <Notice bad>That file is larger than 3 MB.</Notice>}
      <div className="toolbar"><form><input className="search" name="q" defaultValue={term} placeholder="⌕  Search files..." /><button className="btn secondary">Search</button></form></div>
      <div className="filegrid">
        {rows.length === 0 && <div className="card empty" style={{ gridColumn: "1/-1" }}>No files yet. Upload the first one.</div>}
        {rows.map((f) => (
          <div className="card filecard" key={f.id}><div className="fileico">{ext(f.name)}</div>
            <div style={{ minWidth: 0, flex: 1 }}><b style={{ wordBreak: "break-all" }}>{f.name}</b><small>{size(f.size)} · {f.uploader}</small><small>{fmtDate(f.at)}</small>
              <div className="row-actions" style={{ marginTop: 6 }}><a className="btn light sm" href={"/download/" + f.id}>Download</a>
                {(isManager(u) || f.uploader_id === u.id) && <form action={deleteFile}><input type="hidden" name="id" value={f.id} /><button className="btn danger sm">Delete</button></form>}</div></div></div>))}
      </div>
    </>
  );
}
