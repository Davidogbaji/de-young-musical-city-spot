import { useState } from "react";
import { BUSINESS, runtime } from "../config";
import { STUDIO_ENQUIRY, whatsappLink } from "../utils/format";
import WhatsAppIcon from "./WhatsAppIcon";

const QUICK: [string, string][] = [
  ["Find a musical instrument", "Hello, I would like help finding a musical instrument."],
  ["Ask about product availability", "Hello, please confirm product availability."],
  ["Get help with an order", "Hello, I need help with an order."],
  ["Request a studio setup", STUDIO_ENQUIRY],
  ["Ask about delivery", "Hello, I have a question about delivery."],
  ["Speak to customer support", "Hello, I would like to speak to customer support."],
];

export default function WhatsAppWidget() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const go = (msg: string) => {
    const link = whatsappLink(msg);
    if (link) window.open(link, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      {open && (
        <div role="dialog" aria-label="WhatsApp support" className="fixed bottom-24 right-4 z-30 w-[min(340px,calc(100%-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="bg-[#1fa855] px-4 py-3 font-extrabold text-white">How can I help you?</div>
          <div className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto p-3">
            <p className="rounded-xl bg-mist p-3 text-sm">Hello! Welcome to {BUSINESS.name}. What can we help you find today?</p>
            {!runtime.whatsapp ? (
              <p className="rounded-lg border border-dashed border-amber-500 p-3 text-sm">Setup needed: add the WhatsApp number under Admin, then Settings.</p>
            ) : (
              <>
                {QUICK.map(([label, msg]) => (
                  <button key={label} onClick={() => go(msg)} className="rounded-full border border-slate-300 px-3 py-2 text-left text-sm hover:border-[#1fa855]">{label}</button>
                ))}
                <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} placeholder="Type your message" aria-label="Your message" className="w-full resize-none rounded-lg border border-slate-300 p-2 text-sm" />
                <button onClick={() => go(text.trim() || `Hello ${BUSINESS.name}, I need some help.`)} className="btn bg-[#1fa855] text-white hover:bg-[#188a45]">Chat on WhatsApp</button>
              </>
            )}
          </div>
        </div>
      )}
      <button onClick={() => setOpen((o) => !o)} aria-label="Chat on WhatsApp" aria-expanded={open}
        className="fixed bottom-4 right-4 z-30 grid h-14 w-14 place-items-center rounded-full bg-[#1fa855] text-white shadow-lg hover:bg-[#188a45]">
        <WhatsAppIcon size={30} />
      </button>
    </>
  );
}
