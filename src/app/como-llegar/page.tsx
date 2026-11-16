import Link from "next/link";
import { Shell } from "@/components/Shell";
import { AlLlegar, BotonesApps, Paraderos } from "@/components/Transporte";
import { ORIGENES, HOSPITAL, CONSEJOS, completarDireccion } from "@/data/transporte";
import { sitio } from "@/config/sitio";
import { db } from "@/lib/supabase";

export const metadata = { title: "Cómo llegar", referrer: "no-referrer" };
export const dynamic = "force-dynamic";

/**
 * Guía de transporte. Lo principal es la dirección escrita por el paciente
 * (la ruta la calcula Google Maps); las rutas escritas por sector quedan como
 * complemento para quien no usa aplicaciones.
 */
export default async function Page(props: { searchParams: Promise<{ desde?: string }> }) {
  const { desde: desdeCrudo } = await props.searchParams;
  const desde = desdeCrudo?.trim().replace(/\s+/g, " ").slice(0, 150) || "";
  if (desde) {
    // Sólo se registra que hubo una consulta por dirección; la dirección no se guarda.
    try { await db().from("consultas_transporte").insert({ origen: "direccion" }); } catch { /* no bloquea */ }
  }
  const grupos = ["Coquimbo", "La Serena", "Otras comunas"] as const;

  return (
    <Shell back={{ href: "/", label: "Volver" }}>
      <h1 className="text-3xl font-bold tracking-tight">¿Cómo llego al hospital?</h1>
      <p className="mt-2 text-ink-soft">{HOSPITAL.nombre}, {HOSPITAL.direccion}.</p>

      <form action="/como-llegar" method="get" className="mt-8 rounded-2xl border-2 border-pine bg-white p-5">
        <label htmlFor="desde" className="block text-2xl font-bold">¿Desde dónde viaja?</label>
        <p className="mb-3 mt-1 text-ink-soft">Escriba su dirección con número y comuna.</p>
        <input id="desde" name="desde" defaultValue={desde} maxLength={150} autoComplete="street-address" required
          placeholder="Ej.: Los Pescadores 1234, Coquimbo" className="field text-xl" />
        <button type="submit" className="btn-primary mt-4 w-full py-4 text-lg">Ver cómo llegar</button>
      </form>

      {desde ? (
        <section className="mt-8" aria-live="polite">
          <h2 className="text-2xl font-bold">Ruta desde {desde}</h2>
          <p className="mb-4 mt-1 text-ink-soft">
            Google Maps le muestra qué micro o colectivo tomar, dónde subir y bajar, y cuánto tarda, con los horarios del momento.
          </p>
          <BotonesApps origen={completarDireccion(desde)} />
          <p className="mt-3 text-base text-ink-soft">¿No encuentra su dirección? Pruebe con el nombre de su villa o sector y la comuna.</p>
        </section>
      ) : (
        <section className="mt-6">
          <p className="mb-3 text-ink-soft">O, si está en su casa con el celular:</p>
          <BotonesApps />
        </section>
      )}

      <div className="mt-10"><AlLlegar texto={sitio.totem} /></div>

      <section className="mt-10">
        <h2 className="mb-3 text-2xl font-bold">Paraderos cerca del hospital</h2>
        <Paraderos />
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-2xl font-bold">Antes de salir</h2>
        <ul className="list-disc space-y-1 pl-6">{CONSEJOS.map((c) => <li key={c}>{c}</li>)}</ul>
      </section>

      <details className="mt-10 rounded-2xl border border-line bg-white">
        <summary className="cursor-pointer list-none px-5 py-4 text-lg font-bold">¿No usa aplicaciones? Vea rutas escritas por sector</summary>
        <div className="border-t border-line px-5 py-4">
          {grupos.map((g) => (
            <div key={g} className="mb-5 last:mb-0">
              <h3 className="mb-2 font-bold text-ink-soft">{g}</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {ORIGENES.filter((o) => o.grupo === g).map((o) => (
                  <Link key={o.id} href={`/como-llegar/${o.id}`} className="rounded-xl border-2 border-line bg-white px-4 py-3 font-bold hover:border-pine">
                    {o.nombre}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </details>

      <section className="mt-10 rounded-2xl border-2 border-pine bg-white p-5">
        <h2 className="text-xl font-bold">¿Quiere que le recordemos su hora?</h2>
        <p className="mt-1 text-ink-soft">Le avisamos antes de la cita, con esta ruta incluida.</p>
        <Link href="/recordatorio" className="btn-primary mt-4">Activar recordatorio</Link>
      </section>
    </Shell>
  );
}
