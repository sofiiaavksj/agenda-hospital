"use client";
import { useMemo, useState } from "react";
import { mensajeCompartir, enlaceWhatsapp, enlaceSms, type DatosCompartir } from "@/lib/compartir";

/** Avisar a un familiar o cuidador: mensaje editable que se envía desde el WhatsApp de la persona. */
export function CompartirCita({ datos }: { datos: Omit<DatosCompartir, "quien"> }) {
  const [quien, setQuien] = useState<"yo" | "otra">("yo");
  const sugerido = useMemo(() => mensajeCompartir({ ...datos, quien }), [datos, quien]);
  const [texto, setTexto] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const actual = texto ?? sugerido;

  return (
    <section id="compartir" className="mt-6 rounded-2xl border-2 border-azul bg-white p-5">
      <h2 className="flex items-center gap-3 text-xl font-bold">
        <span aria-hidden className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#25D366] text-ink">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.6.8-.8 1-.3.2-.5 0a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.4-.3z" /></svg>
        </span>
        Avisar a un familiar o cuidador
      </h2>
      <p className="mt-2 text-ink-soft">Envíele los datos de la cita desde su WhatsApp. Puede cambiar el texto antes de enviarlo.</p>

      <div role="radiogroup" aria-label="¿De quién es la hora?" className="mt-4 grid grid-cols-2 gap-2">
        {([["yo", "Es mi hora"], ["otra", "Es la hora de otra persona"]] as const).map(([v, l]) => (
          <button key={v} type="button" role="radio" aria-checked={quien === v} onClick={() => { setQuien(v); setTexto(null); }}
            className={`rounded-xl border-2 px-3 py-2.5 font-bold ${quien === v ? "border-azul bg-azul-soft text-azul-dark" : "border-line bg-white"}`}>{l}</button>
        ))}
      </div>

      <label className="mt-4 block"><span className="sr-only">Mensaje</span>
        <textarea value={actual} onChange={(e) => setTexto(e.target.value)} rows={9} maxLength={1200}
          className="field whitespace-pre-wrap text-base leading-relaxed" /></label>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <a href={enlaceWhatsapp(actual)} target="_blank" rel="noopener noreferrer"
          className="btn sm:col-span-3 bg-[#25D366] py-4 text-lg text-ink hover:bg-[#1EBE5A]">Enviar por WhatsApp</a>
        <button type="button" className="btn-secondary py-3 sm:col-span-2"
          onClick={async () => { try { await navigator.clipboard.writeText(actual); setCopiado(true); setTimeout(() => setCopiado(false), 2500); } catch { /* sin portapapeles */ } }}>
          {copiado ? "Mensaje copiado" : "Copiar mensaje"}
        </button>
        <a href={enlaceSms(actual)} className="btn-secondary py-3">Enviar por SMS</a>
      </div>
      <p className="mt-3 text-sm text-ink-soft">El mensaje sale de su propio WhatsApp, sin costo. No incluye su enlace personal para anular los avisos.</p>
    </section>
  );
}
