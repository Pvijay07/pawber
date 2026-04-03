-- =============================================
-- PetCare: Add missing columns to existing Supabase tables
-- Run this in your Supabase Dashboard > SQL Editor
-- =============================================

-- service_categories: add missing columns
ALTER TABLE service_categories ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE service_categories ADD COLUMN IF NOT EXISTS sort_order int DEFAULT 0;
ALTER TABLE service_categories ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT now();

-- services: add missing columns
ALTER TABLE services ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES service_categories(id);
ALTER TABLE services ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE services ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE services ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE services ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT now();

-- events: add missing columns
ALTER TABLE events ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_date timestamp;
ALTER TABLE events ADD COLUMN IF NOT EXISTS end_date timestamp;
ALTER TABLE events ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS latitude numeric;
ALTER TABLE events ADD COLUMN IF NOT EXISTS longitude numeric;
ALTER TABLE events ADD COLUMN IF NOT EXISTS ticket_price numeric DEFAULT 0;
ALTER TABLE events ADD COLUMN IF NOT EXISTS max_attendees int;
ALTER TABLE events ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS organizer_id uuid REFERENCES profiles(id);
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE events ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT now();

-- providers: add missing columns
ALTER TABLE providers ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS business_name text;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS latitude numeric;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS longitude numeric;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS service_radius_km int DEFAULT 10;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS rating numeric DEFAULT 0;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS total_reviews int DEFAULT 0;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
ALTER TABLE providers ADD COLUMN IF NOT EXISTS is_online boolean DEFAULT true;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS deleted_at timestamp;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT now();

-- bookings: add missing columns
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES profiles(id);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS provider_id uuid REFERENCES providers(id);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS service_id uuid REFERENCES services(id);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_type text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_date date;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS total_amount numeric;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'unpaid';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS latitude numeric;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS longitude numeric;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_by uuid;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_reason text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS completed_at timestamp;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS deleted_at timestamp;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT now();

-- profiles: add missing columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at timestamp;

-- pets: add missing columns
ALTER TABLE pets ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS type text;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS breed text;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS age int;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS weight numeric;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS medical_notes text;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS vaccination_status text;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS deleted_at timestamp;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT now();

-- wallets: add missing columns
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES profiles(id);
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS balance numeric DEFAULT 0;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS auto_recharge boolean DEFAULT false;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS auto_recharge_threshold numeric DEFAULT 200;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS auto_recharge_amount numeric DEFAULT 500;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT now();

-- notifications: add missing columns
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES profiles(id);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS message text;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type text;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS data jsonb;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT now();

-- reviews: add missing columns
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS booking_id uuid REFERENCES bookings(id);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES profiles(id);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS provider_id uuid REFERENCES providers(id);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS rating int;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS comment text;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS reply text;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS reply_at timestamp;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT now();

-- payments: add missing columns
ALTER TABLE payments ADD COLUMN IF NOT EXISTS booking_id uuid REFERENCES bookings(id);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES profiles(id);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS order_id text;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_gateway text DEFAULT 'razorpay';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_method text;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS amount numeric;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS currency text DEFAULT 'INR';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS gateway_response jsonb;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT now();

-- event_tickets: add missing columns
ALTER TABLE event_tickets ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES events(id) ON DELETE CASCADE;
ALTER TABLE event_tickets ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES profiles(id);
ALTER TABLE event_tickets ADD COLUMN IF NOT EXISTS qr_code text;
ALTER TABLE event_tickets ADD COLUMN IF NOT EXISTS status text DEFAULT 'valid';
ALTER TABLE event_tickets ADD COLUMN IF NOT EXISTS payment_id uuid REFERENCES payments(id);
ALTER TABLE event_tickets ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT now();

-- Create missing tables
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid REFERENCES wallets(id),
  type text,
  amount numeric,
  description text,
  reference_id text,
  reference_type text,
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS service_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  package_name text,
  description text,
  price numeric,
  duration_minutes int,
  features text[],
  is_popular boolean DEFAULT false,
  sort_order int DEFAULT 0,
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  name text,
  description text,
  price numeric,
  duration_minutes int,
  is_active boolean DEFAULT true,
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS provider_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid REFERENCES providers(id) ON DELETE CASCADE,
  slot_date date,
  start_time time,
  end_time time,
  capacity int DEFAULT 1,
  booked_count int DEFAULT 0,
  is_blocked boolean DEFAULT false,
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id),
  raised_by uuid REFERENCES profiles(id),
  reason text,
  description text,
  status text DEFAULT 'open',
  resolution text,
  resolved_by uuid REFERENCES profiles(id),
  resolved_at timestamp,
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS escrow (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id),
  amount numeric,
  status text DEFAULT 'held',
  released_at timestamp,
  released_to uuid REFERENCES profiles(id),
  created_at timestamp DEFAULT now()
);

-- Delete test data
DELETE FROM service_categories WHERE name = 'test_cat';

-- Seed sample service categories
INSERT INTO service_categories (name, description, icon_url, sort_order, is_active)
VALUES 
  ('Pet Grooming', 'Professional grooming services for your pets', '🛁', 1, true),
  ('Veterinary', 'Health checkups and medical care', '🏥', 2, true),
  ('Pet Walking', 'Daily walks and exercise', '🐕', 3, true),
  ('Pet Boarding', 'Safe boarding when you are away', '🏠', 4, true),
  ('Pet Training', 'Obedience and behavior training', '🎓', 5, true)
ON CONFLICT (name) DO NOTHING;
