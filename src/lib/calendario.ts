/** Enlace "Agregar a Google Calendar" con el evento ya completo. */
const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

export function googleCalendarUrl(e: { titulo: string; inicio: Date; minutos?: number; lugar: string; detalle: string }) {
  const fin = new Date(e.inicio.getTime() + (e.minutos ?? 60) * 60_000);
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: e.titulo,
    dates: `${fmt(e.inicio)}/${fmt(fin)}`,
    location: e.lugar,
    details: e.detalle,
    ctz: "America/Santiago",
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}
