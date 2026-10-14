import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Field, { aria } from "../components/Field";
import { useAuth } from "../context/AuthContext";
import { useSeo } from "../hooks/useSeo";
import { api } from "../services/api";
import { Address, AddressInput, OrderSummary } from "../types";
import { NIGERIAN_STATES } from "../utils/constants";
import { input, readError } from "../utils/forms";
import { naira } from "../utils/format";

const TABS = [["orders", "Orders"], ["profile", "Profile"], ["addresses", "Addresses"], ["password", "Password"]] as const;
const Msg = ({ ok, text }: { ok?: boolean; text: string | null }) => text ? <p role={ok ? "status" : "alert"} className={`rounded-lg border p-3 ${ok ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-red-300 bg-red-50 text-red-800"}`}>{text}</p> : null;

function Orders() {
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { api.myOrders().then((r) => setOrders(r.orders)).catch((e: Error) => setErr(e.message)); }, []);
  if (err) return <Msg text={err} />;
  if (!orders) return <p className="text-slate-500" role="status">Loading orders…</p>;
  if (!orders.length) return <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-600">No orders yet. <Link to="/shop" className="font-bold text-electric hover:underline">Start shopping</Link>. Orders you place while logged in appear here.</p>;
  return (
    <ul className="space-y-3">
      {orders.map((o) => (
        <li key={o.reference} className="rounded-xl border border-slate-200 p-4">
          <div className="flex flex-wrap justify-between gap-2"><Link to={`/order/${o.reference}`} className="font-mono font-bold text-electric hover:underline">{o.reference}</Link><b>{naira(o.total)}</b></div>
          <p className="text-sm text-slate-600">{new Date(o.createdAt).toLocaleDateString("en-NG", { dateStyle: "medium" })} · {o.status.replace(/_/g, " ").toLowerCase()} · {o.paymentStatus === "PAID" ? "paid" : "not yet paid"}</p>
          <p className="mt-1 text-sm">{o.items.map((i) => `${i.quantity} × ${i.name}`).join(", ")}</p>
        </li>
      ))}
    </ul>
  );
}

function Profile() {
  const { user, setUser } = useAuth();
  const [f, setF] = useState({ fullName: user?.fullName ?? "", phone: user?.phone ?? "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setMsg(null); setErrors({});
    try { setUser((await api.updateProfile(f)).user); setMsg({ ok: true, text: "Profile saved." }); }
    catch (err) { const r = readError(err); setErrors(r.fields); setMsg({ ok: false, text: r.message }); }
  };
  return (
    <form onSubmit={submit} className="max-w-md space-y-4">
      <Field id="email" label="Email address" hint="Email cannot be changed here."><input id="email" className={`${input} bg-mist`} value={user?.email ?? ""} disabled /></Field>
      <Field id="fullName" label="Full name" error={errors.fullName}><input id="fullName" className={input} value={f.fullName} onChange={(e) => setF({ ...f, fullName: e.target.value })} {...aria(errors, "fullName")} /></Field>
      <Field id="phone" label="Phone number" error={errors.phone}><input id="phone" type="tel" className={input} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} {...aria(errors, "phone")} /></Field>
      <Msg ok={msg?.ok} text={msg?.text ?? null} />
      <button className="btn btn-blue">Save profile</button>
    </form>
  );
}

const BLANK: AddressInput = { label: "", line1: "", city: "", state: "", phone: "", isDefault: false };
function Addresses() {
  const [list, setList] = useState<Address[] | null>(null);
  const [edit, setEdit] = useState<(AddressInput & { id?: number }) | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const load = () => api.addresses().then((r) => setList(r.addresses)).catch((e: Error) => setMsg(e.message));
  useEffect(() => { load(); }, []);

  const save = async (e: FormEvent) => {
    e.preventDefault(); if (!edit) return; setMsg(null); setErrors({});
    const { id, ...body } = edit;
    try { id ? await api.editAddress(id, body) : await api.addAddress(body); setEdit(null); await load(); }
    catch (err) { const r = readError(err); setErrors(r.fields); setMsg(r.message); }
  };
  const remove = async (id: number) => { if (!window.confirm("Delete this address?")) return; try { await api.deleteAddress(id); await load(); } catch (err) { setMsg(readError(err).message); } };

  if (edit) {
    const set = (k: keyof AddressInput) => (e: { target: { value: string } }) => setEdit({ ...edit, [k]: e.target.value });
    return (
      <form onSubmit={save} className="max-w-md space-y-4">
        <Field id="label" label="Label (optional)"><input id="label" className={input} placeholder="Home, Studio, Church" value={edit.label ?? ""} onChange={set("label")} /></Field>
        <Field id="line1" label="Street address" error={errors.line1}><input id="line1" className={input} value={edit.line1} onChange={set("line1")} {...aria(errors, "line1")} /></Field>
        <Field id="state" label="State" error={errors.state}><select id="state" className={input} value={edit.state} onChange={set("state")} {...aria(errors, "state")}><option value="">Choose state</option>{NIGERIAN_STATES.map((s) => <option key={s}>{s}</option>)}</select></Field>
        <Field id="city" label="City or area" error={errors.city}><input id="city" className={input} value={edit.city} onChange={set("city")} {...aria(errors, "city")} /></Field>
        <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={!!edit.isDefault} onChange={(e) => setEdit({ ...edit, isDefault: e.target.checked })} /> Make this my default address</label>
        <Msg text={msg} />
        <div className="flex gap-2"><button className="btn btn-blue">Save address</button><button type="button" className="btn border border-slate-300" onClick={() => { setEdit(null); setMsg(null); setErrors({}); }}>Cancel</button></div>
      </form>
    );
  }
  return (
    <div className="space-y-3">
      <Msg text={msg} />
      {!list ? <p className="text-slate-500" role="status">Loading…</p> : list.length === 0 ? <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-600">No saved addresses. Add one to speed up checkout.</p> : list.map((a) => (
        <div key={a.id} className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-200 p-4 text-sm">
          <div><b>{a.label || "Address"}</b>{a.isDefault && <span className="ml-2 rounded-full bg-mist px-2 py-0.5 text-xs font-bold">Default</span>}<br />{a.line1}, {a.city}, {a.state}</div>
          <div className="flex gap-3"><button className="font-bold text-electric" onClick={() => setEdit({ id: a.id, label: a.label ?? "", line1: a.line1, city: a.city, state: a.state, phone: a.phone ?? "", isDefault: a.isDefault })}>Edit</button><button className="font-bold text-red-700" onClick={() => remove(a.id)}>Delete</button></div>
        </div>
      ))}
      <button className="btn btn-blue" onClick={() => setEdit({ ...BLANK })}>Add address</button>
    </div>
  );
}

function Password() {
  const [f, setF] = useState({ cur: "", next: "" });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setMsg(null);
    if (f.next.length < 8) return setMsg({ ok: false, text: "Use at least 8 characters for the new password." });
    try { await api.changePassword(f.cur, f.next); setF({ cur: "", next: "" }); setMsg({ ok: true, text: "Password changed. Other devices were logged out." }); }
    catch (err) { setMsg({ ok: false, text: readError(err).message }); }
  };
  return (
    <form onSubmit={submit} className="max-w-md space-y-4">
      <Field id="cur" label="Current password"><input id="cur" type="password" autoComplete="current-password" className={input} value={f.cur} onChange={(e) => setF({ ...f, cur: e.target.value })} /></Field>
      <Field id="next" label="New password" hint="At least 8 characters."><input id="next" type="password" autoComplete="new-password" className={input} value={f.next} onChange={(e) => setF({ ...f, next: e.target.value })} /></Field>
      <Msg ok={msg?.ok} text={msg?.text ?? null} />
      <button className="btn btn-blue">Change password</button>
    </form>
  );
}

export default function Account() {
  useSeo("My account | De Young Musical and City Spot");
  const { user, logout } = useAuth();
  const [sp, setSp] = useSearchParams();
  const nav = useNavigate();
  const tab = TABS.some(([k]) => k === sp.get("tab")) ? sp.get("tab")! : "orders";
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-3xl font-extrabold">My account</h1><p className="text-slate-600">{user?.fullName} · {user?.email}</p></div>
        <div className="flex gap-2">
          <Link to="/wishlist" className="btn border border-slate-300">Wishlist</Link>
          <button className="btn border border-slate-300" onClick={async () => { await logout(); nav("/"); }}>Log out</button>
        </div>
      </div>
      <div role="tablist" className="mb-6 flex flex-wrap gap-2 border-b border-slate-200">
        {TABS.map(([k, label]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setSp({ tab: k })}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-bold ${tab === k ? "border-electric text-electric" : "border-transparent text-slate-600 hover:text-ink"}`}>{label}</button>
        ))}
      </div>
      {tab === "orders" && <Orders />}{tab === "profile" && <Profile />}{tab === "addresses" && <Addresses />}{tab === "password" && <Password />}
    </div>
  );
}
