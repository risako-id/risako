-- =====================================================
-- RISAKO: skema awal (stok, pesanan, keuangan)
-- Tempel di Supabase > SQL Editor > New query > Run
-- =====================================================

create extension if not exists "pgcrypto";

-- ---------- PRODUK & SKU (variasi) ----------
create table products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  tiktok_product_id text unique,
  created_at  timestamptz not null default now()
);

-- Satu produk punya 1 atau lebih SKU. Stok disimpan per SKU.
create table skus (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references products(id) on delete cascade,
  sku_code      text not null unique,
  variant_name  text,                         -- contoh: "Merah / L"
  cost_price    numeric(14,2) not null default 0,  -- harga modal
  sell_price    numeric(14,2) not null default 0,
  stock_qty     integer not null default 0,   -- diisi otomatis oleh trigger
  min_stock     integer not null default 0,   -- batas peringatan stok menipis
  tiktok_sku_id text unique,
  created_at    timestamptz not null default now()
);
create index on skus(product_id);

-- ---------- PERGERAKAN STOK (riwayat) ----------
-- Stok tidak diubah langsung, tapi lewat tabel ini.
create type movement_type as enum ('in', 'sale', 'return', 'adjustment');

create table stock_movements (
  id            uuid primary key default gen_random_uuid(),
  sku_id        uuid not null references skus(id) on delete cascade,
  movement_type movement_type not null,
  qty_change    integer not null,             -- positif = masuk, negatif = keluar
  order_item_id uuid,                         -- diisi untuk movement dari pesanan
  note          text,
  created_at    timestamptz not null default now()
);
create index on stock_movements(sku_id, created_at desc);

-- ---------- PESANAN ----------
create table orders (
  id              uuid primary key default gen_random_uuid(),
  tiktok_order_id text not null unique,
  status          text not null,              -- UNPAID, AWAITING_SHIPMENT, SHIPPED, COMPLETED, CANCELLED, dll
  total_amount    numeric(14,2) not null default 0,
  buyer_note      text,
  ordered_at      timestamptz,
  shipped_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index on orders(status);

create table order_items (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references orders(id) on delete cascade,
  sku_id     uuid references skus(id),
  tiktok_sku_id text,
  quantity   integer not null check (quantity > 0),
  unit_price numeric(14,2) not null default 0
);
create index on order_items(order_id);

alter table stock_movements
  add constraint stock_movements_order_item_fk
  foreign key (order_item_id) references order_items(id) on delete set null;

-- Anti-ganda: satu item pesanan hanya boleh memotong stok SEKALI,
-- walau webhook terkirim berulang.
create unique index one_sale_per_order_item
  on stock_movements(order_item_id)
  where movement_type = 'sale' and order_item_id is not null;

-- ---------- KEUANGAN (settlement) ----------
create table settlements (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid references orders(id) on delete set null,
  tiktok_order_id   text not null,
  tiktok_settlement_id text unique,
  gross_amount      numeric(14,2) not null default 0,  -- harga jual
  platform_fee      numeric(14,2) not null default 0,  -- komisi platform
  service_fee       numeric(14,2) not null default 0,  -- biaya layanan
  shipping_fee      numeric(14,2) not null default 0,
  other_fee         numeric(14,2) not null default 0,
  net_amount        numeric(14,2) not null default 0,  -- dana bersih diterima
  settled_at        timestamptz,
  created_at        timestamptz not null default now()
);
create index on settlements(tiktok_order_id);
create index on settlements(settled_at);

-- ---------- TOKEN TIKTOK ----------
create table tiktok_tokens (
  id                 uuid primary key default gen_random_uuid(),
  shop_id            text not null unique,
  access_token       text not null,
  refresh_token      text not null,
  access_expires_at  timestamptz,
  refresh_expires_at timestamptz,
  updated_at         timestamptz not null default now()
);

-- ---------- TRIGGER: stok otomatis mengikuti riwayat ----------
create or replace function apply_stock_movement() returns trigger as $$
begin
  update skus set stock_qty = stock_qty + new.qty_change where id = new.sku_id;
  return new;
end;
$$ language plpgsql;

create trigger trg_apply_stock_movement
after insert on stock_movements
for each row execute function apply_stock_movement();

-- ---------- KEAMANAN (Row Level Security) ----------
-- Semua tabel dikunci. Tanpa policy, hanya server (service role key)
-- yang bisa mengakses. Policy untuk login pengguna ditambah nanti.
alter table products       enable row level security;
alter table skus           enable row level security;
alter table stock_movements enable row level security;
alter table orders         enable row level security;
alter table order_items    enable row level security;
alter table settlements    enable row level security;
alter table tiktok_tokens  enable row level security;
