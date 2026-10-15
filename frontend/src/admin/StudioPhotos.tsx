import { useEffect, useState } from "react";
import { api } from "../services/api";
import { readError } from "../utils/forms";
import { admin, uploadImage } from "./adminApi";

const SLOTS: [string, string, string][] = [
  ["studio_photo_home", "Home recording studio", "Homepage and Studio setup page"],
  ["studio_photo_professional", "Professional recording studio", "Homepage and Studio setup page"],
  ["studio_photo_podcast", "Podcast studio", "Homepage and Studio setup page"],
  ["studio_photo_church", "Church sound system", "Homepage and Studio setup page"],
  ["studio_photo_dj", "DJ booth and event setup", "Homepage and Studio setup page"],
  ["studio_photo_production", "Music production workstation", "Studio setup page"],
  ["studio_photo_acoustic", "Acoustic treatment and monitoring", "Studio setup page, and the homepage card \"Studio equipment consultation\""],
];

export default function StudioPhotos() {
  const [v, setV] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [n, setN] = useState<{ ok: boolean; text: string } | null>(null);
  useEffect(() => { api.settings().then((r) => setV(r.settings)).catch((e: Error) => setN({ ok: false, text: e.message })); }, []);

  const change = async (key: string, file: File | undefined) => {
    if (!file) return;
    setBusy(key); setN(null);
    try {
      const url = await uploadImage(file);
      setV((await admin.saveSettings({ [key]: url })).settings);
      setN({ ok: true, text: "Photo saved. Visitors see it within a minute." });
    } catch (e) { setN({ ok: false, text: readError(e).message }); } finally { setBusy(null); }
  };
  const remove = async (key: string) => {
    setBusy(key);
    try { setV((await admin.saveSettings({ [key]: "" })).settings); setN({ ok: true, text: "Photo removed." }); }
    catch (e) { setN({ ok: false, text: readError(e).message }); } finally { setBusy(null); }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">Studio service photos</h1>
      <p className="text-slate-600">Upload one photo for each studio service (JPEG, PNG or WebP, up to 5 MB). The whole picture is shown. Use your own photos or photos you are licensed to use. Only the shop administrator can change these.</p>
      {n && <p role={n.ok ? "status" : "alert"} className={`rounded-lg border p-3 ${n.ok ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-red-300 bg-red-50 text-red-800"}`}>{n.text}</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SLOTS.map(([key, title, where]) => (
          <section key={key} className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="font-extrabold">{title}</h2><p className="mb-2 text-xs text-slate-500">Shown on: {where}</p>
            {v[key] ? <img src={v[key]} alt={title} className="mb-3 aspect-[3/2] w-full rounded-lg border border-slate-200 bg-white object-contain" /> : <div className="placeholder-box mb-3 aspect-[3/2] rounded-lg">No photo yet</div>}
            <input type="file" accept="image/jpeg,image/png,image/webp" aria-label={`Upload photo for ${title}`} disabled={busy === key} onChange={(e) => { change(key, e.target.files?.[0]); e.target.value = ""; }} className="text-sm" />
            {busy === key && <p className="text-sm text-slate-600" role="status">Working…</p>}
            {v[key] && <button className="mt-2 block text-sm font-bold text-red-700" onClick={() => window.confirm("Remove this photo?") && remove(key)}>Remove photo</button>}
          </section>
        ))}
      </div>
    </div>
  );
}
