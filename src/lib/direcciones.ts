/**
 * Sugerencias de direcciones a partir de OpenStreetMap (servicio Photon).
 * Funciones puras: se prueban sin conexión.
 */
export interface Sugerencia {
  id: string;
  titulo: string;   // "Los Pescadores 1234" o "Mallplaza La Serena"
  detalle: string;  // "Sindempart, Coquimbo"
  texto: string;    // lo que se envía a Google Maps como origen
}

interface PhotonFeature {
  properties?: Record<string, string | undefined>;
  geometry?: { coordinates?: [number, number] };
}

/** Número de casa escrito por la persona ("los pescadores 1234" → "1234"). */
export function numeroEn(consulta: string) {
  return consulta.match(/\b(\d{1,5})\b/)?.[1];
}

const unicos = (xs: (string | undefined)[]) =>
  xs.filter((x, i, a): x is string => !!x && a.findIndex((y) => y?.toLowerCase() === x.toLowerCase()) === i);

export function sugerenciasDesdePhoton(json: { features?: PhotonFeature[] }, consulta: string): Sugerencia[] {
  const numero = numeroEn(consulta);
  const vistas = new Set<string>();
  const salida: Sugerencia[] = [];
  for (const f of json.features ?? []) {
    const p = f.properties ?? {};
    const calle = p.street ?? (p.type === "street" ? p.name : undefined);
    // Si el resultado es una calle sin número y la persona escribió uno, se agrega.
    const nroCasa = p.housenumber ?? (calle && p.type === "street" ? numero : undefined);
    const esLugar = p.name && p.name !== calle;
    const titulo = esLugar ? p.name! : unicos([calle, nroCasa]).join(" ") || p.name || "";
    if (!titulo) continue;
    const ciudad = p.city ?? p.county ?? p.locality;
    const detalle = unicos([esLugar ? unicos([calle, p.housenumber]).join(" ") : undefined, p.district ?? p.locality, ciudad])
      .filter((x) => x.toLowerCase() !== titulo.toLowerCase()).join(", ");
    const texto = unicos([titulo, esLugar && calle ? unicos([calle, p.housenumber]).join(" ") : undefined, ciudad, "Chile"]).join(", ");
    const clave = `${titulo}|${detalle}`.toLowerCase();
    if (vistas.has(clave)) continue;
    vistas.add(clave);
    const c = f.geometry?.coordinates;
    salida.push({ id: c ? `${c[1].toFixed(5)},${c[0].toFixed(5)}` : clave, titulo, detalle, texto });
  }
  return salida.slice(0, 6);
}
