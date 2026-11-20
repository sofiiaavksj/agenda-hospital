import Link from "next/link";
import { Shell } from "@/components/Shell";
import { IconoBus, IconoCampana, IconoFono, Flecha } from "@/components/Iconos";
import { sitio } from "@/config/sitio";
import { db } from "@/lib/supabase";
import { textoCanales } from "@/lib/canales";

export const dynamic = "force-dynamic";

export default async function Inicio(props: { searchParams: Promise<{ origen?: string }> }) {
  const searchParams = await props.searchParams;
  // Mide cuántas personas llegan desde el banner del hospital o desde el afiche QR.
  if (searchParams.origen === "sitio-hospital" || searchParams.origen === "qr") {
    try { await db().from("visitas").insert({ fuente: searchParams.origen }); } catch { /* no bloquea */ }
  }

  const hero = (
    <section className="bg-azul text-white">
      <div className="mx-auto max-w-2xl px-4 pb-24 pt-10 sm:px-5 sm:pt-14">
        <h1 className="text-[2.6rem] font-bold leading-[1.05] tracking-tight sm:text-6xl">
          ¿Tiene hora en el {sitio.hospital.replace(/^Hospital /, "hospital ").replace(/ de Coquimbo$/, "")}?
        </h1>
        <p className="mt-4 max-w-xl text-xl leading-snug text-white/90">
          Le avisamos antes de su cita, le decimos a qué hora salir y cómo llegar. Sin RUT y sin crear una cuenta.
        </p>
      </div>
    </section>
  );

  const opciones = [
    {
      href: "/recordatorio", titulo: "Recordar mi hora", detalle: `Le avisamos por ${textoCanales()} y le recordamos qué llevar.`,
      icono: <IconoCampana />, estilo: "bg-sol text-ink border-sol hover:bg-[#FFD15F]", iconoEstilo: "bg-azul-dark text-sol",
    },
    {
      href: "/como-llegar", titulo: "Cómo llegar y a qué hora salir", detalle: "Micro, colectivo o bus desde su casa.",
      icono: <IconoBus />, estilo: "bg-white border-azul hover:bg-azul-soft", iconoEstilo: "bg-azul text-white",
    },
    {
      href: "/informacion", titulo: "Cancelar, cambiar o consultar", detalle: "Teléfonos del hospital y qué hacer en cada caso.",
      icono: <IconoFono />, estilo: "bg-white border-azul hover:bg-azul-soft", iconoEstilo: "bg-azul text-white",
    },
  ];

  return (
    <Shell hero={hero}>
      <nav aria-label="Qué quiere hacer" className="-mt-24 grid gap-4">
        {opciones.map((o) => (
          <Link key={o.href} href={o.href}
            className={`flex items-center gap-4 rounded-2xl border-2 p-4 shadow-[0_6px_0_0_#0B2A66] transition-transform active:translate-y-1 active:shadow-[0_2px_0_0_#0B2A66] sm:p-5 ${o.estilo}`}>
            <span className={`inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-xl ${o.iconoEstilo}`}>{o.icono}</span>
            <span className="min-w-0 flex-1">
              <span className="block text-2xl font-bold leading-tight">{o.titulo}</span>
              <span className="mt-1 block text-base leading-snug opacity-80">{o.detalle}</span>
            </span>
            <Flecha className="h-7 w-7 shrink-0" />
          </Link>
        ))}
      </nav>

      <p className="mt-10 rounded-2xl bg-azul-soft px-5 py-4 text-lg">
        ¿La hora es de un familiar? También puede pedir el recordatorio por él o ella: sólo necesita el celular o correo donde quiere recibirlo.
      </p>
    </Shell>
  );
}
