/**
 * Marca en el navegador que la persona ya activó un recordatorio, para no
 * volver a ofrecérselo en la guía de transporte. No contiene datos personales.
 */
export const COOKIE_RECORDATORIO = "tiene_recordatorio";
export const COOKIE_RECORDATORIO_OPCIONES = { httpOnly: true, sameSite: "lax" as const, path: "/", maxAge: 60 * 60 * 24 * 60 };
