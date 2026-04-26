-- =============================================
-- Migration: Production Base Schema & Seeds
-- =============================================

-- 1. Site Content Table
CREATE TABLE IF NOT EXISTS public.site_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    content JSONB NOT NULL,
    type TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed Site Content
INSERT INTO site_content (key, type, content) VALUES
('client_how_it_works', 'steps', '[{"title": "Choose Service", "description": "Select from grooming, walking, vet visits, or boarding.", "icon": "Scissors"}, {"title": "Pick a Pro", "description": "Browse expert profiles, ratings, and book your preferred date/time.", "icon": "Users"}, {"title": "Relax & Track", "description": "Track the session live and pay securely via the app.", "icon": "MapPin"}]'),
('client_home_banners', 'banners', '[{"title": "Professional Grooming at Home", "subtitle": "Get 20% off on your first spa session", "image": "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&q=80&w=800&h=400", "action": "bookingFlow", "serviceId": "grooming"}]')
ON CONFLICT (key) DO UPDATE SET content = EXCLUDED.content;

-- 2. Service Categories
CREATE TABLE IF NOT EXISTS public.service_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.service_categories ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE public.service_categories ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.service_categories ADD COLUMN IF NOT EXISTS icon_url TEXT;
ALTER TABLE public.service_categories ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;
ALTER TABLE public.service_categories ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 3. Services
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.services ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.service_categories(id);
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 4. Service Packages
CREATE TABLE IF NOT EXISTS public.service_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.service_packages ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES public.services(id) ON DELETE CASCADE;
ALTER TABLE public.service_packages ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.service_packages ADD COLUMN IF NOT EXISTS price NUMERIC;
ALTER TABLE public.service_packages ADD COLUMN IF NOT EXISTS duration_minutes INT;
ALTER TABLE public.service_packages ADD COLUMN IF NOT EXISTS features TEXT[];
ALTER TABLE public.service_packages ADD COLUMN IF NOT EXISTS is_popular BOOLEAN DEFAULT false;
ALTER TABLE public.service_packages ADD COLUMN IF NOT EXISTS is_instant_available BOOLEAN DEFAULT true;
ALTER TABLE public.service_packages ADD COLUMN IF NOT EXISTS is_scheduled_available BOOLEAN DEFAULT true;
ALTER TABLE public.service_packages ADD COLUMN IF NOT EXISTS is_subscription BOOLEAN DEFAULT false;
ALTER TABLE public.service_packages ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;

-- 5. Addons
CREATE TABLE IF NOT EXISTS public.addons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.addons ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES public.services(id) ON DELETE CASCADE;
ALTER TABLE public.addons ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.addons ADD COLUMN IF NOT EXISTS price NUMERIC;
ALTER TABLE public.addons ADD COLUMN IF NOT EXISTS duration_minutes INT;
ALTER TABLE public.addons ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- =============================================
-- SEED DATA
-- =============================================

-- Categories
INSERT INTO service_categories (name, slug, sort_order, icon_url) VALUES
('Grooming', 'grooming', 1, 'Scissors'),
('Veterinary', 'health', 2, 'Heart'),
('Boarding', 'stay', 3, 'Home'),
('Dog Walking', 'exercise', 4, 'Zap'),
('Training', 'training', 5, 'Star')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order, icon_url = EXCLUDED.icon_url;

-- Services & Packages
DO $$
DECLARE
    groom_cat UUID;
    health_cat UUID;
    exer_cat UUID;
    stay_cat UUID;
    groom_id UUID;
    vet_id UUID;
    walk_id UUID;
    boarding_id UUID;
BEGIN
    SELECT id INTO groom_cat FROM service_categories WHERE slug = 'grooming';
    SELECT id INTO health_cat FROM service_categories WHERE slug = 'health';
    SELECT id INTO exer_cat FROM service_categories WHERE slug = 'exercise';
    SELECT id INTO stay_cat FROM service_categories WHERE slug = 'stay';

    -- Grooming
    INSERT INTO services (category_id, name, slug, description, is_active)
    VALUES (groom_cat, 'Full Grooming', 'grooming', 'Professional grooming and spa', true)
    ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id
    RETURNING id INTO groom_id;

    -- Vet
    INSERT INTO services (category_id, name, slug, description, is_active)
    VALUES (health_cat, 'Veterinary', 'vet', 'Professional vet consultation', true)
    ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id
    RETURNING id INTO vet_id;

    -- Walking
    INSERT INTO services (category_id, name, slug, description, is_active)
    VALUES (exer_cat, 'Dog Walking', 'walking', 'Daily exercise walks', true)
    ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id
    RETURNING id INTO walk_id;

    -- Boarding
    INSERT INTO services (category_id, name, slug, description, is_active)
    VALUES (stay_cat, 'Boarding', 'boarding', 'Safe overnight stays', true)
    ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id
    RETURNING id INTO boarding_id;

    -- Packages for Grooming
    INSERT INTO service_packages (service_id, package_name, price, duration_minutes, features, is_popular) VALUES
    (groom_id, 'Basic Bath', 499, 45, ARRAY['Bath', 'Nail Trimming'], false),
    (groom_id, 'Full Spa', 999, 90, ARRAY['Bath', 'Full Haircut', 'Nail Trimming', 'Ear Cleaning'], true)
    ON CONFLICT DO NOTHING;

    -- Packages for Walking
    INSERT INTO service_packages (service_id, package_name, price, duration_minutes, features) VALUES
    (walk_id, '30 Min Walk', 199, 30, ARRAY['Exercise', 'Water Break']),
    (walk_id, '60 Min Walk', 349, 60, ARRAY['Full Workout', 'Treats Included'])
    ON CONFLICT DO NOTHING;

    -- Addons
    INSERT INTO addons (service_id, name, price, duration_minutes) VALUES
    (groom_id, 'De-shedding', 299, 20),
    (groom_id, 'Tick Treatment', 199, 15)
    ON CONFLICT DO NOTHING;

END $$;
