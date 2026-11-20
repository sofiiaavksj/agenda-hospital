import type { TipoMensaje } from "./agenda";
import { formatDateLong, formatTime } from "./time";
import { textoLlevar } from "./llevar";

export interface DatosMensaje {
  hospital: string;
  nombre?: string | null;
  citaEn: string;
  especialidad?: string | null;
  lugar?: string | null;
  enlaceGestion: string;
  enlaceTransporte: string;
  /** Indicación al llegar (tótem de atención). Vacío = no se muestra. */
  totem?: string;
  /** Lo que debe llevar, además de la cédula (texto guardado en el recordatorio). */
  llevar?: string | null;
}

/** Textos cortos, una idea por mensaje, con enlaces a la gestión y a cómo llegar. */
export function redactar(tipo: TipoMensaje, d: DatosMensaje): { asunto: string; texto: string } {
  const hola = d.nombre ? `Hola ${d.nombre.split(" ")[0]}.` : "Hola.";
  const que = d.especialidad ? `su hora de ${d.especialidad}` : "su hora médica";
  const cuando = `el ${formatDateLong(d.citaEn)} a las ${formatTime(d.citaEn)}`;
  const donde = d.lugar ? `\nLugar: ${d.lugar}.` : "";
  const llegar = `\n\nCómo llegar y a qué hora salir: ${d.enlaceTransporte}`;
  const gestion = `\nSi no podrá ir o quiere anular los avisos: ${d.enlaceGestion}`;
  const totem = d.totem ? `\n${d.totem}` : "";
  const lleve = `\nNo olvide: ${textoLlevar(d.llevar)}.`;
  switch (tipo) {
    case "confirmacion":
      return {
        asunto: "Recordatorio registrado",
        texto: `${hola} Registramos un recordatorio para ${que} en ${d.hospital}, ${cuando}.${donde}${lleve}\nLe avisaremos antes de la cita.${llegar}${gestion}\n\nPara que nuestros avisos no lleguen a correo no deseado, agregue esta dirección a sus contactos.\nSi usted no pidió este recordatorio, anúlelo en el enlace.`,
      };
    case "dos_dias":
      return { asunto: "Su hora es en 2 días", texto: `${hola} Le recordamos ${que} en ${d.hospital}, ${cuando}.${donde}${lleve}${llegar}${gestion}` };
    case "un_dia":
      return { asunto: "Su hora es mañana", texto: `${hola} Mañana tiene ${que} en ${d.hospital}, a las ${formatTime(d.citaEn)}.${donde}${lleve}\nLlegue 20 minutos antes.${totem}${llegar}${gestion}` };
    case "mismo_dia":
      return { asunto: "Su hora es hoy", texto: `${hola} Hoy a las ${formatTime(d.citaEn)} tiene ${que} en ${d.hospital}.${donde}${lleve}${totem}${llegar}` };
    case "post_cita":
      return { asunto: "¿Pudo asistir?", texto: `${hola} ¿Pudo asistir a ${que}? Responda con un toque, nos ayuda a mejorar: ${d.enlaceGestion}` };
  }
}
