"use client";
import { useEffect } from "react";

/**
 * Tras una acción (crear el recordatorio, avisar que no irá, etc.) la página
 * cambia, pero el navegador puede quedar abajo. Esto lleva la vista al
 * mensaje de resultado y le da el foco, para que el cambio se note.
 */
export function IrA({ id, arriba = false }: { id: string; arriba?: boolean }) {
  useEffect(() => {
    const el = document.getElementById(id);
    if (arriba || !el) window.scrollTo({ top: 0, behavior: "smooth" });
    else el.scrollIntoView({ behavior: "smooth", block: "start" });
    el?.focus({ preventScroll: true });
  }, [id, arriba]);
  return null;
}
