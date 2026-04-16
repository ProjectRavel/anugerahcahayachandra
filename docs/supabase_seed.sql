-- ============================================================
-- PT Anugerah Cahaya Chandra — Internal ERP
-- Supabase Seed Data (opsional)
-- ============================================================
-- Jalankan SETUP: supabase_schema.sql terlebih dahulu,
-- lalu jalankan file ini di Supabase SQL Editor.

-- 0. OPSIONAL: Sinkron data profiles dari auth.users
-- ------------------------------------------------------------
-- Sebelum bagian ini, sebaiknya Anda sudah membuat user di menu Auth → Users,
-- misalnya dengan email berikut (sesuaikan dengan kebutuhan):
--   manager@acc.co.id
--   supervisor@acc.co.id
--   admin.gudang@acc.co.id
--   packing1@acc.co.id
--   hr@acc.co.id
-- Setelah itu, bagian berikut akan memastikan tabel profiles terisi dan role-nya benar.

-- Manager
INSERT INTO profiles (id, full_name, role)
SELECT id, 'Manager Utama', 'MANAGER'::user_role
FROM auth.users
WHERE email = 'manager@acc.co.id'
ON CONFLICT (id) DO UPDATE
SET full_name = EXCLUDED.full_name,
    role       = EXCLUDED.role;

-- Supervisor
INSERT INTO profiles (id, full_name, role)
SELECT id, 'Supervisor Gudang', 'SUPERVISOR'::user_role
FROM auth.users
WHERE email = 'supervisor@acc.co.id'
ON CONFLICT (id) DO UPDATE
SET full_name = EXCLUDED.full_name,
    role       = EXCLUDED.role;

-- Admin Gudang
INSERT INTO profiles (id, full_name, role)
SELECT id, 'Admin Gudang', 'ADMIN_GUDANG'::user_role
FROM auth.users
WHERE email = 'admin.gudang@acc.co.id'
ON CONFLICT (id) DO UPDATE
SET full_name = EXCLUDED.full_name,
    role       = EXCLUDED.role;

-- Packing
INSERT INTO profiles (id, full_name, role)
SELECT id, 'Operator Packing 1', 'PACKING'::user_role
FROM auth.users
WHERE email = 'packing1@acc.co.id'
ON CONFLICT (id) DO UPDATE
SET full_name = EXCLUDED.full_name,
    role       = EXCLUDED.role;

-- HR
INSERT INTO profiles (id, full_name, role)
SELECT id, 'HR Officer', 'HR'::user_role
FROM auth.users
WHERE email = 'hr@acc.co.id'
ON CONFLICT (id) DO UPDATE
SET full_name = EXCLUDED.full_name,
    role       = EXCLUDED.role;


-- 1. SEED DATA PRODUK
-- ------------------------------------------------------------
-- Produk contoh untuk gudang / packing

INSERT INTO products (sku, name, stock, unit, price_retail, price_wholesale, min_stock_threshold)
VALUES
  ('ACC-BOX-001', 'Kardus Packing Kecil',    500, 'pcs',  2500,  2000, 100),
  ('ACC-BOX-002', 'Kardus Packing Sedang',   320, 'pcs',  3500,  3000, 100),
  ('ACC-BOX-003', 'Kardus Packing Besar',    180, 'pcs',  4500,  4000,  80),
  ('ACC-TAPE-01', 'Lakban Bening 48mm',      260, 'pcs',  8000,  7000,  60),
  ('ACC-TAPE-02', 'Lakban Coklat 48mm',      210, 'pcs',  8500,  7500,  60),
  ('ACC-PLST-01', 'Plastik Bubble Wrap 50m',  45, 'dus', 95000, 90000,  15),
  ('ACC-PLST-02', 'Plastik Wrap Pallet',      70, 'dus', 125000,120000, 20),
  ('ACC-LABEL1', 'Label Pengiriman Standar', 800, 'pcs',  500,   400, 150)
ON CONFLICT (sku) DO UPDATE
SET name                = EXCLUDED.name,
    unit                = EXCLUDED.unit,
    min_stock_threshold = EXCLUDED.min_stock_threshold;


-- 2. SEED DATA ORDER + ORDER ITEMS (contoh antrean)
-- ------------------------------------------------------------
-- Contoh beberapa order PENDING untuk tampilan antrean di dashboard.

-- Order INBOUND (menunggu proses) dibuat oleh Admin Gudang / Manager
INSERT INTO orders (type, status, created_by, notes)
SELECT 'INBOUND'::order_type,
       'PENDING'::order_status,
       p.id,
       'Seed: Penerimaan barang dari supplier A'
FROM profiles p
WHERE p.role IN ('ADMIN_GUDANG', 'MANAGER')
LIMIT 1;

-- Order OUTBOUND (menunggu packing) dibuat oleh Supervisor / Admin Gudang
INSERT INTO orders (type, status, created_by, notes)
SELECT 'OUTBOUND'::order_type,
       'PACKING'::order_status,
       p.id,
       'Seed: Pengiriman pesanan marketplace batch #1'
FROM profiles p
WHERE p.role IN ('SUPERVISOR', 'ADMIN_GUDANG', 'MANAGER')
ORDER BY p.created_at
LIMIT 1;

-- Order OUTBOUND lain (status PROCESSING)
INSERT INTO orders (type, status, created_by, notes)
SELECT 'OUTBOUND'::order_type,
       'PROCESSING'::order_status,
       p.id,
       'Seed: Pengiriman pesanan reseller offline'
FROM profiles p
WHERE p.role IN ('SUPERVISOR', 'ADMIN_GUDANG', 'MANAGER')
ORDER BY p.created_at DESC
LIMIT 1;

-- Item untuk order-order di atas (menggunakan sku tertentu)
INSERT INTO order_items (order_id, product_id, quantity)
SELECT o.id, pr.id, 50
FROM orders o
JOIN products pr ON pr.sku = 'ACC-BOX-001'
WHERE o.notes = 'Seed: Penerimaan barang dari supplier A'
LIMIT 1;

INSERT INTO order_items (order_id, product_id, quantity)
SELECT o.id, pr.id, 30
FROM orders o
JOIN products pr ON pr.sku = 'ACC-TAPE-01'
WHERE o.notes = 'Seed: Pengiriman pesanan marketplace batch #1'
LIMIT 1;

INSERT INTO order_items (order_id, product_id, quantity)
SELECT o.id, pr.id, 20
FROM orders o
JOIN products pr ON pr.sku = 'ACC-PLST-01'
WHERE o.notes = 'Seed: Pengiriman pesanan marketplace batch #1'
LIMIT 1;

INSERT INTO order_items (order_id, product_id, quantity)
SELECT o.id, pr.id, 15
FROM orders o
JOIN products pr ON pr.sku = 'ACC-BOX-003'
WHERE o.notes = 'Seed: Pengiriman pesanan reseller offline'
LIMIT 1;


-- 3. SEED DATA ABSENSI (contoh hari ini)
-- ------------------------------------------------------------
-- Memberikan contoh data absensi hari ini untuk beberapa role.

INSERT INTO attendance (user_id, check_in, check_out, date)
SELECT p.id,
       (now()::timestamptz - interval '9 hours') AS check_in,
       (now()::timestamptz - interval '1 hours') AS check_out,
       current_date
FROM profiles p
WHERE p.role IN ('PACKING', 'ADMIN_GUDANG', 'SUPERVISOR', 'HR', 'MANAGER')
ON CONFLICT (user_id, date) DO NOTHING;

-- ============================================================
-- END OF SEED
-- ============================================================
