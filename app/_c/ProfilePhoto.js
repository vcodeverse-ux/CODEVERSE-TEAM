"use client";
import { useRef, useState } from "react";
import { setAvatar } from "@/lib/actions";

// Shrinks the chosen picture to 256x256 (JPEG) in the browser before upload, so it uses very little database space.
export default function ProfilePhoto() {
  const input = useRef(null);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  async function onPick(e) {
    const file = e.target.files[0];
    if (!file) return;
    setBusy(true);
    try {
      const img = await createImageBitmap(file);
      const side = Math.min(img.width, img.height);
      const c = document.createElement("canvas");
      c.width = c.height = 256;
      c.getContext("2d").drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, 256, 256);
      const blob = await new Promise((r) => c.toBlob(r, "image/jpeg", 0.85));
      const dt = new DataTransfer();
      dt.items.add(new File([blob], "avatar.jpg", { type: "image/jpeg" }));
      input.current.files = dt.files;
      setPreview(URL.createObjectURL(blob));
    } catch {
      input.current.value = "";
      setPreview("");
      alert("Could not read this picture. Try a PNG or JPG.");
    }
    setBusy(false);
  }
  return (
    <form action={setAvatar}>
      <p className="sub">Choose a picture. It is cropped to a square and shrunk automatically.</p>
      {preview && <img src={preview} alt="" style={{ width: 96, height: 96, borderRadius: "50%", objectFit: "cover", margin: "8px 0" }} />}
      <input ref={input} type="file" name="photo" accept="image/png,image/jpeg,image/webp" onChange={onPick} />
      <div className="modalactions">
        <button className="btn" disabled={busy || !preview}>Save photo</button>
        <button className="btn secondary" name="remove" value="1" formNoValidate>Remove my photo</button>
      </div>
    </form>
  );
}
