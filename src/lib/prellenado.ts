/**
 * Lectura de los datos que llegan en el link del SMS del hospital.
 *
 * El hospital arma el link desde su planilla Excel, por ejemplo:
 *   https://agenda-hospital.vercel.app/c?n=Rosa&f=2026-11-23&h=08:00&e=Laboratorio&l=Entrada%20principal
 *
 * Se aceptan nombres cortos (n, f, h, e, l) y largos (nombre, fecha, hora,
 * especialidad, lugar). Todo es tolerante: si un dato viene mal escrito se
 * ignora y el paciente lo completa a mano. Nunca se aceptan RUT ni teléfono.
 */
export interface Prellenado {
  nombre?: string;
  fecha?: string;        // YYYY-MM-DD
  hora?: string;         // HH:MM
  especialidad?: string;
  lugar?: string;
}

type Params = Record<string, string | string[] | undefined>;

const uno = (p: Params, ...claves: string[]) => {
  for (const k of claves) {
    const v = p[k];
    const s = (Array.isArray(v) ? v[0] : v)?.trim();
    if (s) return s.replace(/\+/g, " ").replace(/\s+/g, " ");
  }
  return undefined;
};

const PEQUENAS = new Set(["de", "del", "la", "las", "el", "los", "y", "en", "por", "a", "con"]);

/** "ENTRADA POR PUERTA PRINCIPAL" → "Entrada por Puerta Principal" (sólo si viene todo en mayúsculas). */
export function suavizarMayusculas(s: string) {
  if (s !== s.toUpperCase() || !/[A-ZÁÉÍÓÚÑ]/.test(s)) return s;
  return s.toLowerCase().split(" ").map((w, i) =>
    i > 0 && PEQUENAS.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)
  ).join(" ");
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Acepta 2026-11-23, 23-11-2026, 23/11/2026, 2026/11/23 o el número de serie de Excel. */
export function leerFecha(v?: string): string | undefined {
  if (!v) return;
  let y: number, m: number, d: number;
  let r: RegExpMatchArray | null;
  if ((r = v.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/))) [y, m, d] = [+r[1], +r[2], +r[3]];
  else if ((r = v.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/))) [y, m, d] = [+r[3], +r[2], +r[1]];
  else if (/^\d{5}([.,]\d+)?$/.test(v)) {
    const t = new Date(Date.UTC(1899, 11, 30) + Math.floor(Number(v.replace(",", "."))) * 86_400_000);
    [y, m, d] = [t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate()];
  } else return;
  const t = new Date(Date.UTC(y, m - 1, d));
  if (t.getUTCFullYear() !== y || t.getUTCMonth() !== m - 1 || t.getUTCDate() !== d) return;
  return `${y}-${pad(m)}-${pad(d)}`;
}

/** Acepta 08:00, 8:00, 08:00:00, 0800, 8.30 o la fracción de día de Excel (0,333…). */
export function leerHora(v?: string): string | undefined {
  if (!v) return;
  let h: number, min: number;
  let r: RegExpMatchArray | null;
  if ((r = v.match(/^(\d{1,2})[:.h](\d{2})/))) [h, min] = [+r[1], +r[2]];
  else if ((r = v.match(/^(\d{2})(\d{2})$/))) [h, min] = [+r[1], +r[2]];
  else if (/^0?[.,]\d+$/.test(v)) {
    const total = Math.round(Number(v.replace(",", ".")) * 24 * 60);
    [h, min] = [Math.floor(total / 60), total % 60];
  } else return;
  if (h > 23 || min > 59) return;
  return `${pad(h)}:${pad(min)}`;
}

export function leerPrellenado(p: Params): Prellenado {
  const nombreCompleto = uno(p, "n", "nombre");
  // Sólo el primer nombre, sin números ni símbolos.
  const nombre = nombreCompleto?.split(" ")[0]?.replace(/[^\p{L}'-]/gu, "").slice(0, 40);
  const especialidad = uno(p, "e", "especialidad")?.slice(0, 80);
  const lugarCrudo = uno(p, "l", "lugar")?.replace(/^presentarse en\s*:\s*/i, "").slice(0, 120);
  return {
    nombre: nombre ? nombre.charAt(0).toUpperCase() + (nombre === nombre.toUpperCase() ? nombre.slice(1).toLowerCase() : nombre.slice(1)) : undefined,
    fecha: leerFecha(uno(p, "f", "fecha")),
    hora: leerHora(uno(p, "h", "hora")),
    especialidad: especialidad ? suavizarMayusculas(especialidad) : undefined,
    lugar: lugarCrudo ? suavizarMayusculas(lugarCrudo) : undefined,
  };
}

export const hayPrellenado = (p: Prellenado) => Object.values(p).some(Boolean);
