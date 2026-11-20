import Link from "next/link";
import { sitio } from "@/config/sitio";

/** Marca: cruz de señalética dentro de un cuadrado azul. */
export function Marca({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={className}>
      <rect width="32" height="32" rx="8" fill="#FFC233" />
      <path d="M13 7h6v6h6v6h-6v6h-6v-6H7v-6h6z" fill="#0B2A66" />
    </svg>
  );
}

/** Marco común de las páginas públicas: franja azul con la marca y acceso a teléfonos. */
export function Shell({ children, back, hero }: { children: React.ReactNode; back?: { href: string; label: string }; hero?: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="no-print bg-azul-dark text-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3 sm:px-5">
          <Link href="/" className="flex min-w-0 items-center gap-3 font-bold leading-tight">
            <Marca />
            <span className="truncate sm:hidden">{sitio.hospital.replace(/ de Coquimbo$/, "")}</span>
            <span className="hidden truncate sm:inline">{sitio.hospital}</span>
          </Link>
          <Link href="/informacion" className="shrink-0 rounded-full border-2 border-white/40 px-3 py-1.5 text-base font-bold hover:border-sol hover:text-sol">
            Teléfonos
          </Link>
        </div>
      </header>
      {hero}
      {back && (
        <div className="no-print mx-auto w-full max-w-2xl px-4 pt-5 sm:px-5">
          <Link href={back.href} className="link text-base">‹ {back.label}</Link>
        </div>
      )}
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-5 sm:py-8">{children}</main>
      <footer className="no-print border-t border-line bg-white">
        <div className="mx-auto max-w-2xl px-4 py-5 text-base text-ink-soft sm:px-5">
          Este servicio no agenda, cancela ni cambia horas médicas. Para eso, llame al hospital:{" "}
          <Link href="/informacion" className="link">Teléfonos y ayuda</Link>.{" "}
          <Link href="/privacidad" className="link">Cómo usamos sus datos</Link>
        </div>
      </footer>
    </div>
  );
}

export function Notice({ ok, error }: { ok?: string; error?: string }) {
  if (!ok && !error) return null;
  return (
    <div role={error ? "alert" : "status"}
      className={`mb-6 rounded-lg border px-4 py-3 font-bold ${error ? "border-risk-alto/30 bg-red-50 text-risk-alto" : "border-risk-bajo/30 bg-emerald-50 text-risk-bajo"}`}>
      {error ?? ok}
    </div>
  );
}
