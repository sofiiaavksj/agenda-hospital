/** Datos del establecimiento y de la plataforma (se leen de variables de entorno). */
const clean = (v?: string) => v?.split("#")[0].trim() || "";

export const sitio = {
  hospital: clean(process.env.HOSPITAL_NAME) || "Hospital San Pablo de Coquimbo",
  /**
   * Indicación al llegar al hospital. Se muestra en la confirmación, en los
   * avisos del día anterior y del mismo día, y en el calendario.
   * Para cambiar el texto, cargue TOTEM_MSG en Vercel; con TOTEM_MSG=no se oculta.
   */
  totem: (() => {
    const v = clean(process.env.TOTEM_MSG);
    if (v.toLowerCase() === "no") return "";
    return v || "Acérquese al tótem de atención para registrar su llegada.";
  })(),
};

export function appUrl() {
  const url = process.env.APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  return url.replace(/\/$/, "");
}
