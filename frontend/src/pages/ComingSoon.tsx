import { Link } from "react-router-dom";
import { usePageTitle } from "../hooks/usePageTitle";

export default function ComingSoon({ title, stage }: { title: string; stage: number }) {
  usePageTitle(`${title} | De Young Musical and City Spot`);
  return (
    <section className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-3xl font-extrabold">{title}</h1>
      <p className="my-4 text-slate-600">This page is built in Stage {stage} of the project. Until then, you can reach us on WhatsApp using the green button.</p>
      <Link to="/" className="btn btn-blue">Back to home</Link>
    </section>
  );
}
