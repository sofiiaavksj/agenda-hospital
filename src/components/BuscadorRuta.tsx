"use client";
import { useEffect, useId, useRef, useState } from "react";
import { HOSPITAL, mapsUrl, completarDireccion as completar } from "@/data/transporte";
import type { Sugerencia } from "@/lib/direcciones";

export interface Sector { id: string; etiqueta: string; texto: string }
interface Seleccion { titulo: string; texto: string; sectorId?: string }

/**
 * Buscador de "¿desde dónde viaja?": sugiere direcciones mientras se escribe
 * y, al elegir una, muestra de inmediato los botones con esa ruta.
 */
export function BuscadorRuta({ inicial, sectores }: { inicial?: string; sectores: Sector[] }) {
  const [consulta, setConsulta] = useState(inicial ?? "");
  const [sugerencias, setSugerencias] = useState<Sugerencia[]>([]);
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(-1);
  const [buscando, setBuscando] = useState(false);
  const [seleccion, setSeleccion] = useState<Seleccion | null>(
    inicial ? { titulo: inicial, texto: completar(inicial) } : null
  );
  const listaId = useId();
  const input = useRef<HTMLInputElement>(null);
  const ultima = useRef("");

  // Búsqueda con espera breve mientras la persona escribe.
  useEffect(() => {
    const q = consulta.trim();
    if (q.length < 3 || (seleccion && q === seleccion.titulo)) { setSugerencias([]); return; }
    const t = setTimeout(async () => {
      ultima.current = q;
      setBuscando(true);
      try {
        const res = await fetch(`/api/direcciones?q=${encodeURIComponent(q)}`);
        const json = (await res.json()) as { sugerencias: Sugerencia[] };
        if (ultima.current === q) { setSugerencias(json.sugerencias ?? []); setActivo(-1); }
      } catch {
        if (ultima.current === q) setSugerencias([]);
      } finally {
        if (ultima.current === q) setBuscando(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [consulta, seleccion]);

  const opciones: Seleccion[] = [
    ...sugerencias.map((s) => ({ titulo: s.detalle ? `${s.titulo}, ${s.detalle}` : s.titulo, texto: s.texto })),
    ...(consulta.trim().length >= 3 ? [{ titulo: consulta.trim(), texto: completar(consulta.trim()) }] : []),
  ];

  function elegir(s: Seleccion) {
    setSeleccion(s);
    setConsulta(s.titulo);
    setAbierto(false);
    setSugerencias([]);
    // Deja la dirección en el enlace, para compartirlo o volver a abrirlo.
    try {
      const u = new URL(window.location.href);
      u.searchParams.set("desde", s.titulo);
      window.history.replaceState(null, "", u.toString());
    } catch { /* sin efecto */ }
  }

  function limpiar() {
    setConsulta(""); setSeleccion(null); setSugerencias([]); setAbierto(false);
    input.current?.focus();
  }

  function teclado(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") { e.preventDefault(); setAbierto(true); setActivo((i) => Math.min(i + 1, opciones.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActivo((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter") {
      e.preventDefault();
      const s = opciones[activo >= 0 ? activo : 0];
      if (s) elegir(s);
    } else if (e.key === "Escape") setAbierto(false);
  }

  return (
    <div>
      <label htmlFor="desde" className="block text-2xl font-bold">¿Desde dónde viaja?</label>
      <p className="mb-3 mt-1 text-ink-soft">Escriba su dirección, villa o un lugar conocido, y elíjalo de la lista.</p>

      <div className="relative">
        <div className="flex gap-2">
          <input
            ref={input} id="desde" type="text" value={consulta} autoComplete="off" maxLength={100}
            role="combobox" aria-expanded={abierto && opciones.length > 0} aria-controls={listaId} aria-autocomplete="list"
            aria-activedescendant={activo >= 0 ? `${listaId}-${activo}` : undefined}
            placeholder="Ej.: Avenida Costanera 500, Coquimbo"
            className="field text-xl"
            onChange={(e) => { setConsulta(e.target.value); setSeleccion(null); setAbierto(true); }}
            onFocus={() => setAbierto(true)}
            onBlur={() => setTimeout(() => { if (document.activeElement !== input.current) setAbierto(false); }, 150)}
            onKeyDown={teclado}
          />
          {consulta && (
            <button type="button" onClick={limpiar} aria-label="Borrar lo escrito" className="btn-secondary px-4 text-xl">✕</button>
          )}
        </div>

        {abierto && !seleccion && opciones.length > 0 && (
          <ul id={listaId} role="listbox" className="absolute left-0 right-0 z-10 mt-2 max-h-80 overflow-auto rounded-xl border border-line bg-white shadow-lg">
            {opciones.map((o, i) => {
              const propia = i === opciones.length - 1 && o.titulo === consulta.trim();
              return (
                <li key={`${o.texto}-${i}`} id={`${listaId}-${i}`} role="option" aria-selected={i === activo}
                  onMouseDown={(e) => { e.preventDefault(); elegir(o); }}
                  className={`flex cursor-pointer items-start gap-3 border-b border-line px-4 py-3 last:border-0 ${i === activo ? "bg-pine-soft" : "hover:bg-mist"}`}>
                  <span aria-hidden className="mt-0.5 text-pine">{propia ? "✎" : "⌖"}</span>
                  <span>{propia ? <>Usar «<strong>{o.titulo}</strong>» tal como lo escribí</> : o.titulo}</span>
                </li>
              );
            })}
            {buscando && <li className="px-4 py-2 text-base text-ink-soft">Buscando…</li>}
          </ul>
        )}
      </div>

      <div className="mt-4">
        <p className="mb-2 text-base text-ink-soft">Sectores habituales:</p>
        <div className="flex flex-wrap gap-2">
          {sectores.map((s) => (
            <button key={s.id} type="button" onClick={() => elegir({ titulo: s.etiqueta, texto: s.texto, sectorId: s.id })}
              className={`rounded-full border px-3 py-1.5 text-base ${seleccion?.sectorId === s.id ? "border-pine bg-pine-soft font-bold text-pine" : "border-line bg-white hover:border-pine"}`}>
              {s.etiqueta}
            </button>
          ))}
        </div>
      </div>

      {seleccion ? (
        <section className="mt-6 rounded-2xl border-2 border-pine bg-pine-soft p-5" aria-live="polite">
          <p className="text-base text-pine">Ruta desde</p>
          <p className="text-xl font-bold">{seleccion.titulo}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <a href={mapsUrl(seleccion.texto)} target="_blank" rel="noopener noreferrer" className="btn-primary py-4 text-lg sm:col-span-2">
              Ver la ruta en transporte público (Google Maps)
            </a>
            <a href={mapsUrl(seleccion.texto, "driving")} target="_blank" rel="noopener noreferrer" className="btn-secondary py-3">En auto o taxi</a>
            <a href={HOSPITAL.moovitUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary py-3">Ver en Moovit</a>
          </div>
          {seleccion.sectorId && (
            <a href={`/como-llegar/${seleccion.sectorId}`} className="link mt-4 inline-block">Ver líneas y paraderos escritos para {seleccion.titulo}</a>
          )}
        </section>
      ) : (
        <a href={mapsUrl()} target="_blank" rel="noopener noreferrer" className="btn-secondary mt-6 w-full py-4 text-lg">
          Ruta desde donde estoy ahora (Google Maps)
        </a>
      )}
    </div>
  );
}
