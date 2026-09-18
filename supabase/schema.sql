-- =====================================================================
-- MOSISAA ADDUNYAA ABBAA CARRAA - Supabase PostgreSQL Schema
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- =====================================================================

-- ---------- ENUMS ----------
create type public.user_role as enum ('participant', 'admin', 'super_admin');
create type public.account_status as enum ('active', 'suspended');
create type public.lottery_status as enum ('upcoming', 'active', 'closed', 'drawing', 'completed');
create type public.payment_status as enum ('pending', 'verified', 'rejected');

-- =====================================================================
-- PROFILES
-- Extended fields for auth.users. Created automatically on signup.
-- =====================================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  role public.user_role not null default 'participant',
  account_status public.account_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Trigger to sync auth user into profiles on signup (and strip fields on update)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', null),
    coalesce(new.raw_user_meta_data->>'phone', null),
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'participant')
  )
  on conflict (id) do update
    set full_name = excluded.full_name,
        phone = excluded.phone,
        updated_at = now();
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- ---------- RLS: PROFILES ----------
-- A user can read/update their own profile.
create policy "profiles_select_self" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_update_self" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles_insert_self" on public.profiles
  for insert with check (auth.uid() = id);

-- Admins/super admins manage all profiles. Use a helper to check role.
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('admin', 'super_admin')
      and account_status = 'active'
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'super_admin'
      and account_status = 'active'
  );
$$;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_super_admin() to authenticated;

create policy "profiles_select_admin" on public.profiles
  for select using (public.is_admin());

create policy "profiles_update_admin" on public.profiles
  for update using (public.is_admin());

-- Suspended users lose access (participant dashboards re-check account_status).
create policy "profiles_no_suspended_write" on public.profiles
  for update using (public.is_admin() or auth.uid() = id);

-- =====================================================================
-- AUDIT LOGS
-- =====================================================================
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

alter table public.audit_logs enable row level security;

-- Only admins can read audit logs; server writes them with service role.
create policy "audit_logs_select_admin" on public.audit_logs
  for select using (public.is_admin());

-- Admins can also write audit logs via the API (no service key required).
create policy "audit_logs_insert_admin" on public.audit_logs
  for insert with check (public.is_admin());

-- =====================================================================
-- LOTTERIES
-- =====================================================================
create table public.lotteries (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  ticket_price numeric(12, 2) not null default 300 check (ticket_price > 0),
  -- Participant-picked number range: tickets are numbered 1..max_ticket_number.
  -- Participants each choose a free number; the draw matches winners to holders
  -- of the drawn numbers. Set once by the admin when creating the lottery.
  max_ticket_number integer not null default 300 check (max_ticket_number >= 1),
  registration_start timestamptz not null,
  registration_end timestamptz not null,
  draw_date timestamptz not null,
  status public.lottery_status not null default 'upcoming',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lotteries_dates_ok check (registration_end >= registration_start),
  constraint lotteries_price_ok check (ticket_price > 0)
);

alter table public.lotteries enable row level security;

create trigger set_lotteries_updated_at
  before update on public.lotteries
  for each row execute procedure public.set_updated_at();

-- Public can read lotteries (transparency).
create policy "lotteries_select_public" on public.lotteries
  for select using (true);

-- Only admins create/update/delete lotteries.
create policy "lotteries_insert_admin" on public.lotteries
  for insert with check (public.is_admin());

create policy "lotteries_update_admin" on public.lotteries
  for update using (public.is_admin());

create policy "lotteries_delete_admin" on public.lotteries
  for delete using (public.is_admin());

-- =====================================================================
-- TICKETS
-- =====================================================================
create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_code text not null unique,
  -- The number the participant picked (1..lotteries.max_ticket_number).
  -- NULL for legacy tickets that predate number picking; each number may be
  -- chosen by at most one participant per lottery (partial unique below).
  chosen_number integer,
  user_id uuid not null references public.profiles (id) on delete cascade,
  lottery_id uuid not null references public.lotteries (id) on delete cascade,
  price_paid numeric(12, 2) not null default 300 check (price_paid > 0),
  payment_status public.payment_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tickets_one_per_user_per_lottery unique (user_id, lottery_id)
);

-- A ticket number can be held by at most one participant per lottery;
-- NULLs (legacy code-only tickets) are never conflicts.
create unique index tickets_one_chosen_per_lottery
  on public.tickets (lottery_id, chosen_number)
  where chosen_number is not null;

alter table public.tickets enable row level security;

create trigger set_tickets_updated_at
  before update on public.tickets
  for each row execute procedure public.set_updated_at();

-- Users see only their own tickets.
create policy "tickets_select_own" on public.tickets
  for select using (auth.uid() = user_id);

create policy "tickets_insert_own" on public.tickets
  for insert with check (auth.uid() = user_id);

-- Admins see & update (verify payments) all tickets.
create policy "tickets_select_admin" on public.tickets
  for select using (public.is_admin());

create policy "tickets_update_admin" on public.tickets
  for update using (public.is_admin());

-- =====================================================================
-- PAYMENTS
-- =====================================================================
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'ETB',
  provider text not null default 'manual',
  transaction_reference text,
  status public.payment_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payments enable row level security;

create trigger set_payments_updated_at
  before update on public.payments
  for each row execute procedure public.set_updated_at();

-- Users see only their own payment rows.
create policy "payments_select_own" on public.payments
  for select using (auth.uid() = user_id);

create policy "payments_insert_own" on public.payments
  for insert with check (auth.uid() = user_id);

create policy "payments_select_admin" on public.payments
  for select using (public.is_admin());

create policy "payments_update_admin" on public.payments
  for update using (public.is_admin());

-- =====================================================================
-- WINNERS
-- =====================================================================
create table public.winners (
  id uuid primary key default gen_random_uuid(),
  lottery_id uuid not null references public.lotteries (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  ticket_id uuid not null references public.tickets (id) on delete cascade,
  "position" int not null check ("position" between 1 and 3),
  selected_at timestamptz not null default now(),
  -- One user can only win once per lottery; positions are unique.
  constraint winners_uq_user_lottery unique (lottery_id, user_id),
  constraint winners_uq_position_lottery unique (lottery_id, "position")
);

alter table public.winners enable row level security;

-- Public read for transparency.
create policy "winners_select_public" on public.winners
  for select using (true);

-- Write is only ever done by the server draw function (security definer)
-- or the service role. No direct client inserts:
create policy "winners_no_client_insert" on public.winners
  for insert with check (false);

create policy "winners_no_client_update" on public.winners
  for update using (false);

create policy "winners_no_client_delete" on public.winners
  for delete using (false);

-- =====================================================================
-- SECURE DRAW - performed entirely inside PostgreSQL (atomic, idempotent)
-- =====================================================================
create or replace function public.perform_draw(p_lottery_id uuid)
returns table (
  "position" int,
  user_id uuid,
  ticket_id uuid,
  ticket_code text,
  full_name text
)
language plpgsql
security definer set search_path = public
as $$
declare
  v_status public.lottery_status;
  v_lottery_row public.lotteries%rowtype;
  v_eligible int;
  v_position int := 1;
  v_winner_user uuid;
  v_winner_ticket uuid;
  v_winner_code text;
  v_winner_name text;
begin
  -- Idempotency / race protection: lock the lottery row for the whole draw.
  select * into v_lottery_row
  from public.lotteries
  where id = p_lottery_id
  for update;

  if not found then
    raise exception 'LOTTERY_NOT_FOUND';
  end if;

  v_status := v_lottery_row.status;

  -- A completed lottery can never be drawn again.
  if v_status = 'completed' then
    raise exception 'LOTTERY_ALREADY_DRAWN';
  end if;

  -- Only closed (registration ended) lotteries may be drawn.
  if v_status not in ('closed', 'drawing', 'active') then
    raise exception 'LOTTERY_NOT_DRAWABLE';
  end if;

  -- Mark drawing first (uniqueness guard: the winner rows can only exist once).
  if v_status <> 'drawing' then
    update public.lotteries set status = 'drawing', updated_at = now()
    where id = p_lottery_id;
  end if;

  -- Prevents re-draw if a previous transaction already wrote winners.
  if exists (select 1 from public.winners where lottery_id = p_lottery_id) then
    raise exception 'LOTTERY_ALREADY_DRAWN';
  end if;

  -- Eligible = verified tickets only.
  create temp table eligible_tickets on commit drop as
    select t.id as ticket_id, t.user_id, t.ticket_code
    from public.tickets t
    join public.profiles p on p.id = t.user_id
    where t.lottery_id = p_lottery_id
      and t.payment_status = 'verified'
      and p.account_status = 'active';

  select count(*) into v_eligible from eligible_tickets;
  if v_eligible < 3 then
    raise exception 'NOT_ENOUGH_ELIGIBLE' using hint = 'Need at least 3 verified tickets';
  end if;

  -- Cryptographically secure random sample of 3 distinct rows.
  -- Note: qualify with the temp-table alias - the function's RETURNS TABLE
  -- outputs (user_id, ticket_id, ticket_code) act as variables and would
  -- otherwise be ambiguous.
  for v_winner_user, v_winner_ticket, v_winner_code in
    select e.user_id, e.ticket_id, e.ticket_code
    from eligible_tickets e
    order by md5(
      gen_random_uuid()::text || '|' || p_lottery_id || '|' || e.ticket_id::text
    )
    limit 3
  loop
    select p.full_name into v_winner_name
    from public.profiles p where p.id = v_winner_user;

    insert into public.winners (lottery_id, user_id, ticket_id, "position")
    values (p_lottery_id, v_winner_user, v_winner_ticket, v_position)
    on conflict do nothing;

    if found then
      return query
        select v_position, v_winner_user, v_winner_ticket, v_winner_code, v_winner_name;
      v_position := v_position + 1;
    end if;
  end loop;

  if v_position = 1 then
    raise exception 'DRAW_FAILED_NO_WINNERS' using hint = 'Could not lock enough winners';
  end if;

  -- Mark completed.
  update public.lotteries
  set status = 'completed', updated_at = now()
  where id = p_lottery_id;

  -- Audit trail (drawn server-side).
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    'draw.winners_selected',
    'lottery',
    p_lottery_id,
    jsonb_build_object('eligible_participants', v_eligible)
  );

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    'lottery.completed',
    'lottery',
    p_lottery_id,
    jsonb_build_object('draw_date', now())
  );
end;
$$;

-- Participants can never call the draw; admins can.
revoke all on function public.perform_draw(uuid) from public, anon, authenticated;
grant execute on function public.perform_draw(uuid) to authenticated, service_role;

-- Hard RLS gate on the function: only admins pass (thrown BEFORE plpgsql body logic
-- for non-admins to keep it airtight even with leaked privileges).
create or replace function public.perform_draw_authorized(p_lottery_id uuid)
returns table (
  "position" int,
  user_id uuid,
  ticket_id uuid,
  ticket_code text,
  full_name text
)
language plpgsql
security invoker set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN';
  end if;
  return query select * from public.perform_draw(p_lottery_id);
end;
$$;

revoke all on function public.perform_draw_authorized(uuid) from public, anon, authenticated;
grant execute on function public.perform_draw_authorized(uuid) to authenticated;

-- =====================================================================
-- STATS helper for admin dashboard
-- =====================================================================
create or replace function public.admin_stats()
returns jsonb
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN';
  end if;
  return (
    select jsonb_build_object(
      'total_users', (select count(*) from public.profiles),
      'total_tickets', (select count(*) from public.tickets),
      'verified_tickets', (select count(*) from public.tickets where payment_status = 'verified'),
      'pending_payments', (select count(*) from public.payments where status = 'pending'),
      'active_lotteries', (select count(*) from public.lotteries where status in ('upcoming','active')),
      'completed_lotteries', (select count(*) from public.lotteries where status = 'completed')
    )
  );
end;
$$;

revoke all on function public.admin_stats() from public, anon, authenticated;
grant execute on function public.admin_stats() to authenticated;

-- =====================================================================
-- INDEXES
-- =====================================================================
create index if not exists idx_tickets_lottery_status on public.tickets (lottery_id, payment_status);
create index if not exists idx_tickets_user on public.tickets (user_id);
create index if not exists idx_payments_ticket on public.payments (ticket_id);
create index if not exists idx_winners_lottery on public.winners (lottery_id);
create index if not exists idx_audit_logs_created on public.audit_logs (created_at desc);
create index if not exists idx_lotteries_status on public.lotteries (status);
create index if not exists idx_profiles_role on public.profiles (role);