"use client";
import { useEffect, useState } from "react";

/**
 * Un solo botón: abre el calendario propio de cada equipo.
 * - iPhone, iPad y Mac: archivo .ics, que el sistema abre con "Agregar al calendario".
 * - Android y computadores: Google Calendar (el calendario de Android), con el evento ya escrito.
 */
export function AgregarCalendario({ google, ics, className = "" }: { google: string; ics: string; className?: string }) {
  const [apple, setApple] = useState(false);
  useEffect(() => {
    const ua = navigator.userAgent;
    setApple(/iPhone|iPad|iPod|Macintosh/.test(ua) && !/Android/.test(ua));
  }, []);
  return apple
    ? <a href={ics} className={className}>Agregar a mi calendario</a>
    : <a href={google} target="_blank" rel="noopener noreferrer" className={className}>Agregar a mi calendario</a>;
}
