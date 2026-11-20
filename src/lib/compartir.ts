/**
 * Mensaje para avisar a un familiar o cuidador de la cita. Lo envía la propia
 * persona desde su WhatsApp (o SMS): no tiene costo y no pasa por la plataforma.
 * No incluye el enlace personal de gestión, sólo datos de la cita.
 * Sin emojis: algunos WhatsApp (sobre todo en el computador) los muestran como "�".
 * Los *asteriscos* se ven en negrita en WhatsApp.
 */
import { formatDateLong, formatTime } from "./time";
import { textoLlevar } from "./llevar";

export interface DatosCompartir {
  quien: "yo" | "otra";
  nombre?: string | null;
  citaEn: string;
  especialidad?: string | null;
  lugar?: string | null;
  llevar?: string | null;
  hospital: string;
  totem?: string;
  enlaceLlegar: string;
}

export function mensajeCompartir(d: DatosCompartir) {
  const primer = d.nombre?.trim().split(" ")[0];
  const que = d.especialidad ? `hora de ${d.especialidad}` : "hora médica";
  const inicio = d.quien === "yo"
    ? `Hola, te cuento que tengo ${que} en el ${d.hospital}.`
    : `Hola, te aviso que ${primer || "tu familiar"} tiene ${que} en el ${d.hospital}.`;
  const lineas = [
    inicio,
    `*Fecha:* ${formatDateLong(d.citaEn).replace(/^./, (c) => c.toUpperCase())}, a las ${formatTime(d.citaEn)}.`,
    d.lugar ? `*Lugar:* ${d.lugar}.` : "",
    `*${d.quien === "yo" ? "Debo llevar" : "Debe llevar"}:* ${textoLlevar(d.llevar)}.`,
    "*Importante:* llegar 20 minutos antes.",
    d.totem ? d.totem : "",
    `*Cómo llegar y a qué hora salir:* ${d.enlaceLlegar}`,
    "",
    d.quien === "yo" ? "Te lo envío para que me ayudes a recordarlo." : "Te lo envío para que le ayudes a recordarlo.",
  ];
  return lineas.filter((l, i) => l !== "" || i === lineas.length - 2).join("\n");
}

export const enlaceWhatsapp = (texto: string) => `https://wa.me/?text=${encodeURIComponent(texto)}`;
export const enlaceSms = (texto: string) => `sms:?&body=${encodeURIComponent(texto)}`;
