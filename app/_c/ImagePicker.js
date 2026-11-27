"use client";
import { useRef, useState } from "react";

// Lets the user choose several pictures and shrinks each to max 1280 px JPEG before upload.
export default function ImagePicker({ name }) {
  const input = useRef(null);
  const [prev, setPrev] = useState([]);
  async function onPick(e) {
    const files = [...e.target.files].slice(0, 6);
    const dt = new DataTransfer();
    const urls = [];
    for (const file of files) {
      try {
        const img = await createImageBitmap(file);
        const k = Math.min(1, 1280 / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        const blob = await new Promise((r) => c.toBlob(r, "image/jpeg", 0.8));
        dt.items.add(new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" }));
        urls.push(URL.createObjectURL(blob));
      } catch {}
    }
    input.current.files = dt.files;
    setPrev(urls);
  }
  return (<>
    <input ref={input} type="file" name={name} accept="image/png,image/jpeg,image/webp" multiple onChange={onPick} />
    <div className="imgprev">{prev.map((u) => <img key={u} src={u} alt="" />)}</div>
  </>);
}
