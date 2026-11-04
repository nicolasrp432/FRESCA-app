-- Tabla para reseñas y valoraciones de los usuarios de FRESCA
create table if not exists public.reviews (
  id text primary key,
  user_id text,
  user_name text not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text not null default '',
  tags text[] default '{}',
  created_at timestamptz not null default now()
);

-- Habilitar Row Level Security (RLS)
alter table public.reviews enable row level security;

-- Cualquiera puede consultar las valoraciones públicas
create policy "lectura pública de reseñas" on public.reviews
  for select using (true);

-- Cualquier usuario puede enviar una reseña
create policy "creación de reseñas" on public.reviews
  for insert with check (true);

-- Índice para ordenar rápidamente por fecha de creación
create index if not exists idx_reviews_created_at on public.reviews (created_at desc);
