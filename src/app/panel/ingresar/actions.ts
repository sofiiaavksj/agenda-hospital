"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE, credenciales, firmaSesion } from "@/lib/panel-auth";

export async function ingresar(_: { error?: string; ok?: boolean }, f: FormData): Promise<{ error?: string; ok?: boolean }> {
  const { usuario, clave } = credenciales();
  if (!usuario || !clave) return { error: "El panel no está configurado: faltan PANEL_USER y PANEL_PASSWORD en Vercel (y luego Redeploy)." };
  const u = String(f.get("usuario") ?? "").trim();
  const c = String(f.get("clave") ?? "").trim();
  // Pausa breve para dificultar intentos repetidos.
  await new Promise((r) => setTimeout(r, 400));
  if (u.toLowerCase() !== usuario.toLowerCase() || c !== clave) return { error: "Usuario o contraseña incorrectos. La contraseña distingue mayúsculas y minúsculas." };
  (await cookies()).set(COOKIE, await firmaSesion(), {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/panel", maxAge: 60 * 60 * 12,
  });
  // La navegación al panel la hace el navegador (carga completa) para que la cookie nueva viaje en la solicitud.
  return { ok: true };
}

export async function salir() {
  (await cookies()).delete({ name: COOKIE, path: "/panel" });
  redirect("/panel/ingresar");
}
