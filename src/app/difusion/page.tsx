import QRCode from "qrcode";
import { appUrl, sitio } from "@/config/sitio";
import { CopyButton, PrintButtonClient } from "./CopyButton";
import { textoCanales } from "@/lib/canales";

export const metadata = { title: "Material para la página del hospital", robots: { index: false } };
export const dynamic = "force-dynamic";

const PREGUNTA = "¿Tiene hora en el hospital?";
const bajada = () => `Le recordamos su cita por ${textoCanales()} y le mostramos cómo llegar en micro, colectivo o bus.`;

/** Banner listo para pegar en el sitio del hospital (estilos en línea, sin dependencias). */
function bannerHtml(url: string) {
  return `<a href="${url}" target="_blank" rel="noopener" style="display:block;max-width:640px;padding:20px 24px;border-radius:14px;background:#1450C8;color:#fff;text-decoration:none;font-family:Arial,Helvetica,sans-serif">
  <span style="display:block;font-size:24px;font-weight:bold;line-height:1.25">${PREGUNTA}</span>
  <span style="display:block;margin-top:6px;font-size:16px;line-height:1.4;color:#E6EFFF">${bajada()}</span>
  <span style="display:inline-block;margin-top:14px;padding:10px 18px;border-radius:8px;background:#FFC233;color:#0F1D3A;font-weight:bold;font-size:16px">Activar recordatorio y ver cómo llegar</span>
</a>`;
}

export default async function Page() {
  const url = `${appUrl()}/?origen=sitio-hospital`;
  const urlQr = `${appUrl()}/?origen=qr`;
  const qr = await QRCode.toString(urlQr, { type: "svg", margin: 1, color: { dark: "#0F1D3A", light: "#FFFFFF" } });
  const html = bannerHtml(url);

  return (
    <main className="mx-auto max-w-4xl px-5 py-8">
      <div className="no-print">
        <h1 className="text-3xl font-bold tracking-tight">Material para la página del hospital</h1>
        <p className="mt-2 max-w-2xl text-ink-soft">
          El área de comunicaciones o TI del hospital pega el código del banner en su sitio. El afiche con código QR se imprime para admisión, salas de espera y box.
        </p>

        <h2 className="mb-3 mt-10 text-2xl font-bold">1. Banner para el sitio web</h2>
        <div className="rounded-xl border border-line bg-white p-6" dangerouslySetInnerHTML={{ __html: html }} />
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-base text-ink-soft">Código para pegar (HTML):</p>
          <CopyButton text={html} />
        </div>
        <pre className="mt-2 max-h-56 overflow-auto rounded-lg bg-ink p-4 text-sm text-white"><code>{html}</code></pre>
        <p className="mt-2 text-base text-ink-soft">Enlace directo, para redes sociales o mensajes: <span className="font-bold break-all">{url}</span></p>

        <h2 className="mb-3 mt-12 text-2xl font-bold">2. Afiche con código QR</h2>
        <p className="mb-4 text-ink-soft">Imprímalo en tamaño carta u oficio desde el botón.</p>
        <PrintButtonClient />
      </div>

      {/* Afiche imprimible */}
      <section className="print-sheet mx-auto mt-6 max-w-[680px] rounded-2xl border-2 border-line bg-white p-10 text-center">
        <p className="text-xl font-bold text-azul">{sitio.hospital}</p>
        <p className="mt-6 text-5xl font-bold leading-tight tracking-tight">{PREGUNTA}</p>
        <p className="mx-auto mt-4 max-w-md text-2xl leading-snug text-ink-soft">Le recordamos su cita y le mostramos cómo llegar.</p>
        <div className="mx-auto mt-8 w-64" dangerouslySetInnerHTML={{ __html: qr }} />
        <p className="mt-4 text-xl font-bold">Escanee con la cámara de su celular</p>
        <p className="mt-6 text-lg text-ink-soft">Aviso por {textoCanales()}. Sin RUT y sin crear cuenta.</p>
      </section>
    </main>
  );
}
