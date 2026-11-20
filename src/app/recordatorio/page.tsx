import { Shell } from "@/components/Shell";
import { Formulario } from "./Formulario";
import { AVISOS, RANGOS } from "@/lib/agenda";
import { origenPorId } from "@/data/transporte";
import { ESPECIALIDADES } from "@/data/especialidades";
import { chileDateKey, formatDateLong, fromChileLocal } from "@/lib/time";
import { leerPrellenado, hayPrellenado } from "@/lib/prellenado";
import { canalesActivos } from "@/lib/canales";

export const metadata = { title: "Recordatorio de mi hora", referrer: "no-referrer" };
export const dynamic = "force-dynamic";

export default async function Page(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await props.searchParams;
  const leido = leerPrellenado(sp);
  // "CARDIOLOGIA" del SMS se reconoce como "Cardiología" de la lista (sin importar tildes ni mayúsculas).
  const sinTildes = (x: string) => x.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  const canonica = leido.especialidad && ESPECIALIDADES.find((e) => sinTildes(e) === sinTildes(leido.especialidad!));
  const inicial = canonica ? { ...leido, especialidad: canonica } : leido;
  const desdeSms = hayPrellenado(inicial) || sp.fuente === "sms";
  // Desde la guía de un sector se sugiere ese sector como punto de partida.
  const sector = typeof sp.origen === "string" ? origenPorId(sp.origen) : undefined;
  const direccionInicial = sector ? `${sector.nombre.split(" (")[0].split(" /")[0]}, ${sector.grupo === "Otras comunas" ? "Región de Coquimbo" : sector.grupo}` : undefined;
  const fechaVencida = inicial.fecha && inicial.hora && fromChileLocal(`${inicial.fecha}T${inicial.hora}`).getTime() < Date.now();

  return (
    <Shell back={{ href: "/", label: "Volver" }}>
      <h1 className="text-3xl font-bold tracking-tight">
        {inicial.nombre ? `${inicial.nombre}, activemos su recordatorio` : "Recordatorio de su hora"}
      </h1>
      {desdeSms && inicial.fecha && !fechaVencida ? (
        <div className="mb-8 mt-4 rounded-xl border-2 border-azul bg-azul-soft p-4">
          <p className="font-bold text-azul">Ya completamos los datos de su hora{inicial.hora ? ` del ${formatDateLong(fromChileLocal(`${inicial.fecha}T${inicial.hora}`))} a las ${inicial.hora}` : ""}.</p>
          <p className="mt-1">Revíselos, elija cómo quiere que le avisemos y presione el botón del final.</p>
        </div>
      ) : (
        <p className="mb-8 mt-2 text-ink-soft">Complete los datos de la hora que le dio el hospital. Toma un minuto.</p>
      )}
      {fechaVencida && (
        <p className="mb-6 rounded-lg border border-sol bg-sol-soft px-4 py-3">La fecha que venía en el mensaje ya pasó. Si tiene una hora nueva, ingrese la fecha y hora correctas.</p>
      )}
      <Formulario
        hoy={chileDateKey(new Date())}
        especialidades={ESPECIALIDADES}
        rangos={Object.entries(RANGOS).map(([value, r]) => ({ value, label: r.label }))}
        avisos={Object.entries(AVISOS).map(([value, label]) => ({ value, label }))}
        inicial={fechaVencida ? { ...inicial, fecha: undefined, hora: undefined } : inicial}
        direccionInicial={direccionInicial}
        fuente={desdeSms ? "sms" : "web"}
        canales={canalesActivos()}
      />
    </Shell>
  );
}
