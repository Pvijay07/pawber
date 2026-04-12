-- =============================================
-- Migration: Create Site Content Table
-- =============================================

create table if not exists site_content (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  content jsonb not null,
  type text not null,
  is_active boolean default true,
  updated_at timestamp default now(),
  created_at timestamp default now()
);

-- Index for fast lookup by key
create index if not exists idx_site_content_key on site_content(key);

-- Enable RLS and allow public read for some types, or keep it simple with service_role policy
alter table site_content enable row level security;
create policy "Service role full access on site_content" on site_content for all using (true) with check (true);

-- Seed initial "How it Works" for Client
insert into site_content (key, type, content) values (
  'client_how_it_works',
  'steps',
  '[
    {"title": "Choose Service", "description": "Select from grooming, walking, vet visits, or boarding.", "icon": "Scissors"},
    {"title": "Pick a Pro", "description": "Browse expert profiles, ratings, and book your preferred date/time.", "icon": "User"},
    {"title": "Relax & Track", "description": "Track the session live and pay securely via the app.", "icon": "Navigation"}
  ]'
) on conflict (key) do update set content = excluded.content;

-- Seed initial "How it Works" for Provider
insert into site_content (key, type, content) values (
  'provider_how_it_works',
  'steps',
  '[
    {"title": "Setup Profile", "description": "List your services, prices, and upload your certifications.", "icon": "Briefcase"},
    {"title": "Get Requests", "description": "Receive real-time booking requests from pet parents nearby.", "icon": "Bell"},
    {"title": "Start Earning", "description": "Complete jobs, collect positive reviews, and withdraw earnings daily.", "icon": "DollarSign"}
  ]'
) on conflict (key) do update set content = excluded.content;

-- Seed Hero Banners for Client
insert into site_content (key, type, content) values (
  'client_home_banners',
  'banners',
  '[
    {
      "title": "Professional Grooming at Home",
      "subtitle": "Get 20% off on your first spa session",
      "image": "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&q=80&w=800&h=400",
      "action": "bookingFlow",
      "serviceId": "grooming"
    },
    {
      "title": "Certified Vet Consultations",
      "subtitle": "Talk to an expert instantly",
      "image": "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?auto=format&fit=crop&q=80&w=800&h=400",
      "action": "bookingFlow",
      "serviceId": "vet"
    }
  ]'
) on conflict (key) do update set content = excluded.content;
