/** Pictogramas de señalética, trazo grueso para que se lean a cualquier edad. */
const base = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };

export const IconoCampana = ({ className = "h-8 w-8" }) => (
  <svg {...base} className={className}><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z" /><path d="M10 21h4" /></svg>
);
export const IconoBus = ({ className = "h-8 w-8" }) => (
  <svg {...base} className={className}><rect x="4" y="3" width="16" height="14" rx="3" /><path d="M4 11h16M8 21v-4M16 21v-4" /><circle cx="8" cy="14" r=".6" fill="currentColor" /><circle cx="16" cy="14" r=".6" fill="currentColor" /></svg>
);
export const IconoFono = ({ className = "h-8 w-8" }) => (
  <svg {...base} className={className}><path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></svg>
);
export const IconoReloj = ({ className = "h-8 w-8" }) => (
  <svg {...base} className={className}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
);
export const IconoBolso = ({ className = "h-8 w-8" }) => (
  <svg {...base} className={className}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M12 11v5M9.5 13.5h5" /></svg>
);
export const Flecha = ({ className = "h-6 w-6" }) => (
  <svg {...base} className={className}><path d="M9 6l6 6-6 6" /></svg>
);
