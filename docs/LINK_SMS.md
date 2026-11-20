# Link del SMS del hospital

El hospital puede incluir en su SMS de confirmación un link que abre el
recordatorio **ya completado** con los datos de la cita.

## Formato

```
https://agenda-hospital.vercel.app/c?n=<nombre>&f=<fecha>&h=<hora>&e=<especialidad>&l=<lugar>
```

| Dato | Parámetro | Ejemplo | Nota |
|---|---|---|---|
| Primer nombre | `n` | `Rosa` | Sólo el primer nombre. |
| Fecha | `f` | `2026-11-23`, `23/11/2026` o el número de Excel (`46349`) | |
| Hora | `h` | `08:00` | |
| Especialidad | `e` | `LABORATORIO` | Opcional. |
| Lugar | `l` | `ENTRADA POR PUERTA PRINCIPAL` | Opcional. Se quita "Presentarse en:". |
| Qué llevar | `ll` | `EXAMENES DE SANGRE` | Opcional. Aparece en "¿Qué debe llevar ese día?". Alarga el SMS. |

**Nunca** se incluyen RUT ni teléfono: el link puede reenviarse o quedar guardado en el celular.

## Fórmula para la planilla (columna Q)

`docs/Plantilla_link_SMS.xlsx` trae la fórmula lista en la columna **Q**, con las
mismas columnas de la planilla del hospital (B = nombre, G = especialidad,
I = fecha, K = hora, P = información adicional). Copie esa columna a la
planilla real: Excel traduce la fórmula al idioma del equipo.

La columna **R** ("Probar link") abre el link con un clic, para comprobarlo
antes de enviar los SMS. En Excel, el texto de la columna Q no es un enlace:
se copia al SMS, pero para probarlo use la columna R o pegue el texto en el
navegador. Fórmula de la columna R: `=HIPERVINCULO(Q2;"Abrir")`.

Si al abrir la planilla aparece "Vista protegida", presione **Habilitar edición**
para que Excel calcule los links.

Versión en Excel en español (separador `;`), para la fila 2:

```
="https://agenda-hospital.vercel.app/c?n="&URLCODIF(SI.ERROR(IZQUIERDA(ESPACIOS(B2);ENCONTRAR(" ";ESPACIOS(B2))-1);ESPACIOS(B2)))&"&f="&I2&"&h="&HORA(K2)&":"&DERECHA("0"&MINUTO(K2);2)&"&e="&URLCODIF(ESPACIOS(G2))&"&l="&URLCODIF(ESPACIOS(SUSTITUIR(P2;"Presentarse en:";"")))
```

`URLCODIF` (ENCODEURL) existe en Excel 2013 o superior para Windows. No está
en Excel para Mac ni en Excel en la web.

## Largo del SMS

Con el lugar, el link mide unos 140 caracteres. Sumado al texto del hospital,
el SMS ocupará 2 segmentos. Si se quiere un SMS de un solo segmento, se puede
quitar el lugar (`&l=...`) de la fórmula: el link baja a unos 75 caracteres.
