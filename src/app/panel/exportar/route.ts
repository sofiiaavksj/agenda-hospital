import { cookies } from "next/headers";
import { db } from "@/lib/supabase";
import { COOKIE, credenciales, firmaSesion } from "@/lib/panel-auth";
import { resultado, RESULTADOS, type FilaRecordatorio } from "@/lib/indicadores";
import { MOTIVOS, esMotivo } from "@/lib/motivos";
import { chileDateKey, formatTime } from "@/lib/time";

export const dynamic = "force-dynamic";

/** Planilla para Excel (separada por punto y coma). No incluye correos ni teléfonos. */
export async function GET(req: Request) {
  const { usuario, clave } = credenciales();
  const sesion = (await cookies()).get(COOKIE)?.value;
  if (!usuario || !clave || sesion !== (await firmaSesion())) return new Response("No autorizado", { status: 401 });

  const dias = [7, 30, 90].includes(Number(new URL(req.url).searchParams.get("dias"))) ? Number(new URL(req.url).searchParams.get("dias")) : 30;
  const desde = new Date(Date.now() - dias * 86_400_000).toISOString();
  const { data } = await db().from("recordatorios").select("*").or(`creado_en.gte.${desde},cita_en.gte.${desde}`).order("cita_en");
  const ahora = new Date();
  const celda = (v: unknown) => {
    const t = String(v ?? "").replace(/[\r\n]+/g, " ");
    return /[";]/.test(t) || /^[=+\-@]/.test(t) ? `"${t.replace(/^([=+\-@])/, "'$1").replace(/"/g, '""')}"` : t;
  };
  const filas = (data ?? []) as FilaRecordatorio[];
  const lineas = [
    ["Fecha de la cita", "Hora", "Especialidad", "Resultado", "Motivo", "Comentario", "Qué llevar", "Medio de aviso", "Horario de avisos", "Origen", "Creado"],
    ...filas.map((r) => {
      const res = resultado(r, ahora);
      return [
        chileDateKey(new Date(r.cita_en)), formatTime(r.cita_en), r.especialidad ?? "",
        r.anulado_en ? "Avisos anulados" : res ? RESULTADOS[res].label : "Cita próxima",
        esMotivo(r.motivo) ? MOTIVOS[r.motivo] : "", r.motivo_comentario ?? "", r.llevar ?? "",
        r.canal, r.rango, r.fuente ?? "web", chileDateKey(new Date(r.creado_en)),
      ];
    }),
  ];
  const csv = "﻿" + lineas.map((l) => l.map(celda).join(";")).join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="inasistencia-${dias}-dias.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
