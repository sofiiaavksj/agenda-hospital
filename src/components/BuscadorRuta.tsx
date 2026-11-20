"use client";
import { useEffect, useId, useRef, useState } from "react";
import { HOSPITAL, mapsUrl, uberUrl, completarDireccion as completar } from "@/data/transporte";
import type { Sugerencia } from "@/lib/direcciones";
import { horaSalida, minutosViaje, MINUTOS_ANTES } from "@/lib/salida";
import { IconoReloj } from "@/components/Iconos";

export interface Sector { id: string; etiqueta: string; texto: string; lat?: number; lon?: number }
interface Seleccion { titulo: string; texto: string; sectorId?: string; lat?: number; lon?: number }

/**
 * Buscador de "¿desde dónde viaja?": sugiere direcciones mientras se escribe
 * y, al elegir una, muestra de inmediato los botones con esa ruta.
 */
export function BuscadorRuta({ inicial, sectores, hora: horaInicial }: { inicial?: string; sectores: Sector[]; hora?: string }) {
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
  const [hora, setHora] = useState(horaInicial ?? "");
  const [viaje, setViaje] = useState(() => minutosViaje(null));
  const coords = seleccion?.lat != null && seleccion?.lon != null ? { lat: seleccion.lat, lon: seleccion.lon } : null;
  // Cada vez que cambia el lugar de partida, se vuelve a estimar el viaje.
  useEffect(() => { setViaje(minutosViaje(coords)); }, [coords?.lat, coords?.lon, seleccion?.titulo]); // eslint-disable-line react-hooks/exhaustive-deps
  const salida = hora ? horaSalida(hora, viaje) : null;

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
    ...sugerencias.map((s) => ({ titulo: s.detalle ? `${s.titulo}, ${s.detalle}` : s.titulo, texto: s.texto, lat: s.lat, lon: s.lon })),
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
                  className={`flex cursor-pointer items-start gap-3 border-b border-line px-4 py-3 last:border-0 ${i === activo ? "bg-azul-soft" : "hover:bg-mist"}`}>
                  <span aria-hidden className="mt-0.5 text-azul">{propia ? "✎" : "⌖"}</span>
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
            <button key={s.id} type="button" onClick={() => elegir({ titulo: s.etiqueta, texto: s.texto, sectorId: s.id, lat: s.lat, lon: s.lon })}
              className={`rounded-full border px-3 py-1.5 text-base ${seleccion?.sectorId === s.id ? "border-azul bg-azul-soft font-bold text-azul" : "border-line bg-white hover:border-azul"}`}>
              {s.etiqueta}
            </button>
          ))}
        </div>
      </div>

      {seleccion ? (
        <section className="mt-6 rounded-2xl border-2 border-azul bg-azul-soft p-5" aria-live="polite">
          <p className="text-base text-azul">Ruta desde</p>
          <p className="text-xl font-bold">{seleccion.titulo}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <a href={mapsUrl(seleccion.texto)} target="_blank" rel="noopener noreferrer" className="btn-primary py-4 text-lg sm:col-span-2">
              Ver la ruta en transporte público (Google Maps)
            </a>
            <a href={uberUrl({ lat: seleccion.lat, lon: seleccion.lon, texto: seleccion.titulo })} target="_blank" rel="noopener noreferrer" className="btn-secondary py-3">Pedir un Uber</a>
            <a href={HOSPITAL.ubicateUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary py-3">Colectivos en vivo (Ubícate)</a>
            <a href={HOSPITAL.moovitUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary py-3 sm:col-span-2">Ver en Moovit</a>
          </div>
          {seleccion.sectorId && (
            <a href={`/como-llegar/${seleccion.sectorId}`} className="link mt-4 inline-block">Ver líneas y paraderos escritos para {seleccion.titulo}</a>
          )}
        </section>
      ) : null}

      {seleccion ? (
        <section className="mt-4 rounded-2xl border-2 border-sol bg-sol-soft p-5" aria-labelledby="titulo-salida">
          <h3 id="titulo-salida" className="flex items-center gap-3 text-xl font-bold">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-azul-dark text-sol"><IconoReloj className="h-6 w-6" /></span>
            ¿A qué hora salir?
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block"><span className="label">Hora de su cita</span>
              <input type="time" value={hora} step={60} onChange={(e) => setHora(e.target.value)} className="field text-xl" /></label>
            <div>
              <span className="label">Viaje en micro o colectivo</span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setViaje((v) => Math.max(5, v - 5))} aria-label="Restar 5 minutos" className="btn-secondary h-12 w-12 p-0 text-2xl">−</button>
                <output aria-live="polite" className="min-w-[5.5rem] text-center text-xl font-bold">{viaje} min</output>
                <button type="button" onClick={() => setViaje((v) => Math.min(240, v + 5))} aria-label="Sumar 5 minutos" className="btn-secondary h-12 w-12 p-0 text-2xl">+</button>
              </div>
            </div>
          </div>
          {salida ? (
            <div className="mt-5 rounded-xl bg-azul-dark p-4 text-white" aria-live="polite">
              <p className="text-lg">Salga a las</p>
              <p className="text-5xl font-bold leading-none tracking-tight text-sol">{salida.hora}</p>
              <p className="mt-2 text-white/90">
                {salida.diaAnterior ? "(el día anterior) " : ""}Así llega {MINUTOS_ANTES} minutos antes de su hora de las {hora}, para hacer la admisión.
              </p>
            </div>
          ) : (
            <p className="mt-4 text-ink-soft">Escriba la hora de su cita y le diremos a qué hora salir.</p>
          )}
          <p className="mt-3 text-base text-ink-soft">
            {coords ? "El viaje es una estimación según la distancia." : "No conocemos la distancia exacta: ajuste el viaje con − y +."}{" "}
            En horario punta (7:00 a 9:00 y 18:00 a 20:00) sume 10 minutos. Para el tiempo exacto, abra la ruta en Google Maps.
          </p>
        </section>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <a href={mapsUrl()} target="_blank" rel="noopener noreferrer" className="btn-secondary py-4 text-lg">Ruta desde donde estoy ahora</a>
          <a href={HOSPITAL.ubicateUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary py-4 text-lg">Colectivos en vivo (Ubícate)</a>
        </div>
      )}
    </div>
  );
}
