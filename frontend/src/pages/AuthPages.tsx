import { FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Field, { aria } from "../components/Field";
import { useAuth } from "../context/AuthContext";
import { useSeo } from "../hooks/useSeo";
import { api } from "../services/api";
import { input, readError, safeNext } from "../utils/forms";

const Shell = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mx-auto max-w-md px-4 py-12"><h1 className="mb-6 text-3xl font-extrabold">{title}</h1>{children}</section>
);
const Alert = ({ text }: { text: string | null }) => text ? <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-red-800">{text}</p> : null;

export function Login() {
  useSeo("Log in | De Young Musical and City Spot");
  const { login } = useAuth();
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const next = safeNext(sp.get("next"));
  const [f, setF] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setMsg(null);
    const v: Record<string, string> = {};
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) v.email = "Enter a valid email address";
    if (!f.password) v.password = "Enter your password";
    setErrors(v); if (Object.keys(v).length) return;
    setBusy(true);
    try { await login(f.email.trim(), f.password); nav(next, { replace: true }); }
    catch (err) { const r = readError(err); setErrors(r.fields); setMsg(r.message); }
    finally { setBusy(false); }
  };
  return (
    <Shell title="Log in">
      <form onSubmit={submit} noValidate className="space-y-4">
        <Field id="email" label="Email address" error={errors.email}><input id="email" type="email" autoComplete="email" className={input} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} {...aria(errors, "email")} /></Field>
        <Field id="password" label="Password" error={errors.password}><input id="password" type="password" autoComplete="current-password" className={input} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} {...aria(errors, "password")} /></Field>
        <Alert text={msg} />
        <button className="btn btn-gold w-full" disabled={busy}>{busy ? "Logging in…" : "Log in"}</button>
        <p className="text-sm"><Link to="/forgot-password" className="font-bold text-electric hover:underline">Forgot your password?</Link></p>
        <p className="text-sm">New here? <Link to={`/register?next=${encodeURIComponent(next)}`} className="font-bold text-electric hover:underline">Create an account</Link>. You can also check out as a guest.</p>
      </form>
    </Shell>
  );
}

export function Register() {
  useSeo("Create an account | De Young Musical and City Spot");
  const { register } = useAuth();
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const next = safeNext(sp.get("next"));
  const [f, setF] = useState({ fullName: "", email: "", phone: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setMsg(null);
    const v: Record<string, string> = {};
    if (f.fullName.trim().length < 2) v.fullName = "Enter your full name";
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) v.email = "Enter a valid email address";
    if (f.phone && !/^\+?\d{10,15}$/.test(f.phone.replace(/[\s()-]/g, ""))) v.phone = "Enter a valid phone number";
    if (f.password.length < 8) v.password = "Use at least 8 characters";
    setErrors(v); if (Object.keys(v).length) return;
    setBusy(true);
    try { await register({ ...f, fullName: f.fullName.trim(), email: f.email.trim() }); nav(next, { replace: true }); }
    catch (err) { const r = readError(err); setErrors(r.fields); setMsg(r.message); }
    finally { setBusy(false); }
  };
  return (
    <Shell title="Create an account">
      <form onSubmit={submit} noValidate className="space-y-4">
        <Field id="fullName" label="Full name" error={errors.fullName}><input id="fullName" autoComplete="name" className={input} value={f.fullName} onChange={set("fullName")} {...aria(errors, "fullName")} /></Field>
        <Field id="email" label="Email address" error={errors.email}><input id="email" type="email" autoComplete="email" className={input} value={f.email} onChange={set("email")} {...aria(errors, "email")} /></Field>
        <Field id="phone" label="Phone number (optional)" error={errors.phone}><input id="phone" type="tel" autoComplete="tel" className={input} value={f.phone} onChange={set("phone")} {...aria(errors, "phone")} /></Field>
        <Field id="password" label="Password" error={errors.password} hint="At least 8 characters."><input id="password" type="password" autoComplete="new-password" className={input} value={f.password} onChange={set("password")} {...aria(errors, "password")} /></Field>
        <Alert text={msg} />
        <button className="btn btn-gold w-full" disabled={busy}>{busy ? "Creating account…" : "Create account"}</button>
        <p className="text-sm">Already have an account? <Link to={`/login?next=${encodeURIComponent(next)}`} className="font-bold text-electric hover:underline">Log in</Link></p>
      </form>
    </Shell>
  );
}

export function ForgotPassword() {
  useSeo("Forgot password | De Young Musical and City Spot");
  const [email, setEmail] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setMsg(null);
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setMsg("Enter a valid email address");
    setBusy(true);
    try { setDone((await api.forgotPassword(email.trim())).message); } catch (err) { setMsg(readError(err).message); } finally { setBusy(false); }
  };
  return (
    <Shell title="Forgot your password?">
      {done ? <p className="rounded-lg border border-emerald-300 bg-emerald-50 p-4">{done} Check your inbox and spam folder. The link works for one hour.</p> : (
        <form onSubmit={submit} noValidate className="space-y-4">
          <p className="text-slate-600">Enter your email and we will send you a link to choose a new password.</p>
          <Field id="email" label="Email address"><input id="email" type="email" autoComplete="email" className={input} value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          <Alert text={msg} />
          <button className="btn btn-gold w-full" disabled={busy}>{busy ? "Sending…" : "Send reset link"}</button>
        </form>
      )}
      <p className="mt-4 text-sm"><Link to="/login" className="font-bold text-electric hover:underline">Back to log in</Link></p>
    </Shell>
  );
}

export function ResetPassword() {
  useSeo("Choose a new password | De Young Musical and City Spot");
  const [sp] = useSearchParams();
  const token = sp.get("token") ?? "";
  const [pw, setPw] = useState("");
  const [done, setDone] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setMsg(null);
    if (pw.length < 8) return setMsg("Use at least 8 characters");
    setBusy(true);
    try { await api.resetPassword(token, pw); setDone(true); } catch (err) { setMsg(readError(err).message); } finally { setBusy(false); }
  };
  if (!token) return <Shell title="Reset link missing"><p>This link is incomplete. <Link to="/forgot-password" className="font-bold text-electric hover:underline">Request a new one</Link>.</p></Shell>;
  return (
    <Shell title="Choose a new password">
      {done ? <p className="rounded-lg border border-emerald-300 bg-emerald-50 p-4">Password updated. <Link to="/login" className="font-bold text-electric hover:underline">Log in</Link></p> : (
        <form onSubmit={submit} noValidate className="space-y-4">
          <Field id="pw" label="New password" hint="At least 8 characters."><input id="pw" type="password" autoComplete="new-password" className={input} value={pw} onChange={(e) => setPw(e.target.value)} /></Field>
          <Alert text={msg} />
          <button className="btn btn-gold w-full" disabled={busy}>{busy ? "Saving…" : "Save new password"}</button>
        </form>
      )}
    </Shell>
  );
}
