"use client";
import { useState } from "react";
import { RESULTADOS, ORDEN_RESULTADOS, type Resultado } from "@/lib/indicadores";

const fmtPct = (v: number | null, dec = 0) => (v === null ? "—" : `${(v * 100).toFixed(dec).replace(".", ",")} %`);

/** Leyenda: el color siempre va con su nombre y su número. */
export function Leyenda({ n }: { n: Record<Resultado, number> }) {
  const total = ORDEN_RESULTADOS.reduce((s, k) => s + n[k], 0);
  return (
    <ul className="grid gap-2 text-sm">
      {ORDEN_RESULTADOS.map((k) => (
        <li key={k} className="flex items-center gap-2">
          <span aria-hidden className="h-3 w-3 shrink-0 rounded-sm" style={{ background: RESULTADOS[k].color }} />
          <span className="flex-1">{RESULTADOS[k].label}</span>
          <span className="font-bold tabular-nums">{n[k]}</span>
          <span className="w-12 text-right tabular-nums text-ink-soft">{fmtPct(total ? n[k] / total : null)}</span>
        </li>
      ))}
    </ul>
  );
}

/** Dona del resultado de las citas, con la tasa de asistencia al centro. */
export function Dona({ n, centro, subtitulo }: { n: Record<Resultado, number>; centro: string; subtitulo: string }) {
  const [activo, setActivo] = useState<Resultado | null>(null);
  const total = ORDEN_RESULTADOS.reduce((s, k) => s + n[k], 0);
  const R = 70, ancho = 22, C = 2 * Math.PI * R, separacion = total > 1 ? 2 : 0;
  let acumulado = 0;
  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
      <svg viewBox="0 0 180 180" className="h-44 w-44 shrink-0" role="img" aria-label={`Resultado de ${total} citas`}>
        <circle cx="90" cy="90" r={R} fill="none" stroke="#EEF2F8" strokeWidth={ancho} />
        {total > 0 && ORDEN_RESULTADOS.map((k) => {
          const largo = (n[k] / total) * C;
          const el = largo > 0 ? (
            <circle key={k} cx="90" cy="90" r={R} fill="none" stroke={RESULTADOS[k].color}
              strokeWidth={activo === k ? ancho + 6 : ancho}
              strokeDasharray={`${Math.max(0, largo - separacion)} ${C}`} strokeDashoffset={-acumulado}
              transform="rotate(-90 90 90)" onMouseEnter={() => setActivo(k)} onMouseLeave={() => setActivo(null)}
              style={{ transition: "stroke-width .15s" }}>
              <title>{`${RESULTADOS[k].label}: ${n[k]} (${fmtPct(n[k] / total)})`}</title>
            </circle>
          ) : null;
          acumulado += largo;
          return el;
        })}
        <text x="90" y="88" textAnchor="middle" className="fill-ink" style={{ font: "700 30px var(--font, inherit)" }}>
          {activo ? fmtPct(total ? n[activo] / total : null) : centro}
        </text>
        <text x="90" y="110" textAnchor="middle" className="fill-ink-soft" style={{ font: "400 12px inherit" }}>
          {activo ? RESULTADOS[activo].label.toLowerCase() : subtitulo}
        </text>
      </svg>
      <div className="w-full min-w-0 flex-1"><Leyenda n={n} /></div>
    </div>
  );
}

/** Columnas apiladas por semana, con detalle al pasar el mouse o tocar. */
export function Semanas({ semanas }: { semanas: { semana: string; n: Record<Resultado, number> }[] }) {
  const [activa, setActiva] = useState<number | null>(null);
  const totales = semanas.map((s) => ORDEN_RESULTADOS.reduce((a, k) => a + s.n[k], 0));
  const max = Math.max(4, ...totales);
  const tope = Math.ceil(max / 4) * 4;
  const W = 640, H = 220, izq = 32, abajo = 26, arriba = 8;
  const alto = H - abajo - arriba;
  const paso = (W - izq) / semanas.length;
  const barra = Math.min(44, paso * 0.62);
  const y = (v: number) => arriba + alto - (v / tope) * alto;
  const etiqueta = (iso: string) => { const [, m, d] = iso.split("-"); return `${d}/${m}`; };
  const marcas = [0, tope / 4, tope / 2, (3 * tope) / 4, tope];
  const sel = activa !== null ? semanas[activa] : null;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Resultado de las citas por semana">
        {marcas.map((v) => (
          <g key={v}>
            <line x1={izq} x2={W} y1={y(v)} y2={y(v)} stroke="#E3E9F3" strokeWidth={1} />
            <text x={izq - 6} y={y(v) + 4} textAnchor="end" fontSize="11" fill="#46526B">{v}</text>
          </g>
        ))}
        {semanas.map((s, i) => {
          const x = izq + i * paso + (paso - barra) / 2;
          let base = 0;
          const capas = ORDEN_RESULTADOS.filter((k) => s.n[k] > 0);
          return (
            <g key={s.semana} onMouseEnter={() => setActiva(i)} onMouseLeave={() => setActiva(null)} onClick={() => setActiva(activa === i ? null : i)} className="cursor-pointer">
              <rect x={izq + i * paso} y={arriba} width={paso} height={alto} fill={activa === i ? "#EEF2F8" : "transparent"} />
              {capas.map((k, j) => {
                const h = (s.n[k] / tope) * alto;
                const y0 = y(base + s.n[k]);
                base += s.n[k];
                const ultima = j === capas.length - 1;
                const hVisible = Math.max(0, h - (ultima ? 0 : 2)); // 2 px de separación entre capas
                return ultima
                  ? <path key={k} d={redondeadaArriba(x, y0, barra, hVisible, 4)} fill={RESULTADOS[k].color} />
                  : <rect key={k} x={x} y={y0 + 2} width={barra} height={hVisible} fill={RESULTADOS[k].color} />;
              })}
              <text x={x + barra / 2} y={H - 8} textAnchor="middle" fontSize="11" fill="#46526B">{etiqueta(s.semana)}</text>
            </g>
          );
        })}
      </svg>
      {sel && activa !== null && (
        <div className="pointer-events-none absolute top-0 z-10 w-52 rounded-lg border border-line bg-white p-3 text-sm shadow-lg"
          style={{ left: `clamp(0px, calc(${((izq + activa * paso + paso / 2) / W) * 100}% - 104px), calc(100% - 13rem))` }}>
          <p className="mb-2 font-bold">Semana del {etiqueta(sel.semana)}: {totales[activa]} citas</p>
          {ORDEN_RESULTADOS.map((k) => (
            <p key={k} className="flex items-center gap-2">
              <span aria-hidden className="h-2.5 w-2.5 rounded-sm" style={{ background: RESULTADOS[k].color }} />
              <span className="flex-1">{RESULTADOS[k].label}</span><span className="font-bold tabular-nums">{sel.n[k]}</span>
            </p>
          ))}
        </div>
      )}
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
        {ORDEN_RESULTADOS.map((k) => (
          <li key={k} className="flex items-center gap-2"><span aria-hidden className="h-3 w-3 rounded-sm" style={{ background: RESULTADOS[k].color }} />{RESULTADOS[k].label}</li>
        ))}
      </ul>
    </div>
  );
}

function redondeadaArriba(x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, h, w / 2);
  return `M${x},${y + h} V${y + rr} Q${x},${y} ${x + rr},${y} H${x + w - rr} Q${x + w},${y} ${x + w},${y + rr} V${y + h} Z`;
}

/** Barras horizontales de una sola serie; el texto lleva el valor, no el color. */
export function BarrasH({ items, total, formato = "pct" }: { items: { label: string; n: number; detalle?: string }[]; total: number; formato?: "pct" | "n" }) {
  const max = Math.max(1, ...items.map((i) => i.n));
  if (!items.length) return <p className="text-ink-soft">Sin registros aún.</p>;
  return (
    <ul className="space-y-3">
      {items.map((i) => (
        <li key={i.label} className="group">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="font-bold">{i.label}</span>
            <span className="tabular-nums">
              {formato === "pct" ? <><strong>{fmtPct(total ? i.n / total : null)}</strong> <span className="text-ink-soft">({i.n})</span></> : <strong>{i.n}</strong>}
            </span>
          </div>
          <div className="mt-1 h-2.5 rounded-r bg-[#EEF2F8]" title={`${i.label}: ${i.n}`}>
            <div className="h-2.5 rounded-r bg-azul transition-[width] group-hover:bg-azul-dark" style={{ width: `${(i.n / max) * 100}%` }} />
          </div>
          {i.detalle && <p className="mt-1 text-sm text-ink-soft">{i.detalle}</p>}
        </li>
      ))}
    </ul>
  );
}
