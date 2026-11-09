/**
 * Acceso al panel con usuario y contraseña (PANEL_USER / PANEL_PASSWORD).
 * Tras ingresar se guarda una cookie con una firma derivada de las credenciales:
 * si se cambia la contraseña en Vercel, las sesiones anteriores dejan de valer.
 */
export const COOKIE = "panel_sesion";

const limpio = (v?: string) => (v ?? "").split(" #")[0].trim();

export function credenciales() {
  return { usuario: limpio(process.env.PANEL_USER), clave: limpio(process.env.PANEL_PASSWORD) };
}

export async function firmaSesion() {
  const { usuario, clave } = credenciales();
  const datos = new TextEncoder().encode(`panel:${usuario.toLowerCase()}:${clave}:${process.env.TOKEN_SECRET ?? ""}`);
  const hash = await crypto.subtle.digest("SHA-256", datos);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
