import "server-only";

export type Canal = "whatsapp" | "sms" | "email";

/**
 * Medios de aviso que realmente pueden enviarse con la configuración actual.
 * La página sólo ofrece estos: así ningún paciente elige un medio por el que
 * no le llegará nada.
 *  - Correo: Gmail (SMTP_USER + SMTP_PASS) o Resend (RESEND_API_KEY).
 *  - WhatsApp y SMS: Twilio (NOTIFY_PROVIDER=twilio + credenciales y número).
 * Sin ningún proveedor configurado (pruebas), se ofrece sólo el correo, simulado.
 */
export function canalesActivos(): Canal[] {
  const e = process.env;
  const twilio = e.NOTIFY_PROVIDER === "twilio" && !!e.TWILIO_ACCOUNT_SID && !!e.TWILIO_AUTH_TOKEN;
  const lista: Canal[] = [];
  if (twilio && e.TWILIO_WHATSAPP_FROM) lista.push("whatsapp");
  if (twilio && e.TWILIO_SMS_FROM) lista.push("sms");
  lista.push("email");
  return lista;
}

const NOMBRE: Record<Canal, string> = { whatsapp: "WhatsApp", sms: "mensaje de texto", email: "correo electrónico" };

/** "correo electrónico" · "WhatsApp o correo electrónico" · "WhatsApp, mensaje de texto o correo electrónico" */
export function textoCanales(lista = canalesActivos()) {
  const n = lista.map((c) => NOMBRE[c]);
  return n.length > 1 ? `${n.slice(0, -1).join(", ")} o ${n[n.length - 1]}` : n[0];
}
