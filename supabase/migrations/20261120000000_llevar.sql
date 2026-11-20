-- =====================================================================
-- Qué debe llevar el paciente el día de su hora (noviembre de 2026).
-- Ejecutar una vez en Supabase → SQL Editor. Se puede ejecutar de nuevo sin problema.
-- =====================================================================
alter table recordatorios add column if not exists llevar text;
alter table recordatorios drop constraint if exists recordatorios_llevar_check;
alter table recordatorios add constraint recordatorios_llevar_check check (char_length(llevar) <= 300);
