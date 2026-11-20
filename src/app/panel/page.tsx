import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/supabase";
import { ORIGENES } from "@/data/transporte";
import { ocultarContacto } from "@/lib/agenda";
import { formatDateTime } from "@/lib/time";
import { salir } from "./ingresar/actions";
import { COOKIE, credenciales, firmaSesion } from "@/lib/panel-auth";
import { calcular, datosEjemplo, RESULTADOS, type FilaRecordatorio } from "@/lib/indicadores";
import { Dona, Semanas, BarrasH } from "@/components/panel/Graficos";
import { Marca } from "@/components/Shell";

export const metadata = { title: "Panel del hospital", robots: { index: false } };
export const dynamic = "force-dynamic";

const fmtPct = (v: number | null) => (v === null ? "—" : `${Math.round(v * 100)} %`);
const CANAL: Record<string, string> = { whatsapp: "WhatsApp", sms: "SMS", email: "Correo" };
const RANGO: Record<string, string> = { manana: "Mañana", tarde: "Tarde", noche: "Noche" };
const ESTADO: Record<string, string> = { enviado: "Enviado", simulado: "Simulado", fallido: "Falló", omitido: "Omitido", pendiente: "Pendiente" };
const TIPO: Record<string, string> = { confirmacion: "Confirmación", dos_dias: "Aviso 2 días antes", un_dia: "Aviso 1 día antes", mismo_dia: "Aviso del mismo día", post_cita: "Encuesta ¿pudo asistir?" };
const aLista = (o: Record<string, number>, labels: Record<string, string>) =>
  Object.entries(o).map(([k, n]) => ({ label: labels[k] ?? k, n })).sort((a, b) => b.n - a.n);

function Tarjeta({ titulo, children, className = "" }: { titulo: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`min-w-0 rounded-2xl border border-line bg-white p-5 ${className}`}>
      <h2 className="mb-4 text-lg font-bold">{titulo}</h2>
      {children}
    </section>
  );
}

export default async function Panel(props: { searchParams: Promise<{ dias?: string; ejemplo?: string }> }) {
  // Sin sesión válida, a la página de ingreso (la verificación ocurre en el servidor).
  const { usuario, clave } = credenciales();
  const sesion = (await cookies()).get(COOKIE)?.value;
  if (!usuario || !clave || sesion !== (await firmaSesion())) redirect("/panel/ingresar");

  const sp = await props.searchParams;
  const dias = [7, 30, 90].includes(Number(sp.dias)) ? Number(sp.dias) : 30;
  const ejemplo = sp.ejemplo === "1";
  const ahora = new Date();
  const desde = new Date(ahora.getTime() - dias * 86_400_000).toISOString();
  const sb = db();

  const [{ data: recs }, { data: msgs }, { data: consultas }, { data: visitas }, { data: ultimos }] = await Promise.all([
    ejemplo ? Promise.resolve({ data: null }) : sb.from("recordatorios").select("*").or(`creado_en.gte.${desde},cita_en.gte.${desde}`),
    sb.from("mensajes").select("estado").gte("enviar_en", desde).lte("enviar_en", ahora.toISOString()),
    sb.from("consultas_transporte").select("origen").gte("creado_en", desde),
    sb.from("visitas").select("fuente").gte("creado_en", desde),
    sb.from("mensajes").select("tipo, estado, cuerpo, error, enviado_en, recordatorio:recordatorios(canal, contacto)").neq("estado", "pendiente").order("enviado_en", { ascending: false }).limit(15),
  ]);
  const filas: FilaRecordatorio[] = ejemplo ? datosEjemplo(ahora) : ((recs ?? []) as FilaRecordatorio[]);
  const k = calcular(filas, ahora, dias);
  const principal = k.motivos[0];
  const enlace = (cambios: Record<string, string | undefined>) => {
    const p = new URLSearchParams({ dias: String(dias), ...(ejemplo ? { ejemplo: "1" } : {}) });
    for (const [c, v] of Object.entries(cambios)) v === undefined ? p.delete(c) : p.set(c, v);
    return `/panel?${p.toString()}`;
  };
  const nombreOrigen: Record<string, string> = { direccion: "Dirección escrita", ...Object.fromEntries(ORIGENES.map((o) => [o.id, o.nombre])) };
  const fuentes = aLista((visitas ?? []).reduce<Record<string, number>>((a, v) => ((a[v.fuente] = (a[v.fuente] ?? 0) + 1), a), {}),
    { "sitio-hospital": "Banner del sitio del hospital", qr: "Afiche con código QR", sms: "Link del SMS de citación", otro: "Otro" });

  const kpis = [
    { t: "Asistencia", v: fmtPct(k.tasaAsistencia), d: `${k.n.asistio} de ${k.n.asistio + k.n.no_asistio} personas que respondieron la encuesta` },
    { t: "No asistieron o avisaron", v: String(k.faltaron), d: `${k.n.no_asistio} no fueron y ${k.n.aviso} avisaron antes`, alerta: true },
    { t: "Respondieron la encuesta", v: fmtPct(k.tasaRespuesta), d: `${k.citas - k.n.sin_respuesta} de ${k.citas} citas ya ocurridas` },
    { t: "Recordatorios creados", v: String(k.creados), d: `${k.proximas} citas próximas con avisos activos` },
  ];

  return (
    <div className="min-h-screen bg-mist">
      <header className="bg-azul-dark text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div className="flex items-center gap-3">
            <Marca />
            <div>
              <p className="text-lg font-bold leading-tight">Panel del hospital</p>
              <p className="text-sm text-white/75">Inasistencia a horas confirmadas</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <nav aria-label="Período" className="flex rounded-full bg-white/10 p-1">
              {[7, 30, 90].map((d) => (
                <Link key={d} href={enlace({ dias: String(d) })} aria-current={d === dias ? "page" : undefined}
                  className={`rounded-full px-3 py-1.5 font-bold ${d === dias ? "bg-sol text-ink" : "text-white hover:bg-white/10"}`}>{d} días</Link>
              ))}
            </nav>
            <Link href={enlace({ ejemplo: ejemplo ? undefined : "1" })} className="rounded-full border border-white/40 px-3 py-1.5 font-bold hover:border-sol hover:text-sol">
              {ejemplo ? "Ver datos reales" : "Ver con datos de ejemplo"}
            </Link>
            {!ejemplo && <a href={`/panel/exportar?dias=${dias}`} className="rounded-full border border-white/40 px-3 py-1.5 font-bold hover:border-sol hover:text-sol">Descargar Excel (CSV)</a>}
            <form action={salir}><button className="px-2 py-1.5 font-bold text-white/80 underline-offset-4 hover:underline">Salir</button></form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8 text-base">
        {ejemplo && (
          <p role="status" className="mb-6 rounded-xl border-2 border-sol bg-sol-soft px-4 py-3">
            <strong>Datos de ejemplo, no son pacientes reales.</strong> Los motivos siguen las proporciones de la encuesta del proyecto (n = 57), para mostrar cómo se verá el panel con uso real.
          </p>
        )}

        {/* La conclusión, en una frase */}
        <section className="mb-8">
          <h1 className="max-w-4xl text-2xl font-bold leading-snug tracking-tight sm:text-3xl">
            {k.citas === 0
              ? `Aún no hay citas ocurridas en los últimos ${dias} días.`
              : <>En los últimos {dias} días, {k.faltaron} de {k.citas} personas con hora no asistieron o avisaron que no irían{principal ? <>. La causa más frecuente: <span className="underline decoration-sol decoration-4 underline-offset-4">{principal.label.toLowerCase()}</span> ({fmtPct(principal.n / k.totalMotivos)} de los motivos).</> : "."}</>}
          </h1>
          {k.citas === 0 && <p className="mt-2 text-ink-soft">Los datos aparecen cuando los pacientes responden la encuesta «¿Pudo asistir?», que se envía 3 horas después de cada cita. Mientras tanto, puede ver el panel con datos de ejemplo.</p>}
        </section>

        <dl className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((x) => (
            <div key={x.t} className={`rounded-2xl border bg-white p-5 ${x.alerta ? "border-[#C4321F]/40" : "border-line"}`}>
              <dt className="text-sm font-bold text-ink-soft">{x.t}</dt>
              <dd className={`mt-1 text-4xl font-bold tabular-nums tracking-tight ${x.alerta ? "text-[#A52818]" : "text-azul-dark"}`}>{x.v}</dd>
              <dd className="mt-1 text-sm text-ink-soft">{x.d}</dd>
            </div>
          ))}
        </dl>

        <div className="grid gap-6 lg:grid-cols-5">
          <Tarjeta titulo="¿Qué pasó con las citas?" className="lg:col-span-2">
            <Dona n={k.n} centro={fmtPct(k.citas ? k.faltaron / k.citas : null)} subtitulo="no asistieron" />
            <p className="mt-4 text-sm text-ink-soft">Al centro: quienes no asistieron o avisaron que no irían, sobre {k.citas} citas. La asistencia de arriba se calcula sobre quienes respondieron la encuesta.</p>
          </Tarjeta>
          <Tarjeta titulo="Citas por semana" className="lg:col-span-3">
            <Semanas semanas={k.semanas} />
          </Tarjeta>

          <Tarjeta titulo="¿Por qué no asisten? Y qué puede hacer el hospital" className="lg:col-span-5">
            <p className="-mt-2 mb-5 text-sm text-ink-soft">
              {k.totalMotivos} respuestas con motivo: personas que avisaron antes de su hora y personas que respondieron después que no fueron.
            </p>
            {k.motivos.length === 0 ? <p className="text-ink-soft">Sin respuestas con motivo en este período.</p> : (
              <div className="grid gap-x-10 gap-y-6 lg:grid-cols-2">
                <BarrasH total={k.totalMotivos} items={k.motivos.map((m) => ({ label: m.label, n: m.n, detalle: `Avisaron antes: ${m.antes}. No fueron: ${m.despues}.` }))} />
                <div>
                  <h3 className="mb-3 font-bold">Acciones sugeridas para las causas principales</h3>
                  <ol className="space-y-3">
                    {k.motivos.slice(0, 4).map((m, i) => (
                      <li key={m.motivo} className="flex gap-3 rounded-xl bg-azul-soft p-3">
                        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-azul-dark text-sm font-bold text-white">{i + 1}</span>
                        <div><p className="font-bold">{m.label}</p><p className="text-sm">{m.accion}</p></div>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            )}
          </Tarjeta>

          <Tarjeta titulo="Inasistencia por especialidad" className="lg:col-span-3">
            {k.porEspecialidad.length === 0 ? <p className="text-ink-soft">Sin registros aún.</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-ink-soft">
                      <th className="py-2 pr-3 font-bold">Especialidad</th>
                      <th className="py-2 pr-3 text-right font-bold">Citas</th>
                      <th className="py-2 pr-3 text-right font-bold">Faltaron</th>
                      <th className="py-2 pr-3 font-bold">Inasistencia</th>
                      <th className="hidden py-2 font-bold sm:table-cell">Motivo principal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {k.porEspecialidad.slice(0, 10).map((e) => (
                      <tr key={e.nombre} className="border-b border-line last:border-0">
                        <td className="py-2 pr-3 font-bold">{e.nombre}</td>
                        <td className="py-2 pr-3 text-right tabular-nums">{e.citas}</td>
                        <td className="py-2 pr-3 text-right tabular-nums">{e.faltaron}</td>
                        <td className="py-2 pr-3">
                          <div className="flex items-center gap-2">
                            <span className="hidden h-2 w-16 rounded-r sm:block bg-[#EEF2F8]"><span className="block h-2 rounded-r" style={{ width: `${(e.tasa ?? 0) * 100}%`, background: RESULTADOS.no_asistio.color }} /></span>
                            <span className="whitespace-nowrap tabular-nums">{fmtPct(e.tasa)}</span>
                          </div>
                        </td>
                        <td className="hidden py-2 text-ink-soft sm:table-cell">{e.motivo ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Tarjeta>

          <Tarjeta titulo="Lo que dicen los pacientes" className="lg:col-span-2">
            {k.comentarios.length === 0 ? <p className="text-ink-soft">Sin comentarios en este período.</p> : (
              <ul className="space-y-3">
                {k.comentarios.map((c, i) => (
                  <li key={i} className="border-l-4 border-sol pl-3">
                    <p>“{c.texto}”</p>
                    <p className="text-sm text-ink-soft">{c.motivo}, {c.cuando === "aviso" ? "avisó antes" : "no fue"}</p>
                  </li>
                ))}
              </ul>
            )}
          </Tarjeta>
        </div>

        {!ejemplo && (<>
        <h2 className="mb-4 mt-10 text-xl font-bold">Uso de la página</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Tarjeta titulo="Horario de los avisos"><BarrasH total={k.creados} items={aLista(k.rango, RANGO)} /></Tarjeta>
          <Tarjeta titulo="Cómo llegaron a la página"><BarrasH total={fuentes.reduce((s, x) => s + x.n, 0)} formato="n" items={fuentes} /></Tarjeta>
          <Tarjeta titulo="Consultas de transporte"><BarrasH total={(consultas ?? []).length} formato="n" items={aLista((consultas ?? []).reduce<Record<string, number>>((a, c) => ((a[c.origen] = (a[c.origen] ?? 0) + 1), a), {}), nombreOrigen).slice(0, 6)} /></Tarjeta>
          <Tarjeta titulo="Avisos enviados">
            <BarrasH total={(msgs ?? []).length} formato="n" items={aLista((msgs ?? []).reduce<Record<string, number>>((a, m) => ((a[m.estado] = (a[m.estado] ?? 0) + 1), a), {}), ESTADO)} />
            <p className="mt-4 text-sm text-ink-soft">Medio: {aLista(k.canal, CANAL).map((x) => `${x.label} ${x.n}`).join(", ") || "—"}. Con «qué llevar»: {k.conLlevar}. Desde el SMS: {k.desdeSms}.</p>
          </Tarjeta>
        </div>

        <details className="mt-10 rounded-2xl border border-line bg-white">
          <summary className="cursor-pointer list-none px-5 py-4 font-bold">Últimos mensajes enviados</summary>
          <div className="border-t border-line px-5 py-4">
            {process.env.NOTIFY_PROVIDER !== "twilio" && <p className="mb-3 rounded-lg bg-sol-soft px-4 py-2 text-sm">WhatsApp y SMS no están activos: la página avisa por correo. Se activan con la versión avanzada (ver presupuesto).</p>}
            <ul className="space-y-2">
              {(ultimos ?? []).map((x: any, i: number) => (
                <li key={i} className="rounded-xl border border-line p-3">
                  <p className="text-sm text-ink-soft">{TIPO[x.tipo] ?? x.tipo} por {CANAL[x.recordatorio?.canal] ?? "?"} a {x.recordatorio ? ocultarContacto(x.recordatorio.contacto) : "?"}, {x.enviado_en ? formatDateTime(x.enviado_en) : ""}: <strong>{ESTADO[x.estado]}</strong>{x.error ? ` (${x.error})` : ""}</p>
                  {x.cuerpo && <p className="mt-1 whitespace-pre-line text-sm">{x.cuerpo.replace(/\/r\/[^\s]+/g, "/r/…")}</p>}
                </li>
              ))}
            </ul>
          </div>
        </details>
        </>)}
      </main>
    </div>
  );
}
