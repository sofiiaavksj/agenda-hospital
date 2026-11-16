import { NextResponse, type NextRequest } from "next/server";
import { sugerenciasDesdePhoton } from "@/lib/direcciones";

/**
 * Buscador de direcciones para "¿Cómo llego?": consulta OpenStreetMap (Photon,
 * gratuito y sin clave) limitado a la Región de Coquimbo. No se guarda nada.
 */
export const runtime = "nodejs";

const REGION = { bbox: "-72.0,-32.3,-69.8,-29.0", lat: "-29.95", lon: "-71.34" };

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().replace(/\s+/g, " ").slice(0, 100);
  if (q.length < 3) return NextResponse.json({ sugerencias: [] });
  const url = new URL(process.env.PHOTON_URL || "https://photon.komoot.io/api/");
  url.search = new URLSearchParams({ q, limit: "8", lat: REGION.lat, lon: REGION.lon, bbox: REGION.bbox }).toString();
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "AgendaHospitalSanPablo/1.0 (proyecto academico)" },
      signal: AbortSignal.timeout(4000),
      next: { revalidate: 86_400 },
    });
    if (!res.ok) return NextResponse.json({ sugerencias: [] });
    const sugerencias = sugerenciasDesdePhoton(await res.json(), q);
    return NextResponse.json({ sugerencias }, { headers: { "Cache-Control": "public, s-maxage=86400" } });
  } catch {
    // Sin conexión con el buscador: la página igual permite usar lo escrito.
    return NextResponse.json({ sugerencias: [] });
  }
}
