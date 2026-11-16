/** Motivos de inasistencia (mismas categorías de la encuesta del proyecto). */
export const MOTIVOS = {
  olvido: "Olvidé la fecha o la hora",
  transporte: "No tuve cómo llegar",
  laboral: "Trabajo o estudios",
  salud: "Me sentí mal o estaba enfermo/a",
  familiar: "Problema familiar o personal",
  ya_no_necesita: "Ya no necesitaba la atención",
  cambio_hora: "El hospital cambió o suspendió la hora",
  otro: "Otro motivo",
} as const;

export type Motivo = keyof typeof MOTIVOS;

/** Al avisar antes de la cita, "olvido" no aplica. */
export const MOTIVOS_ANTES = (Object.keys(MOTIVOS) as Motivo[]).filter((m) => m !== "olvido");
export const MOTIVOS_DESPUES = Object.keys(MOTIVOS) as Motivo[];

export const esMotivo = (v: unknown): v is Motivo => typeof v === "string" && v in MOTIVOS;
