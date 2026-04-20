-- =============================================
-- Supabase Migration for Pawber
-- Uses Supabase's built-in auth.users instead of local auth_users
-- =============================================

-- 1. PROFILES (references Supabase auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text check (role in ('client','provider','admin')) not null default 'client',
  full_name text,
  phone text,
  avatar_url text,
  deleted_at timestamp,
  created_at timestamp default now()
);

-- 2. PET MANAGEMENT
create table if not exists pets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  type text,
  breed text,
  age int,
  weight numeric,
  medical_notes text,
  vaccination_status text,
  image_url text,
  deleted_at timestamp,
  created_at timestamp default now()
);

-- 3. SERVICE PROVIDERS
create table if not exists providers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  business_name text,
  category text,
  description text,
  address text,
  city text,
  latitude numeric,
  longitude numeric,
  service_radius_km int default 10,
  rating numeric default 0,
  total_reviews int default 0,
  status text default 'pending' check (status in ('pending','approved','rejected','suspended')),
  is_online boolean default true,
  deleted_at timestamp,
  created_at timestamp default now()
);

-- 4. PROVIDER DOCUMENTS
create table if not exists provider_documents (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid references providers(id) on delete cascade not null,
  document_type text not null,
  file_url text not null,
  verification_status text default 'pending' check (verification_status in ('pending','approved','rejected')),
  reviewed_by uuid references profiles(id),
  reviewed_at timestamp,
  uploaded_at timestamp default now()
);

-- 5. SERVICE CATEGORIES & SERVICES
create table if not exists service_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  icon_url text,
  sort_order int default 0,
  is_active boolean default true,
  created_at timestamp default now()
);

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references service_categories(id) not null,
  name text not null,
  description text,
  image_url text,
  is_active boolean default true,
  created_at timestamp default now()
);

-- 6. PACKAGES
create table if not exists service_packages (
  id uuid primary key default gen_random_uuid(),
  service_id uuid references services(id) on delete cascade not null,
  package_name text not null,
  description text,
  price numeric not null,
  duration_minutes int,
  features text[],
  is_popular boolean default false,
  is_instant_available boolean default true,
  is_scheduled_available boolean default true,
  is_subscription boolean default false,
  sort_order int default 0,
  created_at timestamp default now()
);

-- 7. ADD-ONS
create table if not exists addons (
  id uuid primary key default gen_random_uuid(),
  service_id uuid references services(id) on delete cascade not null,
  name text not null,
  description text,
  price numeric not null,
  duration_minutes int,
  is_active boolean default true,
  created_at timestamp default now()
);

create table if not exists package_addons (
  id uuid primary key default gen_random_uuid(),
  package_id uuid references service_packages(id) on delete cascade not null,
  addon_id uuid references addons(id) on delete cascade not null,
  unique(package_id, addon_id)
);

-- 8. PROVIDER SERVICES & SLOTS
create table if not exists provider_services (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid references providers(id) on delete cascade not null,
  service_id uuid references services(id) not null,
  base_price numeric,
  is_active boolean default true,
  unique(provider_id, service_id)
);

create table if not exists blocked_dates (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid references providers(id) on delete cascade not null,
  date date not null,
  reason text,
  created_at timestamp default now()
);

create table if not exists provider_slots (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid references providers(id) on delete cascade not null,
  slot_date date not null,
  start_time time not null,
  end_time time not null,
  capacity int default 1,
  booked_count int default 0,
  is_blocked boolean default false,
  created_at timestamp default now(),
  constraint valid_time check (start_time < end_time),
  constraint valid_capacity check (booked_count <= capacity)
);

-- 9. SLOT LOCKS
create table if not exists slot_locks (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid references provider_slots(id) on delete cascade not null,
  user_id uuid references profiles(id) not null,
  lock_expires_at timestamp not null,
  created_at timestamp default now()
);

-- 10. BOOKINGS
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) not null,
  provider_id uuid references providers(id),
  service_id uuid references services(id) not null,
  package_id uuid references service_packages(id) not null,
  booking_type text check (booking_type in ('instant','scheduled')) not null,
  booking_date date,
  slot_id uuid references provider_slots(id),
  total_amount numeric not null,
  status text default 'pending' check (status in ('pending','confirmed','in_progress','completed','cancelled','disputed')),
  payment_status text default 'unpaid' check (payment_status in ('unpaid','escrow','paid','refunded','partial_refund')),
  address text,
  latitude numeric,
  longitude numeric,
  notes text,
  cancelled_by uuid references profiles(id),
  cancelled_reason text,
  completed_at timestamp,
  deleted_at timestamp,
  created_at timestamp default now()
);

-- 11. BOOKING PETS & ADDONS
create table if not exists booking_pets (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id) on delete cascade not null,
  pet_id uuid references pets(id) not null,
  unique(booking_id, pet_id)
);

create table if not exists booking_addons (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id) on delete cascade not null,
  addon_id uuid references addons(id) not null,
  price numeric not null,
  unique(booking_id, addon_id)
);

-- 12. WALLET & PAYMENTS
create table if not exists wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) not null unique,
  balance numeric default 0 check (balance >= 0),
  auto_recharge boolean default false,
  auto_recharge_threshold numeric default 200,
  auto_recharge_amount numeric default 500,
  created_at timestamp default now()
);

create table if not exists wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid references wallets(id) not null,
  type text check (type in ('credit','debit','refund','bonus')) not null,
  amount numeric not null,
  description text,
  reference_id text,
  reference_type text,
  created_at timestamp default now()
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id),
  user_id uuid references profiles(id) not null,
  order_id text unique,
  payment_gateway text default 'razorpay',
  payment_method text,
  amount numeric not null,
  currency text default 'INR',
  status text default 'pending' check (status in ('pending','success','failed','refunded')),
  gateway_response jsonb,
  created_at timestamp default now()
);

-- 13. ESCROW
create table if not exists escrow (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id) not null unique,
  amount numeric not null,
  status text default 'held' check (status in ('held','released','refunded','disputed')),
  released_at timestamp,
  released_to uuid references profiles(id),
  created_at timestamp default now()
);

-- 14. EVENTS & TICKETS
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  event_date timestamp not null,
  end_date timestamp,
  location text,
  latitude numeric,
  longitude numeric,
  ticket_price numeric default 0,
  max_attendees int,
  image_url text,
  organizer_id uuid references profiles(id),
  is_active boolean default true,
  created_at timestamp default now()
);

create table if not exists event_tickets (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade not null,
  user_id uuid references profiles(id) not null,
  qr_code text unique not null,
  status text default 'valid' check (status in ('valid','used','cancelled','expired')),
  payment_id uuid references payments(id),
  created_at timestamp default now()
);

-- 15. REVIEWS
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id) not null unique,
  user_id uuid references profiles(id) not null,
  provider_id uuid references providers(id) not null,
  rating int check (rating between 1 and 5) not null,
  comment text,
  reply text,
  reply_at timestamp,
  created_at timestamp default now()
);

-- 16. NOTIFICATIONS
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) not null,
  title text not null,
  message text,
  type text,
  data jsonb,
  is_read boolean default false,
  created_at timestamp default now()
);

-- 17. DISPUTES
create table if not exists disputes (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id) not null,
  raised_by uuid references profiles(id) not null,
  reason text not null,
  description text,
  evidence_urls text[],
  status text default 'open' check (status in ('open','under_review','resolved','closed')),
  resolution text,
  resolved_by uuid references profiles(id),
  resolved_at timestamp,
  created_at timestamp default now()
);

-- 18. WEBHOOK LOGS
create table if not exists webhook_logs (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  event_type text,
  payload jsonb not null,
  status text default 'received',
  processed_at timestamp,
  error_message text,
  created_at timestamp default now()
);

-- 19. COUPONS
create table if not exists coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  description text,
  discount_type text check (discount_type in ('percent','flat')) not null,
  discount_value numeric not null,
  max_discount numeric,
  min_order_amount numeric default 0,
  usage_limit int,
  used_count int default 0,
  valid_from timestamp default now(),
  valid_until timestamp,
  is_active boolean default true,
  created_at timestamp default now()
);

create table if not exists coupon_usage (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid references coupons(id) not null,
  user_id uuid references profiles(id) not null,
  booking_id uuid references bookings(id),
  used_at timestamp default now(),
  unique(coupon_id, user_id, booking_id)
);

-- 20. CHAT
create table if not exists chat_threads (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id) on delete cascade not null unique,
  client_id uuid references profiles(id) not null,
  provider_user_id uuid references profiles(id) not null,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid references chat_threads(id) on delete cascade not null,
  sender_id uuid references profiles(id) not null,
  content text not null,
  message_type text default 'text' check (message_type in ('text','image','location','system')),
  metadata jsonb default '{}',
  is_read boolean default false,
  created_at timestamp default now()
);

-- 21. GPS TRACKING
create table if not exists location_updates (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id) on delete cascade not null,
  provider_id uuid references providers(id) not null,
  latitude numeric not null,
  longitude numeric not null,
  accuracy numeric,
  heading numeric,
  speed numeric,
  status text default 'in_progress' check (status in ('on_the_way','arrived','in_progress','returning','completed')),
  created_at timestamp default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_profiles_role on profiles(role);
create index if not exists idx_pets_user on pets(user_id);
create index if not exists idx_providers_user on providers(user_id);
create index if not exists idx_providers_status on providers(status);
create index if not exists idx_providers_category on providers(category);
create index if not exists idx_provider_slots_date on provider_slots(provider_id, slot_date);
create index if not exists idx_slot_locks_expiry on slot_locks(lock_expires_at);
create index if not exists idx_bookings_user on bookings(user_id);
create index if not exists idx_bookings_provider on bookings(provider_id);
create index if not exists idx_bookings_date on bookings(booking_date);
create index if not exists idx_bookings_status on bookings(status);
create index if not exists idx_payments_order on payments(order_id);
create index if not exists idx_payments_user on payments(user_id);
create index if not exists idx_wallets_user on wallets(user_id);
create index if not exists idx_notifications_user on notifications(user_id, is_read);
create index if not exists idx_reviews_provider on reviews(provider_id);
create index if not exists idx_events_date on events(event_date);
create index if not exists idx_disputes_status on disputes(status);
create index if not exists idx_webhook_logs_source on webhook_logs(source, created_at);
create index if not exists idx_coupons_code on coupons(code);
create index if not exists idx_chat_threads_client on chat_threads(client_id);
create index if not exists idx_chat_threads_provider on chat_threads(provider_user_id);
create index if not exists idx_chat_threads_booking on chat_threads(booking_id);
create index if not exists idx_chat_messages_thread on chat_messages(thread_id, created_at);
create index if not exists idx_chat_messages_unread on chat_messages(thread_id, is_read) where is_read = false;
create index if not exists idx_location_updates_booking on location_updates(booking_id, created_at);
create index if not exists idx_location_updates_provider on location_updates(provider_id);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-create wallet on profile creation
create or replace function create_wallet_for_user()
returns trigger as $$
begin
  insert into wallets (user_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_profile_created on profiles;
create trigger on_profile_created
  after insert on profiles
  for each row
  execute function create_wallet_for_user();

-- Auto-update provider rating on new review
create or replace function update_provider_rating()
returns trigger as $$
begin
  update providers set
    rating = (select avg(rating)::numeric(3,2) from reviews where provider_id = new.provider_id),
    total_reviews = (select count(*) from reviews where provider_id = new.provider_id)
  where id = new.provider_id;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_review_created on reviews;
create trigger on_review_created
  after insert on reviews
  for each row
  execute function update_provider_rating();

-- Clean expired slot locks
create or replace function cleanup_expired_slot_locks()
returns void as $$
begin
  delete from slot_locks where lock_expires_at < now();
end;
$$ language plpgsql security definer;

-- Increment booked_count safely
create or replace function increment_slot_booking(p_slot_id uuid)
returns boolean as $$
declare
  v_capacity int;
  v_booked int;
begin
  select capacity, booked_count into v_capacity, v_booked
  from provider_slots where id = p_slot_id for update;

  if v_booked >= v_capacity then
    return false;
  end if;

  update provider_slots set booked_count = booked_count + 1 where id = p_slot_id;
  return true;
end;
$$ language plpgsql security definer;

-- ============================================================
-- DISABLE RLS for all tables (service_role key bypasses anyway)
-- ============================================================
alter table profiles enable row level security;
create policy "Service role full access on profiles" on profiles for all using (true) with check (true);

alter table pets enable row level security;
create policy "Service role full access on pets" on pets for all using (true) with check (true);

alter table providers enable row level security;
create policy "Service role full access on providers" on providers for all using (true) with check (true);

alter table services enable row level security;
create policy "Service role full access on services" on services for all using (true) with check (true);

alter table service_categories enable row level security;
create policy "Service role full access on service_categories" on service_categories for all using (true) with check (true);

alter table service_packages enable row level security;
create policy "Service role full access on service_packages" on service_packages for all using (true) with check (true);

alter table addons enable row level security;
create policy "Service role full access on addons" on addons for all using (true) with check (true);

alter table bookings enable row level security;
create policy "Service role full access on bookings" on bookings for all using (true) with check (true);

alter table wallets enable row level security;
create policy "Service role full access on wallets" on wallets for all using (true) with check (true);

alter table wallet_transactions enable row level security;
create policy "Service role full access on wallet_transactions" on wallet_transactions for all using (true) with check (true);

alter table payments enable row level security;
create policy "Service role full access on payments" on payments for all using (true) with check (true);

alter table events enable row level security;
create policy "Service role full access on events" on events for all using (true) with check (true);

alter table event_tickets enable row level security;
create policy "Service role full access on event_tickets" on event_tickets for all using (true) with check (true);

alter table reviews enable row level security;
create policy "Service role full access on reviews" on reviews for all using (true) with check (true);

alter table notifications enable row level security;
create policy "Service role full access on notifications" on notifications for all using (true) with check (true);

alter table disputes enable row level security;
create policy "Service role full access on disputes" on disputes for all using (true) with check (true);

alter table coupons enable row level security;
create policy "Service role full access on coupons" on coupons for all using (true) with check (true);

alter table chat_threads enable row level security;
create policy "Service role full access on chat_threads" on chat_threads for all using (true) with check (true);

alter table chat_messages enable row level security;
create policy "Service role full access on chat_messages" on chat_messages for all using (true) with check (true);

alter table location_updates enable row level security;
create policy "Service role full access on location_updates" on location_updates for all using (true) with check (true);
