import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * Link corto para el SMS del hospital: /c?n=…&f=…&h=…&e=…&l=…
 * Registra la visita (sin datos personales) y abre el formulario ya completado.
 */
export async function GET(req: NextRequest) {
  const destino = new URL("/recordatorio", req.url);
  req.nextUrl.searchParams.forEach((v, k) => {
    if (["n", "f", "h", "e", "l", "ll", "nombre", "fecha", "hora", "especialidad", "lugar", "llevar"].includes(k)) destino.searchParams.set(k, v);
  });
  destino.searchParams.set("fuente", "sms");
  try { await db().from("visitas").insert({ fuente: "sms" }); } catch { /* no bloquea */ }
  const res = NextResponse.redirect(destino, 303);
  res.headers.set("Referrer-Policy", "no-referrer");
  res.headers.set("Cache-Control", "no-store");
  return res;
}
