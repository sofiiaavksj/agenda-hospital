/**
 * Hora recomendada de salida.
 *
 * El tiempo de viaje en transporte público se estima con la distancia en línea
 * recta hasta el hospital (por eso es aproximado): se corrige por el trazado
 * de las calles, se divide por una velocidad promedio de micro o colectivo y
 * se suman minutos de caminata y espera. La persona puede ajustarlo con + y −.
 */
export const HOSPITAL_COORD = { lat: -29.9615, lon: -71.339 }; // Av. Videla s/n, Coquimbo (aprox.)

export const MINUTOS_ANTES = 20;       // llegar antes de la hora para la admisión
const FACTOR_CALLES = 1.35;            // la calle no va en línea recta
const KMH_TRANSPORTE = 16;             // velocidad promedio puerta a puerta
const CAMINAR_Y_ESPERAR = 10;          // caminar al paradero y esperar
export const VIAJE_SIN_DATOS = 45;     // si no se conoce la ubicación

export function distanciaKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const R = 6371, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLon = (b.lon - a.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Minutos de viaje estimados, redondeados hacia arriba a múltiplos de 5 (mínimo 15, máximo 180). */
export function minutosViaje(desde?: { lat: number; lon: number } | null) {
  if (!desde || !Number.isFinite(desde.lat) || !Number.isFinite(desde.lon)) return VIAJE_SIN_DATOS;
  const km = distanciaKm(desde, HOSPITAL_COORD) * FACTOR_CALLES;
  const min = (km / KMH_TRANSPORTE) * 60 + CAMINAR_Y_ESPERAR;
  return Math.min(180, Math.max(15, Math.ceil(min / 5) * 5));
}

/** "08:30" y 40 min de viaje → "07:30" (sale 40 min + 20 min antes). Devuelve null si la hora no es válida. */
export function horaSalida(horaCita: string, minutosDeViaje: number, antes = MINUTOS_ANTES) {
  const m = horaCita.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const h = +m[1], mi = +m[2];
  if (h > 23 || mi > 59) return null;
  let total = h * 60 + mi - minutosDeViaje - antes;
  const diaAnterior = total < 0;
  total = ((total % 1440) + 1440) % 1440;
  const hh = String(Math.floor(total / 60)).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return { hora: `${hh}:${mm}`, diaAnterior };
}
