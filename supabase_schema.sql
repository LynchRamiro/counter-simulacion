-- ==============================================================================
-- 🚀 ESQUEMA DE BASE DE DATOS SUPABASE - SIMUTIMER (SIMULACIÓN DE COLAS)
-- Copia y pega todo este código en el SQL Editor de tu proyecto en Supabase y dale a "RUN".
-- ==============================================================================

-- 1. TABLA DE USUARIOS (5 Integrantes)
create table if not exists public.users (
  id int primary key,
  name text not null
);

-- Insertar los 5 usuarios iniciales si no existen
insert into public.users (id, name) values
  (1, 'Usuario 1'),
  (2, 'Usuario 2'),
  (3, 'Usuario 3'),
  (4, 'Usuario 4'),
  (5, 'Usuario 5')
on conflict (id) do nothing;

-- 2. TABLA DE SISTEMAS Y PROCESOS
create table if not exists public.systems (
  id text primary key,
  name text not null,
  description text default '',
  processes jsonb not null default '[]'::jsonb,
  created_at timestamptz default now()
);

-- 3. TABLA DE MUESTRAS / REGISTROS DE TIEMPOS
create table if not exists public.records (
  id text primary key,
  system_id text not null,
  system_name text not null,
  user_id int not null,
  user_name text not null,
  timestamp timestamptz default now(),
  process_times jsonb not null default '[]'::jsonb,
  total_system_time_seconds numeric not null,
  notes text default ''
);

-- ==============================================================================
-- POLÍTICAS DE SEGURIDAD (Permitir lectura y escritura pública para el equipo)
-- ==============================================================================
alter table public.users enable row level security;
alter table public.systems enable row level security;
alter table public.records enable row level security;

drop policy if exists "Acceso total a users" on public.users;
create policy "Acceso total a users" on public.users for all using (true) with check (true);

drop policy if exists "Acceso total a systems" on public.systems;
create policy "Acceso total a systems" on public.systems for all using (true) with check (true);

drop policy if exists "Acceso total a records" on public.records;
create policy "Acceso total a records" on public.records for all using (true) with check (true);

-- ==============================================================================
-- HABILITAR REALTIME (Sincronización instantánea entre celulares y laptops)
-- ==============================================================================
alter publication supabase_realtime add table public.users, public.systems, public.records;
