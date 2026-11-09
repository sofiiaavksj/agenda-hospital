import { Form } from "./Form";

export const metadata = { title: "Ingreso al panel", robots: { index: false } };

export default function Page() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-2xl font-bold tracking-tight">Panel del equipo</h1>
        <p className="mb-6 text-ink-soft">Indicadores y mensajes generados por la plataforma.</p>
        <Form />
      </div>
    </main>
  );
}
