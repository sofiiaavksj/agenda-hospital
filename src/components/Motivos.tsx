import { MOTIVOS, type Motivo } from "@/lib/motivos";

/** Lista de motivos con comentario opcional, para "No podré ir" y "No pude ir". */
export function CamposMotivo({ opciones, pregunta }: { opciones: Motivo[]; pregunta: string }) {
  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 font-bold">{pregunta}</legend>
      {opciones.map((m) => (
        <label key={m} className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-line bg-white px-4 py-3 has-[:checked]:border-pine has-[:checked]:bg-pine-soft">
          <input type="radio" name="motivo" value={m} required className="h-5 w-5 accent-pine" /> {MOTIVOS[m]}
        </label>
      ))}
      <label className="block pt-2"><span className="label">Comentario <span className="font-normal text-ink-soft">(opcional)</span></span>
        <textarea name="comentario" rows={2} maxLength={300} className="field" /></label>
    </fieldset>
  );
}
