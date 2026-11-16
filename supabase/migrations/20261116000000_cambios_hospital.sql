-- =====================================================================
-- Cambios pedidos por el hospital (noviembre de 2026)
--  * Dirección escrita desde donde viaja el paciente (reemplaza al sector).
--  * Origen del recordatorio: link del SMS del hospital o página web.
--  * Motivo cuando el paciente avisa que no irá o responde que no fue.
--  * Visitas que llegan desde el link del SMS.
-- Ejecutar una vez en Supabase → SQL Editor. Se puede ejecutar de nuevo sin problema.
-- =====================================================================

alter table recordatorios add column if not exists direccion_origen text;
alter table recordatorios add column if not exists fuente text not null default 'web';
alter table recordatorios add column if not exists motivo text;
alter table recordatorios add column if not exists motivo_comentario text;

alter table recordatorios drop constraint if exists recordatorios_direccion_origen_check;
alter table recordatorios add constraint recordatorios_direccion_origen_check
  check (char_length(direccion_origen) <= 150);
alter table recordatorios drop constraint if exists recordatorios_fuente_check;
alter table recordatorios add constraint recordatorios_fuente_check
  check (fuente in ('web', 'sms'));
alter table recordatorios drop constraint if exists recordatorios_motivo_check;
alter table recordatorios add constraint recordatorios_motivo_check
  check (motivo in ('olvido', 'transporte', 'laboral', 'salud', 'familiar',
                    'ya_no_necesita', 'cambio_hora', 'otro'));
alter table recordatorios drop constraint if exists recordatorios_motivo_comentario_check;
alter table recordatorios add constraint recordatorios_motivo_comentario_check
  check (char_length(motivo_comentario) <= 300);

alter table visitas drop constraint if exists visitas_fuente_check;
alter table visitas add constraint visitas_fuente_check
  check (fuente in ('sitio-hospital', 'qr', 'sms', 'otro'));
