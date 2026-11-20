import Link from "next/link";
import { notFound } from "next/navigation";
import { Shell, Notice } from "@/components/Shell";
import { SubmitButton } from "@/components/SubmitButton";
import { db } from "@/lib/supabase";
import { leerToken } from "@/lib/token";
import { ocultarContacto, RANGOS, type Rango } from "@/lib/agenda";
import { formatDateLong, formatTime, formatDateTime, relativeDays } from "@/lib/time";
import { origenPorId, HOSPITAL } from "@/data/transporte";
import { sitio } from "@/config/sitio";
import { googleCalendarUrl } from "@/lib/calendario";
import { enlaceTransporte } from "@/lib/despacho";
import { CamposMotivo } from "@/components/Motivos";
import { MOTIVOS, MOTIVOS_ANTES, MOTIVOS_DESPUES, esMotivo } from "@/lib/motivos";
import { anular, noPodreIr, responderAsistencia } from "./actions";
import { BotonesLlamar } from "@/components/Telefonos";
import { IrA } from "@/components/IrA";
import { CompartirCita } from "@/components/CompartirCita";
import { appUrl } from "@/config/sitio";
import { IconoBolso } from "@/components/Iconos";
import { listaLlevar, textoLlevar } from "@/lib/llevar";

export const metadata = { title: "Mi recordatorio", referrer: "no-referrer", robots: { index: false } };
export const dynamic = "force-dynamic";

const TIPO: Record<string, string> = {
  confirmacion: "Confirmación de registro", dos_dias: "Aviso 2 días antes", un_dia: "Aviso 1 día antes",
  mismo_dia: "Aviso el mismo día", post_cita: "Pregunta: ¿pudo asistir?",
};
const CANAL: Record<string, string> = { whatsapp: "WhatsApp", sms: "mensaje de texto", email: "correo" };

export default async function Page(props: { params: Promise<{ token: string }>; searchParams: Promise<{ nuevo?: string; aviso?: string; ok?: string }> }) {
  const [params, searchParams] = await Promise.all([props.params, props.searchParams]);
  const id = leerToken(params.token);
  if (!id) notFound();
  const sb = db();
  const [{ data: r }, { data: msgs }] = await Promise.all([
    sb.from("recordatorios").select("*").eq("id", id).maybeSingle(),
    sb.from("mensajes").select("tipo, enviar_en, estado").eq("recordatorio_id", id).order("enviar_en"),
  ]);
  if (!r) {
    return <Shell><h1 className="text-2xl font-bold">Este recordatorio ya no existe</h1><p className="mt-2 text-ink-soft">Los datos se borran 30 días después de la cita.</p><Link href="/recordatorio" className="btn-primary mt-6">Crear un recordatorio</Link></Shell>;
  }
  const pasada = new Date(r.cita_en) <= new Date();
  const origen = r.origen ? origenPorId(r.origen) : undefined;
  const hidden = <input type="hidden" name="token" value={params.token} />;
  const rutaLlegar = enlaceTransporte("", r);
  const calendarioGoogle = googleCalendarUrl({
    titulo: `Hora médica${r.especialidad ? `: ${r.especialidad}` : ""}`,
    inicio: new Date(r.cita_en),
    lugar: `${sitio.hospital}, ${HOSPITAL.direccion}`,
    detalle: [r.lugar && `Lugar: ${r.lugar}.`, sitio.totem, `No olvide: ${textoLlevar(r.llevar)}.`, "Llegue 20 minutos antes."].filter(Boolean).join("\n"),
  });

  return (
    <Shell>
      {(searchParams.nuevo || searchParams.ok || searchParams.aviso) && (
        <IrA key={`${searchParams.nuevo}${searchParams.ok}${searchParams.aviso}`} id={searchParams.aviso ? "aviso" : "resultado"} arriba={!searchParams.aviso} />
      )}
      <div id="resultado" tabIndex={-1} className="scroll-mt-4 outline-none">
      {searchParams.nuevo && (
          <Notice ok={`Listo. Le enviamos una confirmación por ${CANAL[r.canal]} a ${ocultarContacto(r.contacto)}. Guarde ese mensaje: trae el enlace a esta página.`} />
        )}
        <Notice ok={searchParams.ok} />
      </div>

      <div className="flex overflow-hidden rounded-2xl border border-line bg-white">
        <div className="min-w-0 flex-1 p-5 sm:p-7">
          <p className="text-lg font-bold text-azul">{r.especialidad ?? "Hora médica"}</p>
          <p className="mt-3 text-xl first-letter:uppercase">{formatDateLong(r.cita_en)}</p>
          <p className="text-6xl font-bold leading-none tracking-tight sm:text-7xl">{formatTime(r.cita_en)}</p>
          <p className="mt-4 text-ink-soft">{sitio.hospital}{r.lugar && <><br />{r.lugar}</>}</p>
        </div>
        <div className={`flex w-28 shrink-0 flex-col items-center justify-center gap-1 border-l-2 border-dashed border-line p-3 text-center sm:w-36 ${
          r.anulado_en || r.no_asistira_en ? "bg-zinc-100 text-zinc-600" : "bg-azul-soft text-azul"}`}>
          <span className="text-lg font-bold leading-tight">{r.anulado_en ? "Avisos anulados" : r.no_asistira_en ? "No asistirá" : pasada ? "Cita pasada" : "Avisos activos"}</span>
          {!pasada && <span className="text-base first-letter:uppercase">{relativeDays(r.cita_en)}</span>}
        </div>
      </div>

      {/* Indicación al llegar (tótem) */}
      {!pasada && !r.anulado_en && !r.no_asistira_en && sitio.totem && (
        <section className="mt-6 flex items-start gap-4 rounded-2xl border-2 border-sol bg-sol-soft p-5">
          <span aria-hidden className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ink text-xl font-bold text-white">i</span>
          <div>
            <h2 className="text-xl font-bold">Al llegar al hospital</h2>
            <p className="mt-1">{sitio.totem}</p>
          </div>
        </section>
      )}

      {/* Qué llevar */}
      {!pasada && !r.anulado_en && !r.no_asistira_en && (
        <section className="mt-6 rounded-2xl border-2 border-azul bg-white p-5">
          <h2 className="flex items-center gap-3 text-xl font-bold">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-azul text-white"><IconoBolso className="h-6 w-6" /></span>
            No olvide llevar
          </h2>
          <ul className="mt-3 space-y-2">
            {listaLlevar(r.llevar).map((x) => (
              <li key={x} className="flex items-start gap-3 text-lg">
                <span aria-hidden className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 border-azul text-sm font-bold text-azul">✓</span>
                {x}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Después de la cita */}
      {pasada && !r.no_asistira_en && (
        <section className="mt-8 rounded-2xl border-2 border-azul bg-white p-5">
          {r.asistio === null ? (
            <>
              <h2 className="text-2xl font-bold">¿Pudo asistir a su hora?</h2>
              <form action={responderAsistencia} className="mt-4">{hidden}<input type="hidden" name="asistio" value="1" /><SubmitButton className="btn-primary w-full py-4 text-lg">Sí, asistí</SubmitButton></form>
              <details className="mt-3 rounded-xl border-2 border-line bg-white">
                <summary className="cursor-pointer list-none px-5 py-4 text-center text-lg font-bold">No pude ir</summary>
                <form action={responderAsistencia} className="space-y-4 border-t border-line px-5 py-4">
                  {hidden}<input type="hidden" name="asistio" value="0" />
                  <CamposMotivo opciones={MOTIVOS_DESPUES} pregunta="¿Qué le impidió asistir?" />
                  <SubmitButton className="btn-primary w-full py-3">Enviar respuesta</SubmitButton>
                </form>
              </details>
            </>
          ) : (
            <p className="text-lg font-bold">
              Gracias. Registramos que {r.asistio ? "asistió" : "no pudo asistir"}{!r.asistio && esMotivo(r.motivo) ? ` (${MOTIVOS[r.motivo as keyof typeof MOTIVOS].toLowerCase()})` : ""}.
            </p>
          )}
        </section>
      )}

      {/* "No podré ir": la plataforma no puede liberar la hora; orienta a llamar al hospital. */}
      {(searchParams.aviso || r.no_asistira_en) && !pasada && (
        <section id="aviso" tabIndex={-1} className="mt-8 scroll-mt-4 rounded-2xl border-2 border-sol bg-sol-soft p-5 outline-none">
          <h2 className="text-2xl font-bold">Avise al hospital para liberar su hora</h2>
          <p className="mt-2">Ya no le enviaremos recordatorios. Para que otro paciente pueda usar su hora, llame al hospital al número que corresponda a su hora:</p>
          <div className="mt-4"><BotonesLlamar compacto /></div>
        </section>
      )}

      {!pasada && !r.anulado_en && !r.no_asistira_en && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <a href={calendarioGoogle} target="_blank" rel="noopener noreferrer" className="btn-primary py-4">Agregar a Google Calendar</a>
          <a href={`/r/${params.token}/calendario`} className="btn-secondary py-4">Calendario del celular (iPhone u otro)</a>
          <Link href={rutaLlegar} className="btn-secondary py-4 sm:col-span-2">
            Cómo llegar y a qué hora salir{r.direccion_origen ? ` desde ${r.direccion_origen}` : origen ? ` desde ${origen.nombre}` : ""}
          </Link>
        </div>
      )}

      {!pasada && !r.anulado_en && !r.no_asistira_en && (
        <CompartirCita datos={{
          nombre: r.nombre, citaEn: r.cita_en, especialidad: r.especialidad, lugar: r.lugar, llevar: r.llevar,
          hospital: sitio.hospital, totem: sitio.totem,
          enlaceLlegar: `${appUrl()}/como-llegar?hora=${encodeURIComponent(formatTime(r.cita_en))}`,
        }} />
      )}

      {/* Avisos programados */}
      {!r.anulado_en && (
        <section className="mt-10">
          <h2 className="mb-3 text-xl font-bold">Avisos por {CANAL[r.canal]} a {ocultarContacto(r.contacto)}</h2>
          <ul className="divide-y divide-line rounded-xl border border-line bg-white">
            {(msgs ?? []).map((m: any) => (
              <li key={m.tipo} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <span>{TIPO[m.tipo]}</span>
                <span className="text-base text-ink-soft">
                  {m.estado === "pendiente" ? `Programado: ${formatDateTime(m.enviar_en)}` : m.estado === "omitido" ? "No se enviará" : m.estado === "fallido" ? "No se pudo enviar" : "Enviado"}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-base text-ink-soft">Horario elegido: {RANGOS[r.rango as Rango].label.toLowerCase()}.</p>
        </section>
      )}

      {!pasada && !r.anulado_en && (
        <section className="mt-10 space-y-3">
          {!r.no_asistira_en && (
            <details className="rounded-xl border-2 border-line bg-white">
              <summary className="cursor-pointer list-none px-5 py-4 text-center text-lg font-bold">No podré ir a esta hora</summary>
              <form action={noPodreIr} className="space-y-4 border-t border-line px-5 py-4">
                {hidden}
                <CamposMotivo opciones={MOTIVOS_ANTES} pregunta="¿Por qué no podrá asistir?" />
                <SubmitButton className="btn-primary w-full py-3">Avisar que no podré ir</SubmitButton>
              </form>
            </details>
          )}
          <details className="rounded-xl border border-line bg-white">
            <summary className="cursor-pointer list-none px-5 py-4 font-bold">Anular los avisos</summary>
            <form action={anular} className="border-t border-line px-5 py-4">
              {hidden}
              <p className="mb-3 text-ink-soft">No le enviaremos más mensajes sobre esta hora. Esto no cancela su hora en el hospital.</p>
              <SubmitButton className="btn-danger">Anular avisos</SubmitButton>
            </form>
          </details>
          <p className="pt-2 text-base text-ink-soft">¿Necesita cancelar o cambiar su hora? <Link href="/informacion" className="link">Vea los teléfonos del hospital</Link>. Si la fecha cambió, anule estos avisos y <Link href="/recordatorio" className="link">cree un recordatorio nuevo</Link>.</p>
        </section>
      )}
    </Shell>
  );
}
