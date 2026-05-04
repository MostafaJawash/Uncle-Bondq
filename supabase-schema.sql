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

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null,
  customer_name text,
  phone text not null,
  address text not null,
  notes text,
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

-- Drop existing function if exists
drop function if exists create_order(uuid, text, text, text, text, text, jsonb);

-- Create RPC function to create order with proper UUID type for customer_id
create or replace function create_order(
  p_customer_id uuid,
  p_customer_name text,
  p_phone text,
  p_address text,
  p_notes text,
  p_coupon_code text,
  p_items jsonb
)
returns table(order_id uuid, final_total numeric, created_at timestamptz) as $$
declare
  v_order_id uuid;
  v_total_amount numeric := 0;
  v_discount_amount numeric;
  v_final_amount numeric;
  v_item jsonb;
  v_product_id uuid;
begin
  -- Validate inputs
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Order must contain at least one item';
  end if;

  -- Calculate total from items
  select coalesce(sum((item->>'quantity')::integer * (item->>'unit_price')::numeric), 0)
  into v_total_amount
  from jsonb_array_elements(p_items) as item;

  -- Calculate discount using coupon code
  v_discount_amount := get_coupon_discount(p_coupon_code, v_total_amount);
  v_final_amount := v_total_amount - v_discount_amount;

  -- Insert order with customer_id
  insert into orders (customer_id, customer_name, phone, address, notes, total_amount, discount_amount, final_amount)
  values (p_customer_id, p_customer_name, p_phone, p_address, p_notes, v_total_amount, v_discount_amount, v_final_amount)
  returning orders.id into v_order_id;

  -- Insert order items
  for v_item in select jsonb_array_elements(p_items)
  loop
    -- Try to convert product_id to UUID if it's a valid UUID, otherwise set to NULL
    begin
      v_product_id := (v_item->>'product_id')::uuid;
    exception when others then
      v_product_id := null;
    end;

    insert into order_items (order_id, product_id, product_name, quantity, unit_price, total_price)
    values (
      v_order_id,
      v_product_id,
      v_item->>'product_name',
      (v_item->>'quantity')::integer,
      (v_item->>'unit_price')::numeric,
      ((v_item->>'quantity')::integer * (v_item->>'unit_price')::numeric)
    );
  end loop;

  -- Return order details
  return query select v_order_id, v_final_amount, now();
end;
$$ language plpgsql;
