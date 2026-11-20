/**
 * Cálculo de los indicadores del panel. Funciones puras: se prueban sin base de datos.
 *
 * Pregunta central del proyecto: ¿por qué personas que tienen su hora no van?
 * Cada cita ya ocurrida queda en uno de cuatro resultados:
 *   asistio       respondió que asistió
 *   no_asistio    respondió que no asistió (con o sin motivo)
 *   aviso         avisó antes que no iría
 *   sin_respuesta no respondió la encuesta
 */
import { MOTIVOS, type Motivo, esMotivo } from "./motivos";
import { chileDateKey } from "./time";

export interface FilaRecordatorio {
  creado_en: string;
  cita_en: string;
  canal: string;
  rango: string;
  especialidad: string | null;
  anulado_en: string | null;
  no_asistira_en: string | null;
  asistio: boolean | null;
  motivo?: string | null;
  motivo_comentario?: string | null;
  fuente?: string | null;
  llevar?: string | null;
}

export type Resultado = "asistio" | "no_asistio" | "aviso" | "sin_respuesta";

export const RESULTADOS: Record<Resultado, { label: string; color: string }> = {
  asistio: { label: "Asistió", color: "#1450C8" },
  aviso: { label: "Avisó que no iría", color: "#E8A500" },
  no_asistio: { label: "No asistió", color: "#C4321F" },
  sin_respuesta: { label: "Sin respuesta", color: "#9AA5B8" },
};
export const ORDEN_RESULTADOS: Resultado[] = ["asistio", "aviso", "no_asistio", "sin_respuesta"];

/** Qué puede hacer el hospital frente a cada causa. */
export const ACCIONES: Record<Motivo, string> = {
  olvido: "Reforzar los avisos del día anterior y del mismo día, y difundir el recordatorio en el SMS de citación.",
  transporte: "Mostrar la guía de transporte y la hora de salida al citar; preferir horarios con más locomoción.",
  laboral: "Ofrecer horas temprano o en la tarde y recordar que se puede pedir un comprobante de asistencia.",
  salud: "Facilitar el aviso por teléfono para liberar la hora y reagendar sin perder el lugar.",
  familiar: "Permitir avisar y reagendar con una llamada corta; ofrecer otra fecha en el mismo llamado.",
  ya_no_necesita: "Confirmar, antes de la cita, si la persona aún necesita la atención (listas de espera largas).",
  cambio_hora: "Avisar al paciente apenas el hospital cambie o suspenda una hora.",
  otro: "Revisar los comentarios para detectar causas nuevas.",
};

export function resultado(r: FilaRecordatorio, ahora: Date): Resultado | null {
  if (r.anulado_en) return null;
  if (r.no_asistira_en) return "aviso";
  if (new Date(r.cita_en) > ahora) return null; // aún no ocurre
  if (r.asistio === true) return "asistio";
  if (r.asistio === false) return "no_asistio";
  return "sin_respuesta";
}

const pct = (a: number, b: number) => (b ? a / b : null);

/** Lunes (fecha de Chile) de la semana de una fecha. */
function lunesDe(d: Date) {
  const [y, m, dd] = chileDateKey(d).split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, dd));
  const dow = (t.getUTCDay() + 6) % 7;
  t.setUTCDate(t.getUTCDate() - dow);
  return t.toISOString().slice(0, 10);
}

export function calcular(filas: FilaRecordatorio[], ahora: Date, dias: number) {
  const desde = new Date(ahora.getTime() - dias * 86_400_000);
  const creados = filas.filter((r) => new Date(r.creado_en) >= desde);
  // Citas del período que ya ocurrieron, o en las que la persona avisó que no iría.
  const delPeriodo = filas.filter((r) => new Date(r.cita_en) >= desde && new Date(r.cita_en) <= ahora || (r.no_asistira_en && new Date(r.cita_en) >= desde));
  const conResultado = delPeriodo.map((r) => ({ r, res: resultado(r, ahora) })).filter((x): x is { r: FilaRecordatorio; res: Resultado } => !!x.res);

  const n: Record<Resultado, number> = { asistio: 0, no_asistio: 0, aviso: 0, sin_respuesta: 0 };
  for (const x of conResultado) n[x.res]++;
  const citas = conResultado.length;
  const conocidas = n.asistio + n.no_asistio;
  const faltaron = n.no_asistio + n.aviso;

  // Motivos: de quienes no asistieron y de quienes avisaron.
  const conMotivo = conResultado.filter((x) => (x.res === "no_asistio" || x.res === "aviso") && esMotivo(x.r.motivo));
  const motivos = (Object.keys(MOTIVOS) as Motivo[]).map((m) => {
    const de = conMotivo.filter((x) => x.r.motivo === m);
    return {
      motivo: m, label: MOTIVOS[m], n: de.length,
      antes: de.filter((x) => x.res === "aviso").length,
      despues: de.filter((x) => x.res === "no_asistio").length,
      accion: ACCIONES[m],
    };
  }).filter((m) => m.n > 0).sort((a, b) => b.n - a.n);

  // Semanas (citas ya ocurridas), de la más antigua a la más reciente.
  const semanasN = Math.max(1, Math.ceil(dias / 7));
  const semanas: { semana: string; n: Record<Resultado, number> }[] = [];
  for (let i = semanasN - 1; i >= 0; i--) {
    semanas.push({ semana: lunesDe(new Date(ahora.getTime() - i * 7 * 86_400_000)), n: { asistio: 0, no_asistio: 0, aviso: 0, sin_respuesta: 0 } });
  }
  for (const x of conResultado) {
    const s = semanas.find((w) => w.semana === lunesDe(new Date(x.r.cita_en)));
    if (s) s.n[x.res]++;
  }

  // Por especialidad.
  const esp = new Map<string, { citas: number; faltaron: number; motivos: Record<string, number> }>();
  for (const x of conResultado) {
    const k = x.r.especialidad || "Sin especialidad indicada";
    const e = esp.get(k) ?? { citas: 0, faltaron: 0, motivos: {} };
    e.citas++;
    if (x.res === "no_asistio" || x.res === "aviso") {
      e.faltaron++;
      if (esMotivo(x.r.motivo)) e.motivos[x.r.motivo] = (e.motivos[x.r.motivo] ?? 0) + 1;
    }
    esp.set(k, e);
  }
  const porEspecialidad = [...esp.entries()].map(([nombre, e]) => {
    const top = Object.entries(e.motivos).sort((a, b) => b[1] - a[1])[0];
    return { nombre, citas: e.citas, faltaron: e.faltaron, tasa: pct(e.faltaron, e.citas), motivo: top ? MOTIVOS[top[0] as Motivo] : null };
  }).sort((a, b) => b.faltaron - a.faltaron || b.citas - a.citas);

  const contar = (arr: FilaRecordatorio[], key: (r: FilaRecordatorio) => string) =>
    arr.reduce<Record<string, number>>((acc, r) => ((acc[key(r)] = (acc[key(r)] ?? 0) + 1), acc), {});

  return {
    dias,
    creados: creados.length,
    anulados: creados.filter((r) => r.anulado_en).length,
    desdeSms: creados.filter((r) => r.fuente === "sms").length,
    proximas: filas.filter((r) => !r.anulado_en && !r.no_asistira_en && new Date(r.cita_en) > ahora).length,
    citas, n,
    tasaAsistencia: pct(n.asistio, conocidas),
    tasaRespuesta: pct(citas - n.sin_respuesta, citas),
    faltaron,
    motivos,
    totalMotivos: conMotivo.length,
    semanas,
    porEspecialidad,
    comentarios: conMotivo.filter((x) => x.r.motivo_comentario).sort((a, b) => b.r.cita_en.localeCompare(a.r.cita_en)).slice(0, 8)
      .map((x) => ({ motivo: MOTIVOS[x.r.motivo as Motivo], texto: x.r.motivo_comentario!, cuando: x.res })),
    canal: contar(creados, (r) => r.canal),
    rango: contar(creados, (r) => r.rango),
    conLlevar: creados.filter((r) => r.llevar).length,
  };
}

export type Indicadores = ReturnType<typeof calcular>;

/**
 * Datos de ejemplo para presentar el panel antes de tener pacientes reales.
 * Los motivos siguen las proporciones de la encuesta del proyecto (n = 57):
 * olvido 44,7 %, problemas personales o familiares 28,9 %, trabajo o estudios
 * 18,4 %, transporte 10,5 %, ya no necesitaba la atención 10,5 %.
 */
export function datosEjemplo(ahora: Date, cantidad = 260): FilaRecordatorio[] {
  let semilla = 20261120;
  const azar = () => ((semilla = (semilla * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
  const elegir = <T,>(pares: [T, number][]) => {
    const total = pares.reduce((s, p) => s + p[1], 0);
    let r = azar() * total;
    for (const [v, w] of pares) if ((r -= w) <= 0) return v;
    return pares[pares.length - 1][0];
  };
  const especialidades: [string, number][] = [["Medicina interna", 5], ["Traumatología", 4], ["Oftalmología", 4], ["Cardiología", 3], ["Ginecología", 3], ["Pediatría", 3], ["Laboratorio", 4], ["Dermatología", 2]];
  // Se reparten en ciclos con las proporciones de la encuesta, para que el ejemplo sea estable.
  const cicloNoFue: Motivo[] = ["olvido", "familiar", "olvido", "laboral", "olvido", "familiar", "transporte", "olvido", "ya_no_necesita", "familiar",
    "olvido", "laboral", "olvido", "familiar", "transporte", "olvido", "salud", "laboral", "ya_no_necesita", "olvido"];
  const cicloAviso: Motivo[] = ["laboral", "salud", "familiar", "transporte", "ya_no_necesita", "cambio_hora", "laboral", "otro", "salud", "transporte"];
  let iNoFue = 0, iAviso = 0;
  const comentarios: Partial<Record<Motivo, string[]>> = {
    olvido: ["Pedí la hora hace meses y se me pasó.", "Creí que era la otra semana."],
    transporte: ["No pasó la micro y llegué tarde.", "Vivo en la parte alta y no tenía cómo bajar."],
    laboral: ["No me dieron permiso en el trabajo."],
    familiar: ["Tuve que cuidar a mi mamá."],
    ya_no_necesita: ["Me atendí en el consultorio antes."],
  };
  const filas: FilaRecordatorio[] = [];
  for (let i = 0; i < cantidad; i++) {
    const diasCita = -88 + azar() * 102; // desde hace 88 días hasta 14 días más
    const cita = new Date(ahora.getTime() + diasCita * 86_400_000);
    cita.setUTCHours(11 + Math.floor(azar() * 8), azar() < 0.5 ? 0 : 30, 0, 0);
    const creado = new Date(cita.getTime() - (3 + azar() * 25) * 86_400_000);
    const pasada = cita <= ahora;
    const tipo = pasada
      ? elegir<"asistio" | "no_asistio" | "aviso" | "sin">([["asistio", 66], ["no_asistio", 16], ["aviso", 5], ["sin", 13]])
      : elegir<"futuro" | "aviso">([["futuro", 97], ["aviso", 3]]);
    const motivo = tipo === "no_asistio" ? cicloNoFue[iNoFue++ % cicloNoFue.length] : tipo === "aviso" ? cicloAviso[iAviso++ % cicloAviso.length] : null;
    const lista = motivo ? comentarios[motivo] : undefined;
    filas.push({
      creado_en: creado.toISOString(), cita_en: cita.toISOString(),
      canal: "email", // la versión gratuita avisa por correo
      rango: elegir([["manana", 40], ["tarde", 35], ["noche", 25]]),
      especialidad: elegir(especialidades),
      anulado_en: azar() < 0.03 ? creado.toISOString() : null,
      no_asistira_en: tipo === "aviso" ? new Date(cita.getTime() - 86_400_000).toISOString() : null,
      asistio: tipo === "asistio" ? true : tipo === "no_asistio" ? false : null,
      motivo, motivo_comentario: lista && azar() < 0.35 ? lista[Math.floor(azar() * lista.length)] : null,
      fuente: azar() < 0.3 ? "sms" : "web",
      llevar: azar() < 0.4 ? "Resultados de exámenes" : null,
    });
  }
  return filas;
}
