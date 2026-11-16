import Link from "next/link";
import { cookies } from "next/headers";
import { Shell } from "@/components/Shell";
import { AlLlegar, Paraderos } from "@/components/Transporte";
import { BuscadorRuta, type Sector } from "@/components/BuscadorRuta";
import { ORIGENES, HOSPITAL, CONSEJOS, origenPorId } from "@/data/transporte";
import { sitio } from "@/config/sitio";
import { db } from "@/lib/supabase";
import { COOKIE_RECORDATORIO } from "@/lib/recordatorio-cookie";

export const metadata = { title: "Cómo llegar", referrer: "no-referrer" };
export const dynamic = "force-dynamic";

const HABITUALES = ["coquimbo-centro", "parte-alta", "san-juan", "sindempart", "tierras-blancas", "el-llano", "la-serena-centro"];

/**
 * Guía de transporte: buscador de direcciones con sugerencias; al elegir una,
 * aparecen los botones con esa ruta. Las rutas escritas por sector quedan como
 * complemento para quien no usa aplicaciones.
 */
export default async function Page(props: { searchParams: Promise<{ desde?: string; rec?: string }> }) {
  const sp = await props.searchParams;
  const desde = sp.desde?.trim().replace(/\s+/g, " ").slice(0, 150) || "";
  if (desde) {
    // Sólo se cuenta la consulta; la dirección no se guarda.
    try { await db().from("consultas_transporte").insert({ origen: "direccion" }); } catch { /* no bloquea */ }
  }
  // Si la persona ya tiene un recordatorio (viene desde él), no se le vuelve a ofrecer.
  const yaTieneRecordatorio = sp.rec === "1" || (await cookies()).has(COOKIE_RECORDATORIO);
  const sectores: Sector[] = HABITUALES.map((id) => origenPorId(id)!).filter(Boolean).map((o) => {
    const corto = o.nombre.replace("Centro de ", "").split(" /")[0];
    const comuna = o.grupo === "Otras comunas" ? "" : `, ${o.grupo}`;
    return { id: o.id, etiqueta: o.id === "la-serena-centro" ? "La Serena centro" : o.id === "coquimbo-centro" ? "Coquimbo centro" : corto, texto: `${corto}${comuna}, Chile` };
  });
  const grupos = ["Coquimbo", "La Serena", "Otras comunas"] as const;

  return (
    <Shell back={{ href: "/", label: "Volver" }}>
      <h1 className="text-3xl font-bold tracking-tight">¿Cómo llego al hospital?</h1>
      <p className="mt-2 text-ink-soft">{HOSPITAL.nombre}, {HOSPITAL.direccion}.</p>

      <div className="mt-8 rounded-2xl border-2 border-pine bg-white p-5">
        <BuscadorRuta inicial={desde || undefined} sectores={sectores} />
      </div>

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
                  <Link key={o.id} href={`/como-llegar/${o.id}${yaTieneRecordatorio ? "?rec=1" : ""}`} className="rounded-xl border-2 border-line bg-white px-4 py-3 font-bold hover:border-pine">
                    {o.nombre}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </details>

      {!yaTieneRecordatorio && (
        <section className="mt-10 rounded-2xl border-2 border-pine bg-white p-5">
          <h2 className="text-xl font-bold">¿Quiere que le recordemos su hora?</h2>
          <p className="mt-1 text-ink-soft">Le avisamos antes de la cita, con la ruta incluida.</p>
          <Link href="/recordatorio" className="btn-primary mt-4">Activar recordatorio</Link>
        </section>
      )}
    </Shell>
  );
}
