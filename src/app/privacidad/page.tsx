import { Shell } from "@/components/Shell";

export const metadata = { title: "Cómo usamos sus datos" };

export default function Page() {
  return (
    <Shell back={{ href: "/", label: "Volver" }}>
      <h1 className="text-3xl font-bold tracking-tight">Cómo usamos sus datos</h1>
      <div className="mt-6 space-y-4 leading-relaxed">
        <p>Para enviarle recordatorios guardamos sólo lo que usted escribe o confirma: fecha y hora de la cita, el medio de contacto (celular o correo) y, si los indica, su nombre, la especialidad, el lugar, la dirección desde donde viaja y, si no pudo asistir, el motivo. <strong>No pedimos RUT ni información sobre su salud.</strong></p>
        <p>Si llegó desde el mensaje del hospital, el enlace trae su primer nombre, la fecha, la hora, la especialidad y el lugar para ahorrarle tiempo. Puede corregirlos antes de activar el recordatorio.</p>
        <p>Usamos estos datos únicamente para enviarle los avisos que eligió y para medir, sin identificar a nadie, si el servicio ayuda a que las personas lleguen a sus horas.</p>
        <p>Los datos se borran automáticamente 30 días después de la fecha de la cita. Puede anular los avisos en cualquier momento desde el enlace que recibe en cada mensaje.</p>
        <p>Cuando consulta la guía de transporte no guardamos la dirección que escribe: sólo contamos que hubo una consulta.</p>
        <p>Este servicio no agenda, confirma ni cancela horas en el hospital.</p>
      </div>
    </Shell>
  );
}
