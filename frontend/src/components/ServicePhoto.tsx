import { useSettings } from "../context/SettingsContext";

// Shows the studio photo the shop owner uploaded (whole picture, never cropped), or a labelled placeholder.
export default function ServicePhoto({ photoKey, alt, dark = false }: { photoKey: string; alt: string; dark?: boolean }) {
  const { settings } = useSettings();
  const url = settings[photoKey];
  if (url) return <img src={url} alt={alt} loading="lazy" className={`aspect-[3/2] w-full rounded-lg object-contain ${dark ? "bg-navy" : "border border-slate-200 bg-white"}`} />;
  return <div className={`grid aspect-[3/2] place-items-center rounded-lg text-sm font-bold ${dark ? "bg-navy text-[#9fb2e6]" : "placeholder-box"}`} role="img" aria-label="Service photo placeholder">Service Photo</div>;
}
