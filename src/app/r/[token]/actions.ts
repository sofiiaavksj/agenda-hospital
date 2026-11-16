"use server";
import { redirect } from "next/navigation";
import { db } from "@/lib/supabase";
import { leerToken } from "@/lib/token";
import { esMotivo } from "@/lib/motivos";

async function cargar(f: FormData) {
  const token = String(f.get("token") ?? "");
  const id = leerToken(token);
  if (!id) redirect("/");
  return { sb: db(), id, path: `/r/${token}` };
}

/** Motivo y comentario opcionales. Si la migración de noviembre aún no está, se guarda sin ellos. */
function motivoDe(f: FormData) {
  const m = String(f.get("motivo") ?? "");
  const comentario = String(f.get("comentario") ?? "").trim().slice(0, 300) || null;
  return esMotivo(m) ? { motivo: m, motivo_comentario: comentario } : {};
}

async function actualizar(sb: ReturnType<typeof db>, id: string, cambios: Record<string, unknown>, extra: Record<string, unknown>, filtro: (q: any) => any) {
  const { error } = await filtro(sb.from("recordatorios").update({ ...cambios, ...extra }).eq("id", id));
  if (error && Object.keys(extra).length && /motivo|column/i.test(error.message)) {
    await filtro(sb.from("recordatorios").update(cambios).eq("id", id));
  }
}

export async function noPodreIr(f: FormData) {
  const { sb, id, path } = await cargar(f);
  await actualizar(sb, id, { no_asistira_en: new Date().toISOString() }, motivoDe(f), (q) => q.is("no_asistira_en", null));
  redirect(`${path}?aviso=1`);
}

export async function anular(f: FormData) {
  const { sb, id, path } = await cargar(f);
  await sb.from("recordatorios").update({ anulado_en: new Date().toISOString() }).eq("id", id).is("anulado_en", null);
  await sb.from("mensajes").update({ estado: "omitido" }).eq("recordatorio_id", id).eq("estado", "pendiente");
  redirect(`${path}?ok=${encodeURIComponent("Listo, no le enviaremos más avisos para esta hora.")}`);
}

export async function responderAsistencia(f: FormData) {
  const { sb, id, path } = await cargar(f);
  const asistio = f.get("asistio") === "1";
  await actualizar(sb, id, { asistio, asistio_respondido_en: new Date().toISOString() }, asistio ? {} : motivoDe(f),
    (q) => q.lte("cita_en", new Date().toISOString()));
  redirect(`${path}?ok=${encodeURIComponent(asistio ? "Gracias por responder." : "Gracias por contarnos. Nos ayuda a mejorar la atención.")}`);
}
