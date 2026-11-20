import Link from "next/link";
import { Shell } from "@/components/Shell";
import { BotonesLlamar } from "@/components/Telefonos";
import { EMERGENCIAS, formatoTelefono, enlaceLlamar } from "@/data/contactos";
import { HOSPITAL } from "@/data/transporte";
import { sitio } from "@/config/sitio";

export const metadata = { title: "Teléfonos y ayuda" };

/** Preguntas frecuentes: cada una dice qué hacer, en una o dos frases. */
const PREGUNTAS = [
  {
    p: "Quiero cancelar mi hora",
    r: "Llame al hospital al número que corresponda a su hora (nueva o control). Avisar con tiempo permite que otro paciente use esa hora.",
  },
  {
    p: "Quiero cambiar mi hora a otro día",
    r: "Llame al mismo número de su hora y pida una nueva fecha. Si ya tenía un recordatorio aquí, anúlelo desde el enlace que le llegó y cree uno nuevo con la fecha nueva.",
  },
  {
    p: "No sé si mi hora es nueva o de control",
    r: "Es nueva si es la primera vez que la atienden en esa especialidad. Si ya fue antes y le dieron otra hora para seguir, es de control (repetida).",
  },
  {
    p: "Tengo una duda sobre mi atención",
    r: "Llame al número de su tipo de hora. Para dudas de salud fuera del horario del hospital, puede llamar a Salud Responde.",
  },
  {
    p: "¿Qué llevo el día de mi hora?",
    r: "Su cédula de identidad y lo que le hayan pedido: resultados de exámenes, orden médica o sus medicamentos. Al crear su recordatorio puede anotar qué llevar y se lo recordamos.",
  },
];

export default function Page() {
  return (
    <Shell back={{ href: "/", label: "Inicio" }}>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Teléfonos y ayuda</h1>
      <p className="mt-2 text-lg text-ink-soft">
        Para cancelar, cambiar o consultar por su hora, llame al {sitio.hospital}. Toque un número para llamar.
      </p>

      <section className="mt-6">
        <BotonesLlamar />
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-2xl font-bold">¿Qué necesita hacer?</h2>
        <div className="grid gap-3">
          {PREGUNTAS.map((x) => (
            <details key={x.p} className="group rounded-2xl border-2 border-line bg-white open:border-azul">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-lg font-bold">
                {x.p}
                <span aria-hidden className="text-2xl text-azul transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="border-t border-line px-5 py-4">{x.r}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-10 rounded-2xl bg-azul-dark p-5 text-white">
        <h2 className="text-xl font-bold">Dirección del hospital</h2>
        <p className="mt-1 text-white/85">{HOSPITAL.direccion}.</p>
        <Link href="/como-llegar" className="mt-4 inline-flex rounded-xl bg-sol px-5 py-3 font-bold text-ink hover:bg-white">Ver cómo llegar</Link>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-xl font-bold">En una emergencia</h2>
        <ul className="divide-y divide-line rounded-2xl border border-line bg-white">
          {EMERGENCIAS.map((e) => (
            <li key={e.numero} className="flex items-center justify-between gap-3 px-5 py-3">
              <span>{e.titulo}</span>
              <a href={enlaceLlamar(e.numero)} className="link whitespace-nowrap text-lg">{formatoTelefono(e.numero)}</a>
            </li>
          ))}
        </ul>
      </section>
    </Shell>
  );
}
