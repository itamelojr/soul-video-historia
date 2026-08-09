-- SOUL VÍDEO HISTÓRIAS
-- Schema/migração não destrutiva para o site público + painel admin.
-- Pode ser executado no SQL Editor do Supabase.
create extension if not exists pgcrypto;

create table if not exists public.home_content (
  id uuid primary key default gen_random_uuid(),
  title text,
  text text,
  background_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.about_content (
  id uuid primary key default gen_random_uuid(),
  title text,
  text text,
  photo_large_url text,
  photo_1_url text,
  photo_2_url text,
  photo_3_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mission_content (
  id uuid primary key default gen_random_uuid(),
  title text,
  text text,
  photo_1_url text,
  photo_2_url text,
  photo_3_url text,
  photo_4_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.portfolio_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.portfolio_subcategories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.portfolio_categories(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique(category_id,name)
);

create table if not exists public.portfolio_events (
  id uuid primary key default gen_random_uuid(),
  subcategory_id uuid not null references public.portfolio_subcategories(id) on delete cascade,
  title text,
  description text,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.portfolio_videos (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.portfolio_events(id) on delete cascade,
  youtube_url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.portfolio_images (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.portfolio_events(id) on delete cascade,
  image_url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  client_name text,
  testimonial_text text,
  media_type text not null default 'photo' check (media_type in ('photo','video')),
  media_url text,
  horizontal_photo_url text,
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  id integer primary key default 1 check (id=1),
  whatsapp_url text,
  instagram_url text,
  instagram_label text,
  instagram_15_url text,
  instagram_15_label text,
  updated_at timestamptz not null default now()
);

-- Acrescenta colunas caso as tabelas já existam em versão anterior.
alter table public.home_content add column if not exists background_url text;
alter table public.home_content add column if not exists is_active boolean not null default true;
alter table public.home_content add column if not exists updated_at timestamptz not null default now();

alter table public.about_content add column if not exists photo_large_url text;
alter table public.about_content add column if not exists photo_1_url text;
alter table public.about_content add column if not exists photo_2_url text;
alter table public.about_content add column if not exists photo_3_url text;
alter table public.about_content add column if not exists is_active boolean not null default true;
alter table public.about_content add column if not exists updated_at timestamptz not null default now();

alter table public.portfolio_events add column if not exists is_published boolean not null default true;
alter table public.portfolio_events add column if not exists updated_at timestamptz not null default now();
alter table public.portfolio_videos add column if not exists sort_order integer not null default 0;
alter table public.portfolio_images add column if not exists sort_order integer not null default 0;

alter table public.testimonials add column if not exists horizontal_photo_url text;
alter table public.testimonials add column if not exists is_published boolean not null default true;
alter table public.testimonials add column if not exists sort_order integer not null default 0;
alter table public.testimonials add column if not exists updated_at timestamptz not null default now();

insert into public.portfolio_categories(name,sort_order) values
 ('Casamento',1),('15 anos',2),('Corporativo',3)
on conflict(name) do nothing;

insert into public.portfolio_subcategories(category_id,name,sort_order)
select c.id,v.name,v.ord from public.portfolio_categories c
cross join (values ('Teaser',1),('Save the Date',2)) as v(name,ord)
where c.name in ('Casamento','15 anos')
on conflict(category_id,name) do nothing;

insert into public.portfolio_subcategories(category_id,name,sort_order)
select c.id,v.name,v.ord from public.portfolio_categories c
cross join (values ('Filmes',1),('Eventos',2)) as v(name,ord)
where c.name='Corporativo'
on conflict(category_id,name) do nothing;

insert into public.site_settings(id,whatsapp_url,instagram_url,instagram_label,instagram_15_url,instagram_15_label)
values(1,'https://wa.me/5532988442521','https://www.instagram.com/soul.videohistorias/','@soul.videohistorias','https://www.instagram.com/soul15anos/','@soul15anos')
on conflict(id) do nothing;

-- RLS: leitura pública; escrita somente por usuário autenticado.
alter table public.home_content enable row level security;
alter table public.about_content enable row level security;
alter table public.mission_content enable row level security;
alter table public.portfolio_categories enable row level security;
alter table public.portfolio_subcategories enable row level security;
alter table public.portfolio_events enable row level security;
alter table public.portfolio_videos enable row level security;
alter table public.portfolio_images enable row level security;
alter table public.testimonials enable row level security;
alter table public.site_settings enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'home_content','about_content','mission_content','portfolio_categories',
    'portfolio_subcategories','portfolio_events','portfolio_videos',
    'portfolio_images','testimonials','site_settings'
  ]
  loop
    execute format('drop policy if exists public_read on public.%I',t);
    execute format('drop policy if exists authenticated_write on public.%I',t);
    execute format('create policy public_read on public.%I for select using (true)',t);
    execute format('create policy authenticated_write on public.%I for all to authenticated using (true) with check (true)',t);
  end loop;
end $$;
