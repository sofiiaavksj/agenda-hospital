/**
 * TELÉFONOS Y AYUDA DEL HOSPITAL SAN PABLO DE COQUIMBO
 * ===================================================
 * Este archivo alimenta la página "Teléfonos y ayuda" y los botones "Llamar"
 * del resto de la página. Se edita sin saber programar: cambie los textos
 * entre comillas y guarde (en GitHub, con el lápiz "Edit").
 *
 * - numero: sólo dígitos, con código de área (ej. "512336855").
 * - Para agregar un teléfono, copie un bloque { ... } completo y cámbielo.
 * - Si aún no conoce un dato, déjelo como "" y no se mostrará.
 */

export interface Telefono {
  id: string;
  /** Para qué sirve, en palabras del paciente. */
  titulo: string;
  numero: string;
  /** Cuándo llamar a este número. */
  cuando: string;
  horario?: string;
}

export const TELEFONOS: Telefono[] = [
  {
    id: "nuevas",
    titulo: "Consultas nuevas",
    numero: "512336855",
    cuando: "Si es su primera hora con una especialidad, o para cancelar o cambiar esa hora.",
    horario: "",
  },
  {
    id: "repetidas",
    titulo: "Consultas repetidas o controles",
    numero: "512336336",
    cuando: "Si ya se atiende en esa especialidad (control), o para cancelar o cambiar esa hora.",
    horario: "",
  },
];

/** Números nacionales de emergencia y orientación (no son del hospital). */
export const EMERGENCIAS = [
  { titulo: "Ambulancia (SAMU)", numero: "131" },
  { titulo: "Salud Responde, orientación las 24 horas", numero: "6003607777" },
];

/** "512336855" → "51 233 6855"; "6003607777" → "600 360 7777". */
export function formatoTelefono(n: string) {
  const d = n.replace(/\D/g, "");
  if (d.length === 9 && d.startsWith("9")) return `9 ${d.slice(1, 5)} ${d.slice(5)}`;
  if (d.length === 9) return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}`;
  if (d.length === 10 && d.startsWith("600")) return `600 ${d.slice(3, 6)} ${d.slice(6)}`;
  return d;
}

/** Enlace para llamar desde el celular. Números de 9 dígitos llevan +56. */
export function enlaceLlamar(n: string) {
  const d = n.replace(/\D/g, "");
  return d.length === 9 ? `tel:+56${d}` : `tel:${d}`;
}

export const telefonosActivos = () => TELEFONOS.filter((t) => t.numero.replace(/\D/g, "").length >= 3);
