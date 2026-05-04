create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null
);

create table if not exists product_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category_id uuid references categories(id) on delete cascade
);

create table if not exists sections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category_id uuid references categories(id) on delete cascade,
  type_id uuid not null references product_types(id) on delete cascade
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric not null default 0,
  description text,
  weight text,
  images text[] default '{}',
  category_id uuid references categories(id) on delete set null,
  type_id uuid references product_types(id) on delete set null,
  section_id uuid references sections(id) on delete set null
);

create table if not exists coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_percentage integer not null,
  is_active boolean default true,
  expiry_date timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null,
  customer_name text,
  phone text not null,
  address text not null,
  notes text,
  user_id uuid,
  coupon_id uuid references coupons(id) on delete set null,
  status text not null default 'pending',
  total_amount numeric not null default 0,
  discount_amount numeric not null default 0,
  final_amount numeric not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric not null default 0,
  total_price numeric not null default 0
);

alter table categories enable row level security;
alter table product_types enable row level security;
alter table sections enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

create policy "Public categories are readable"
on categories for select
to anon
using (true);

create policy "Public product types are readable"
on product_types for select
to anon
using (true);

create policy "Public sections are readable"
on sections for select
to anon
using (true);

create policy "Public products are readable"
on products for select
to anon
using (true);

create policy "Public orders are readable"
on orders for select
to anon
using (true);

create policy "Public order items are readable"
on order_items for select
to anon
using (true);

create policy "Customers can create orders"
on orders for insert
to anon
with check (true);

create policy "Customers can create order items"
on order_items for insert
to anon
with check (true);

-- Create function to calculate coupon discount
create or replace function get_coupon_discount(p_code text, p_total numeric)
returns numeric as $$
begin
  if upper(trim(p_code)) = 'BONDQ10' then
    return round(p_total * 0.1);
  elsif upper(trim(p_code)) = 'SAVE5' then
    return round(p_total * 0.05);
  else
    return 0;
  end if;
end;
$$ language plpgsql immutable;

-- Drop old RPC signature if it exists
drop function if exists public.create_order(uuid, text, text, text, text, text, jsonb);

-- Create RPC function to create order with coupon support
create or replace function public.create_order(
  p_customer_name  text,
  p_phone          text,
  p_address        text,
  p_notes          text,
  p_customer_id    uuid,
  p_coupon_code    text,
  p_items          jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_coupon_id       uuid := null;
  v_discount_pct    int := 0;
  v_order_id        uuid;
  v_total           numeric := 0;
  v_discount_amount numeric := 0;
  v_final_total     numeric := 0;
  v_item            jsonb;
begin
  select sum((item->>'unit_price')::numeric * (item->>'quantity')::int)
  into v_total
  from jsonb_array_elements(p_items) as item;

  if p_coupon_code is not null and p_coupon_code <> '' then
    select id, discount_percentage into v_coupon_id, v_discount_pct
    from coupons
    where code = p_coupon_code
      and is_active = true
      and (expiry_date is null or expiry_date > now());

    if v_coupon_id is not null then
      v_discount_amount := (v_total * v_discount_pct) / 100;
    end if;
  end if;

  v_final_total := v_total - v_discount_amount;

  insert into orders (
    customer_name, phone, address, notes,
    user_id, coupon_id,
    total_amount, final_amount, discount_amount,
    status
  )
  values (
    p_customer_name, p_phone, p_address, p_notes,
    p_customer_id,
    v_coupon_id,
    v_total::text,
    v_final_total::text,
    v_discount_amount::text,
    'pending'
  )
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    insert into order_items (
      order_id, product_id, product_name,
      quantity, unit_price, total_price
    )
    values (
      v_order_id,
      (v_item->>'product_id')::uuid,
      v_item->>'product_name',
      (v_item->>'quantity')::int,
      (v_item->>'unit_price')::text,
      ((v_item->>'unit_price')::numeric * (v_item->>'quantity')::int)::text
    );
  end loop;

  return jsonb_build_object(
    'order_id',       v_order_id,
    'original_total', v_total,
    'discount',       v_discount_amount,
    'final_total',    v_final_total
  );
end;
$$;

notify pgrst, 'reload schema';
