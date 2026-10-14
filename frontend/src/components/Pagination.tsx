export default function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  const pages: number[] = [];
  for (let p = Math.max(1, page - 2); p <= Math.min(totalPages, page + 2); p++) pages.push(p);
  const base = "h-10 min-w-10 rounded-lg border border-slate-300 px-3 text-sm font-bold disabled:opacity-40";
  return (
    <nav aria-label="Pagination" className="mt-8 flex flex-wrap items-center justify-center gap-2">
      <button className={base} disabled={page <= 1} onClick={() => onChange(page - 1)}>Previous</button>
      {pages[0] > 1 && <span aria-hidden>…</span>}
      {pages.map((p) => (
        <button key={p} onClick={() => onChange(p)} aria-current={p === page ? "page" : undefined}
          className={`${base} ${p === page ? "!border-navy bg-navy text-white" : "hover:border-electric"}`}>{p}</button>
      ))}
      {pages[pages.length - 1] < totalPages && <span aria-hidden>…</span>}
      <button className={base} disabled={page >= totalPages} onClick={() => onChange(page + 1)}>Next</button>
    </nav>
  );
}
