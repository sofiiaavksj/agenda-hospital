import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { redactar } from "./mensajes";
import { enviar } from "./envio";
import { crearToken } from "./token";
import { appUrl, sitio } from "@/config/sitio";
import type { TipoMensaje } from "./agenda";
import { formatTime } from "./time";

/** Ruta hacia el hospital: desde la dirección escrita, el sector elegido o la guía general. */
export function enlaceTransporte(base: string, r: { direccion_origen?: string | null; origen?: string | null; cita_en?: string | null }) {
  // rec=1: la persona ya tiene recordatorio; la guía no se lo vuelve a ofrecer.
  // hora: la guía calcula de inmediato a qué hora salir.
  const hora = r.cita_en ? `&hora=${encodeURIComponent(formatTime(r.cita_en))}` : "";
  if (r.direccion_origen) return `${base}/como-llegar?desde=${encodeURIComponent(r.direccion_origen)}&rec=1${hora}`;
  if (r.origen) return `${base}/como-llegar/${r.origen}?rec=1`;
  return `${base}/como-llegar?rec=1${hora}`;
}

/** Redacta y envía un mensaje ya reservado (estado "enviado" provisional) y guarda el resultado. */
export async function despachar(sb: SupabaseClient, m: { id: string; recordatorio_id: string; tipo: TipoMensaje }) {
  const { data: r } = await sb.from("recordatorios").select("*").eq("id", m.recordatorio_id).single();
  if (!r) return;
  const omitir =
    r.anulado_en ||
    (m.tipo !== "post_cita" && m.tipo !== "confirmacion" && (r.no_asistira_en || new Date(r.cita_en) <= new Date())) ||
    (m.tipo === "post_cita" && (r.no_asistira_en || r.asistio !== null));
  if (omitir) {
    await sb.from("mensajes").update({ estado: "omitido" }).eq("id", m.id);
    return "omitido";
  }
  const base = appUrl();
  const { asunto, texto } = redactar(m.tipo, {
    hospital: sitio.hospital, nombre: r.nombre, citaEn: r.cita_en, especialidad: r.especialidad, lugar: r.lugar,
    enlaceGestion: `${base}/r/${crearToken(r.id)}`,
    enlaceTransporte: enlaceTransporte(base, r),
    totem: sitio.totem,
    llevar: r.llevar,
  });
  const res = await enviar(r.canal, r.contacto, asunto, texto);
  await sb.from("mensajes").update({
    estado: res.estado, cuerpo: texto, error: res.error ?? null, ref_proveedor: res.ref ?? null, enviado_en: new Date().toISOString(),
  }).eq("id", m.id);
  return res.estado;
}
