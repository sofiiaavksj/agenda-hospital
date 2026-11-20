import { telefonosActivos, formatoTelefono, enlaceLlamar } from "@/data/contactos";

/** Botones grandes para llamar al hospital, con el motivo de cada número. */
export function BotonesLlamar({ compacto = false }: { compacto?: boolean }) {
  const tels = telefonosActivos();
  return (
    <ul className="grid gap-3">
      {tels.map((t) => (
        <li key={t.id}>
          <a href={enlaceLlamar(t.numero)}
            className="flex items-center gap-4 rounded-2xl border-2 border-azul bg-white p-4 hover:bg-azul-soft">
            <IconoTelefono />
            <span className="min-w-0 flex-1">
              <span className="block font-bold">{t.titulo}</span>
              <span className="block text-2xl font-bold tracking-tight text-azul">{formatoTelefono(t.numero)}</span>
              {!compacto && <span className="mt-1 block text-base text-ink-soft">{t.cuando}{t.horario ? ` Horario: ${t.horario}.` : ""}</span>}
            </span>
            <span className="hidden rounded-full bg-azul px-4 py-2 font-bold text-white sm:inline">Llamar</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

export function IconoTelefono({ className = "h-12 w-12" }: { className?: string }) {
  return (
    <span aria-hidden className={`inline-flex shrink-0 items-center justify-center rounded-xl bg-azul text-white ${className}`}>
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
        <path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z" />
      </svg>
    </span>
  );
}
