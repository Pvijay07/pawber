-- =============================================
-- Migration: Production Base Schema & Seeds
-- =============================================

-- Ensure site_content table
CREATE TABLE IF NOT EXISTS public.site_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    content JSONB NOT NULL,
    type TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed initial "How it Works" for Client
INSERT INTO site_content (key, type, content) VALUES (
  'client_how_it_works',
  'steps',
  '[
    {"title": "Choose Service", "description": "Select from grooming, walking, vet visits, or boarding.", "icon": "Scissors"},
    {"title": "Pick a Pro", "description": "Browse expert profiles, ratings, and book your preferred date/time.", "icon": "Users"},
    {"title": "Relax & Track", "description": "Track the session live and pay securely via the app.", "icon": "MapPin"}
  ]'
) ON CONFLICT (key) DO UPDATE SET content = EXCLUDED.content;

-- Seed initial "How it Works" for Provider
INSERT INTO site_content (key, type, content) VALUES (
  'provider_how_it_works',
  'steps',
  '[
    {"title": "Setup Profile", "description": "List your services, prices, and upload your certifications.", "icon": "Info"},
    {"title": "Get Requests", "description": "Receive real-time booking requests from pet parents nearby.", "icon": "Bell"},
    {"title": "Start Earning", "description": "Complete jobs, collect positive reviews, and withdraw earnings daily.", "icon": "Zap"}
  ]'
) ON CONFLICT (key) DO UPDATE SET content = EXCLUDED.content;

-- Seed Hero Banners for Client
INSERT INTO site_content (key, type, content) VALUES (
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
) ON CONFLICT (key) DO UPDATE SET content = EXCLUDED.content;


-- 5. Ensure services table structure is up to date
DO $$ 
BEGIN 
    -- Ensure table exists
    CREATE TABLE IF NOT EXISTS public.services (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        slug TEXT UNIQUE,
        created_at TIMESTAMPTZ DEFAULT now()
    );

    -- Ensure slug column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='services' AND column_name='slug') THEN
        ALTER TABLE public.services ADD COLUMN slug TEXT UNIQUE;
    END IF;

    -- Ensure category column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='services' AND column_name='category') THEN
        ALTER TABLE public.services ADD COLUMN category TEXT;
    END IF;

    -- Ensure description column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='services' AND column_name='description') THEN
        ALTER TABLE public.services ADD COLUMN description TEXT;
    END IF;

    -- Ensure is_active column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='services' AND column_name='is_active') THEN
        ALTER TABLE public.services ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;
