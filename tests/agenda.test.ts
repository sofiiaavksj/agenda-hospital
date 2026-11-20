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

import { sugerenciasDesdePhoton, numeroEn } from "@/lib/direcciones";

describe("buscador de direcciones", () => {
  const photon = {
    features: [
      { properties: { type: "street", name: "Avenida Costanera", city: "Coquimbo", district: "Centro" }, geometry: { coordinates: [-71.33, -29.97] as [number, number] } },
      { properties: { type: "house", name: "Mallplaza La Serena", street: "Avenida Alberto Solari", housenumber: "1400", city: "La Serena" }, geometry: { coordinates: [-71.25, -29.91] as [number, number] } },
      { properties: { type: "house", street: "Los Pescadores", housenumber: "1234", city: "Coquimbo" }, geometry: { coordinates: [-71.34, -29.95] as [number, number] } },
      { properties: { type: "street", name: "Avenida Costanera", city: "Coquimbo", district: "Centro" }, geometry: { coordinates: [-71.331, -29.971] as [number, number] } },
    ],
  };
  it("arma títulos legibles y agrega el número escrito a una calle", () => {
    const s = sugerenciasDesdePhoton(photon, "avenida costanera 500");
    expect(s.map((x) => x.titulo)).toEqual(["Avenida Costanera 500", "Mallplaza La Serena", "Los Pescadores 1234"]);
    expect(s[0]).toMatchObject({ detalle: "Centro, Coquimbo", texto: "Avenida Costanera 500, Coquimbo, Chile" });
    expect(s[1]).toMatchObject({ detalle: "Avenida Alberto Solari 1400, La Serena", texto: "Mallplaza La Serena, Avenida Alberto Solari 1400, La Serena, Chile" });
  });
  it("detecta el número de casa y tolera respuestas vacías", () => {
    expect(numeroEn("avenida costanera 500")).toBe("500");
    expect(sugerenciasDesdePhoton({}, "x")).toEqual([]);
  });
});

import { horaSalida, minutosViaje, HOSPITAL_COORD, VIAJE_SIN_DATOS } from "@/lib/salida";
import { leerLlevar, listaLlevar, textoLlevar } from "@/lib/llevar";
import { formatoTelefono, enlaceLlamar, telefonosActivos } from "@/data/contactos";
import { COORD_SECTORES } from "@/data/transporte";

describe("hora recomendada de salida", () => {
  it("resta el viaje y los 20 minutos de admisión", () => {
    expect(horaSalida("08:30", 40)).toEqual({ hora: "07:30", diaAnterior: false });
    expect(horaSalida("00:10", 30)).toEqual({ hora: "23:20", diaAnterior: true });
    expect(horaSalida("25:00", 30)).toBeNull();
    expect(horaSalida("", 30)).toBeNull();
  });
  it("estima más tiempo desde más lejos, en múltiplos de 5", () => {
    const cerca = minutosViaje(COORD_SECTORES["coquimbo-centro"]);
    const lejos = minutosViaje(COORD_SECTORES["la-serena-centro"]);
    expect(cerca).toBeGreaterThanOrEqual(15);
    expect(lejos).toBeGreaterThan(cerca);
    expect(lejos).toBeLessThanOrEqual(90);
    expect(lejos % 5).toBe(0);
    expect(minutosViaje(HOSPITAL_COORD)).toBe(15);
    expect(minutosViaje(null)).toBe(VIAJE_SIN_DATOS);
  });
});

describe("qué llevar", () => {
  it("acepta sólo opciones conocidas más un texto libre", () => {
    expect(leerLlevar(["Resultados de exámenes", "<script>"], "  ir en\nayunas ")).toBe("Resultados de exámenes; Ir en ayunas");
    expect(leerLlevar([], " ")).toBeNull();
  });
  it("siempre recuerda la cédula", () => {
    expect(listaLlevar(null)).toEqual(["Cédula de identidad"]);
    expect(textoLlevar("Resultados de exámenes; Orden médica o interconsulta"))
      .toBe("cédula de identidad, resultados de exámenes y orden médica o interconsulta");
  });
  it("aparece en los avisos", () => {
    const { texto } = redactar("un_dia", { hospital: "Hospital", citaEn: "2026-11-23T11:00:00Z", enlaceGestion: "g", enlaceTransporte: "t", llevar: "Resultados de exámenes" });
    expect(texto).toContain("No olvide: cédula de identidad y resultados de exámenes.");
  });
});

describe("teléfonos del hospital", () => {
  it("formatea y arma el enlace para llamar", () => {
    expect(formatoTelefono("512336855")).toBe("51 233 6855");
    expect(enlaceLlamar("512336855")).toBe("tel:+56512336855");
    expect(formatoTelefono("6003607777")).toBe("600 360 7777");
    expect(enlaceLlamar("131")).toBe("tel:131");
    expect(telefonosActivos().map((t) => t.numero)).toEqual(["512336855", "512336336"]);
  });
});

import { calcular, datosEjemplo, resultado } from "@/lib/indicadores";

describe("indicadores del panel", () => {
  const ahora = new Date("2026-11-20T15:00:00Z");
  const base = { creado_en: "2026-11-01T12:00:00Z", canal: "email", rango: "tarde", especialidad: "Cardiología", anulado_en: null, no_asistira_en: null, asistio: null as boolean | null };
  it("clasifica cada cita en un resultado", () => {
    expect(resultado({ ...base, cita_en: "2026-11-10T12:00:00Z", asistio: true }, ahora)).toBe("asistio");
    expect(resultado({ ...base, cita_en: "2026-11-10T12:00:00Z", asistio: false }, ahora)).toBe("no_asistio");
    expect(resultado({ ...base, cita_en: "2026-11-10T12:00:00Z" }, ahora)).toBe("sin_respuesta");
    expect(resultado({ ...base, cita_en: "2026-11-25T12:00:00Z", no_asistira_en: "2026-11-19T12:00:00Z" }, ahora)).toBe("aviso");
    expect(resultado({ ...base, cita_en: "2026-11-25T12:00:00Z" }, ahora)).toBeNull();
  });
  it("calcula tasas y motivos", () => {
    const k = calcular([
      { ...base, cita_en: "2026-11-10T12:00:00Z", asistio: true },
      { ...base, cita_en: "2026-11-11T12:00:00Z", asistio: true },
      { ...base, cita_en: "2026-11-12T12:00:00Z", asistio: false, motivo: "olvido" },
      { ...base, cita_en: "2026-11-13T12:00:00Z", no_asistira_en: "2026-11-12T12:00:00Z", motivo: "transporte" },
      { ...base, cita_en: "2026-11-14T12:00:00Z" },
    ], ahora, 30);
    expect(k.citas).toBe(5);
    expect(k.tasaAsistencia).toBeCloseTo(2 / 3);
    expect(k.faltaron).toBe(2);
    expect(k.motivos.map((m) => m.motivo).sort()).toEqual(["olvido", "transporte"]);
    expect(k.porEspecialidad[0]).toMatchObject({ nombre: "Cardiología", citas: 5, faltaron: 2 });
    expect(k.semanas.reduce((s, w) => s + w.n.asistio, 0)).toBe(2);
  });
  it("los datos de ejemplo siguen la encuesta: el olvido es la primera causa", () => {
    const k = calcular(datosEjemplo(ahora), ahora, 90);
    expect(k.citas).toBeGreaterThan(100);
    expect(k.motivos[0].motivo).toBe("olvido");
  });
});
