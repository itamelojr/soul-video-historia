-- SOUL VÍDEO HISTÓRIAS — BANCO DE DADOS
-- Execute este arquivo no Supabase > SQL Editor > New query > Run

create extension if not exists pgcrypto;

create table if not exists home_content (
  id uuid primary key default gen_random_uuid(),
  title text not null default '', text text not null default '', background_url text,
  is_active boolean default true, created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists about_content (
  id uuid primary key default gen_random_uuid(), title text not null default '', text text not null default '',
  photo_large_url text, photo_1_url text, photo_2_url text, photo_3_url text,
  is_active boolean default true, created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists mission_content (
  id uuid primary key default gen_random_uuid(), title text not null default '', text text not null default '',
  photo_1_url text, photo_2_url text, photo_3_url text, photo_4_url text,
  is_active boolean default true, created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists social_links (
  id uuid primary key default gen_random_uuid(), instagram_url text, whatsapp_url text,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists portfolio_categories (
  id uuid primary key default gen_random_uuid(), name text not null unique, sort_order int default 0, created_at timestamptz default now()
);
create table if not exists portfolio_subcategories (
  id uuid primary key default gen_random_uuid(), category_id uuid not null references portfolio_categories(id) on delete cascade,
  name text not null, sort_order int default 0, created_at timestamptz default now(), unique(category_id,name)
);
create table if not exists portfolio_events (
  id uuid primary key default gen_random_uuid(), subcategory_id uuid not null references portfolio_subcategories(id) on delete cascade,
  title text not null, description text, cover_url text, is_published boolean default true, sort_order int default 0, created_at timestamptz default now()
);
create table if not exists portfolio_videos (
  id uuid primary key default gen_random_uuid(), event_id uuid not null references portfolio_events(id) on delete cascade,
  title text, description text, youtube_url text not null, thumbnail_url text,
  is_published boolean default true, sort_order int default 0, created_at timestamptz default now()
);
create table if not exists portfolio_images (
  id uuid primary key default gen_random_uuid(), event_id uuid not null references portfolio_events(id) on delete cascade,
  image_url text not null, alt_text text, sort_order int default 0, created_at timestamptz default now()
);
create table if not exists testimonials (
  id uuid primary key default gen_random_uuid(), client_name text, testimonial_text text,
  media_type text check(media_type in ('photo','video')) default 'photo', media_url text,
  horizontal_photo_url text, is_published boolean default true, sort_order int default 0, created_at timestamptz default now()
);

insert into portfolio_categories(name,sort_order) values ('Casamento',1),('15 anos',2) on conflict do nothing;
insert into portfolio_subcategories(category_id,name,sort_order)
select id,'Teaser',1 from portfolio_categories on conflict do nothing;
insert into portfolio_subcategories(category_id,name,sort_order)
select id,'Save the Date',2 from portfolio_categories on conflict do nothing;

-- RLS
alter table home_content enable row level security;
alter table about_content enable row level security;
alter table mission_content enable row level security;
alter table social_links enable row level security;
alter table portfolio_categories enable row level security;
alter table portfolio_subcategories enable row level security;
alter table portfolio_events enable row level security;
alter table portfolio_videos enable row level security;
alter table portfolio_images enable row level security;
alter table testimonials enable row level security;

-- Público pode LER o conteúdo publicado.
do $$ begin
  create policy "public read home" on home_content for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin create policy "public read about" on about_content for select using (true); exception when duplicate_object then null; end $$;
do $$ begin create policy "public read mission" on mission_content for select using (true); exception when duplicate_object then null; end $$;
do $$ begin create policy "public read socials" on social_links for select using (true); exception when duplicate_object then null; end $$;
do $$ begin create policy "public read categories" on portfolio_categories for select using (true); exception when duplicate_object then null; end $$;
do $$ begin create policy "public read subcategories" on portfolio_subcategories for select using (true); exception when duplicate_object then null; end $$;
do $$ begin create policy "public read events" on portfolio_events for select using (is_published = true); exception when duplicate_object then null; end $$;
do $$ begin create policy "public read videos" on portfolio_videos for select using (is_published = true); exception when duplicate_object then null; end $$;
do $$ begin create policy "public read images" on portfolio_images for select using (true); exception when duplicate_object then null; end $$;
do $$ begin create policy "public read testimonials" on testimonials for select using (is_published = true); exception when duplicate_object then null; end $$;

-- Usuário autenticado do painel pode GERENCIAR tudo.
do $$ declare t text; begin
  foreach t in array array['home_content','about_content','mission_content','social_links','portfolio_categories','portfolio_subcategories','portfolio_events','portfolio_videos','portfolio_images','testimonials'] loop
    execute format('create policy "authenticated manage %s" on %I for all to authenticated using (true) with check (true)', t, t);
  end loop;
exception when duplicate_object then null; end $$;


-- O bucket 'imagens' deve ser público. Policies de upload/update/delete para authenticated já foram configuradas no Supabase.
