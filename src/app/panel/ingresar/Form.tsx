"use client";
import { useActionState, useEffect } from "react";
import { ingresar } from "./actions";

export function Form() {
  const [estado, accion, pendiente] = useActionState(ingresar, {});
  useEffect(() => { if (estado.ok) window.location.assign("/panel"); }, [estado.ok]);
  return (
    <form action={accion} className="space-y-4">
      {estado.error && <p role="alert" className="rounded-lg border border-risk-alto/30 bg-red-50 px-4 py-3 font-bold text-risk-alto">{estado.error}</p>}
      <label className="block"><span className="label">Usuario</span>
        <input name="usuario" required autoComplete="username" autoCapitalize="none" className="field" /></label>
      <label className="block"><span className="label">Contraseña</span>
        <input name="clave" type="password" required autoComplete="current-password" className="field" /></label>
      <button type="submit" disabled={pendiente} className="btn-primary w-full py-3">{pendiente || estado.ok ? "Ingresando…" : "Ingresar al panel"}</button>
    </form>
  );
}
