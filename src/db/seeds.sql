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
