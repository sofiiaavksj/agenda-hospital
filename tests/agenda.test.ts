import { describe, it, expect } from "vitest";
import { planificar, normalizarCelular, normalizarCorreo, ocultarContacto } from "@/lib/agenda";
import { ORIGENES, mapsUrl, origenPorId } from "@/data/transporte";
import { redactar } from "@/lib/mensajes";

const fmt = (d: Date) => new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Santiago", dateStyle: "short", timeStyle: "short" }).format(d);

describe("programación de avisos", () => {
  const ahora = new Date("2026-11-09T15:00:00Z"); // lunes 12:00 en Chile
  const cita = new Date("2026-11-13T13:30:00Z");  // viernes 10:30 en Chile

  it("respeta el rango horario y los avisos elegidos", () => {
    const plan = planificar(cita, "noche", ["dos_dias", "un_dia", "mismo_dia"], ahora);
    const m = Object.fromEntries(plan.map((p) => [p.tipo, fmt(p.enviarEn)]));
    expect(m.confirmacion).toBe("2026-11-09 12:00");
    expect(m.dos_dias).toBe("2026-11-11 19:00");
    expect(m.un_dia).toBe("2026-11-12 19:00");
    expect(m.mismo_dia).toBe("2026-11-13 07:30");
    expect(m.post_cita).toBe("2026-11-13 13:30");
  });

  it("el aviso del mismo día no sale antes de las 7:00 ni demasiado cerca de la cita", () => {
    const temprano = new Date("2026-11-13T11:30:00Z"); // 08:30 local
    const p = planificar(temprano, "manana", ["mismo_dia"], ahora).find((x) => x.tipo === "mismo_dia")!;
    expect(fmt(p.enviarEn)).toBe("2026-11-13 07:00");
    const muyTemprano = new Date("2026-11-13T10:30:00Z"); // 07:30 local: no hay tiempo
    expect(planificar(muyTemprano, "manana", ["mismo_dia"], ahora).some((x) => x.tipo === "mismo_dia")).toBe(false);
  });

  it("no programa avisos que ya pasaron", () => {
    const manana = new Date("2026-11-10T14:00:00Z"); // martes 11:00
    const tipos = planificar(manana, "manana", ["dos_dias", "un_dia"], ahora).map((p) => p.tipo);
    expect(tipos).not.toContain("dos_dias");
    expect(tipos).not.toContain("un_dia"); // hoy 09:00 ya pasó
  });

  it("la pregunta posterior a una cita tardía pasa al día siguiente", () => {
    const tarde = new Date("2026-11-13T21:00:00Z"); // 18:00 local
    const p = planificar(tarde, "tarde", [], ahora).find((x) => x.tipo === "post_cita")!;
    expect(fmt(p.enviarEn)).toBe("2026-11-14 10:00");
  });
});

describe("contacto", () => {
  it("acepta celulares chilenos y extranjeros", () => {
    expect(normalizarCelular("9 1234 5678")).toBe("+56912345678");
    expect(normalizarCelular("+56 9 1234-5678")).toBe("+56912345678");
    expect(normalizarCelular("+58 412 1234567")).toBe("+584121234567");
    expect(normalizarCelular("+56 2 2345 6789")).toBeNull(); // teléfono fijo chileno
    expect(normalizarCelular("12345")).toBeNull();
  });
  it("valida correos y oculta datos", () => {
    expect(normalizarCorreo(" Ana@Correo.CL ")).toBe("ana@correo.cl");
    expect(normalizarCorreo("ana@correo")).toBeNull();
    expect(ocultarContacto("+56912345678")).toBe("+569•••••678");
    expect(ocultarContacto("ana@correo.cl")).toBe("an•@correo.cl");
  });
});

describe("guía de transporte", () => {
  it("cada origen tiene id único y al menos una opción con fuente", () => {
    const ids = ORIGENES.map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const o of ORIGENES) {
      expect(o.opciones.length).toBeGreaterThan(0);
      for (const op of o.opciones) expect(op.fuente.length).toBeGreaterThan(0);
    }
    expect(origenPorId("parte-alta")?.nombre).toBe("Parte Alta");
  });
  it("arma el enlace de Google Maps en transporte público", () => {
    expect(mapsUrl()).toContain("travelmode=transit");
    expect(mapsUrl()).not.toContain("origin=");
    expect(mapsUrl("La Serena")).toContain("origin=La+Serena");
  });
});

describe("mensajes", () => {
  it("incluyen enlaces de gestión y transporte", () => {
    const { texto } = redactar("un_dia", {
      hospital: "Hospital San Pablo de Coquimbo", nombre: "Rosa Pérez", citaEn: "2026-11-13T13:30:00Z",
      especialidad: "Cardiología", enlaceGestion: "https://x/r/abc", enlaceTransporte: "https://x/como-llegar/parte-alta",
    });
    expect(texto).toContain("Hola Rosa.");
    expect(texto).toContain("10:30");
    expect(texto).toContain("https://x/como-llegar/parte-alta");
    expect(texto).toContain("https://x/r/abc");
  });
});

import { leerPrellenado, leerFecha, leerHora, suavizarMayusculas } from "@/lib/prellenado";
import { completarDireccion } from "@/data/transporte";
import { googleCalendarUrl } from "@/lib/calendario";
import { MOTIVOS_ANTES, MOTIVOS_DESPUES } from "@/lib/motivos";

describe("link dinámico del SMS", () => {
  it("lee los datos de la planilla del hospital", () => {
    const p = leerPrellenado({
      n: "ROSA ELENA", f: "2026-11-23", h: "08:00", e: "LABORATORIO",
      l: "Presentarse en: ENTRADA POR PUERTA PRINCIPAL, CALLE DR. MOUKARZEL",
    });
    expect(p).toEqual({
      nombre: "Rosa", fecha: "2026-11-23", hora: "08:00", especialidad: "Laboratorio",
      lugar: "Entrada por Puerta Principal, Calle Dr. Moukarzel",
    });
  });
  it("acepta nombres largos y distintos formatos de fecha y hora", () => {
    expect(leerPrellenado({ nombre: "maría", fecha: "23/11/2026", hora: "8:30" })).toMatchObject({ nombre: "María", fecha: "2026-11-23", hora: "08:30" });
    expect(leerFecha("46349")).toBe("2026-11-23");      // número de serie de Excel
    expect(leerHora("0,375")).toBe("09:00");            // fracción de día de Excel
    expect(leerHora("0930")).toBe("09:30");
    expect(leerFecha("31/02/2026")).toBeUndefined();   // fecha imposible
    expect(leerHora("25:00")).toBeUndefined();
  });
  it("ignora datos que no deben venir en el link", () => {
    const p = leerPrellenado({ rut: "12345678-5", telefono: "+56911111111", n: "Ana123" });
    expect(p).toEqual({ nombre: "Ana", fecha: undefined, hora: undefined, especialidad: undefined, lugar: undefined });
  });
  it("no altera textos que no vienen en mayúsculas", () => {
    expect(suavizarMayusculas("Box 4, 2° piso")).toBe("Box 4, 2° piso");
  });
});

describe("cambios del hospital", () => {
  it("completa la dirección con la región si falta la comuna", () => {
    expect(completarDireccion("Los Pescadores 1234")).toBe("Los Pescadores 1234, Región de Coquimbo, Chile");
    expect(completarDireccion("Av. del Mar 500, La Serena")).toBe("Av. del Mar 500, La Serena, Chile");
  });
  it("arma el evento de Google Calendar en hora UTC", () => {
    const url = googleCalendarUrl({ titulo: "Hora médica", inicio: new Date("2026-11-23T11:00:00Z"), lugar: "Hospital", detalle: "Tótem" });
    expect(url).toContain("action=TEMPLATE");
    expect(url).toContain("dates=20261123T110000Z%2F20261123T120000Z");
  });
  it("el olvido sólo se pregunta después de la cita", () => {
    expect(MOTIVOS_ANTES).not.toContain("olvido");
    expect(MOTIVOS_DESPUES).toContain("olvido");
  });
  it("el aviso del día incluye la indicación del tótem", () => {
    const { texto } = redactar("mismo_dia", {
      hospital: "Hospital", citaEn: "2026-11-23T11:00:00Z", enlaceGestion: "g", enlaceTransporte: "t",
      totem: "Al llegar, acérquese al tótem de atención.",
    });
    expect(texto).toContain("tótem de atención");
  });
});
