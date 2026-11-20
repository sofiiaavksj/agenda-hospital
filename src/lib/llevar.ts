/**
 * "¿Qué debe llevar ese día?": lo que la persona marca al crear el
 * recordatorio se repite en los avisos, en el calendario y en su página.
 * La cédula de identidad se recuerda siempre.
 */
export const LLEVAR_OPCIONES = [
  "Resultados de exámenes",
  "Orden médica o interconsulta",
  "Radiografías u otras imágenes",
  "Medicamentos que usa o sus recetas",
  "Carné de control",
] as const;

export const CEDULA = "Cédula de identidad";
const MAX = 300;

/** Une las opciones marcadas y el texto libre en una sola línea. Devuelve null si no hay nada. */
export function leerLlevar(marcadas: string[], otro: string): string | null {
  const validas = LLEVAR_OPCIONES.filter((o) => marcadas.includes(o));
  const limpio = otro.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 120);
  const libre = limpio.charAt(0).toUpperCase() + limpio.slice(1);
  const todo = [...validas, ...(libre ? [libre] : [])].join("; ");
  return todo ? todo.slice(0, MAX) : null;
}

/** Lista completa a recordar, con la cédula primero. */
export function listaLlevar(llevar?: string | null): string[] {
  const extra = (llevar ?? "").split(";").map((x) => x.trim()).filter(Boolean);
  return [CEDULA, ...extra];
}

/** "cédula de identidad, resultados de exámenes y orden médica" */
export function textoLlevar(llevar?: string | null) {
  const l = listaLlevar(llevar).map((x) => x.charAt(0).toLowerCase() + x.slice(1));
  return l.length === 1 ? l[0] : `${l.slice(0, -1).join(", ")} y ${l[l.length - 1]}`;
}
