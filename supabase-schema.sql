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
  customer_name text,
  phone text not null,
  address text not null,
  notes text,
  status text not null default 'pending',
  total_amount numeric not null default 0,
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
