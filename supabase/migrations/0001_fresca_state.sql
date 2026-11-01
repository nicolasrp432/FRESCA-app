-- Copia en la nube del estado de FRESCA (canasta, historial, ajustes). Una fila por persona.
create table if not exists public.fresca_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.fresca_state enable row level security;

create policy "cada quien lee lo suyo" on public.fresca_state
  for select using (auth.uid() = user_id);
create policy "cada quien guarda lo suyo" on public.fresca_state
  for insert with check (auth.uid() = user_id);
create policy "cada quien actualiza lo suyo" on public.fresca_state
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "cada quien borra lo suyo" on public.fresca_state
  for delete using (auth.uid() = user_id);
