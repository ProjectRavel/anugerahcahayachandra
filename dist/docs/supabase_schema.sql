-- ============================================================
-- PT Anugerah Cahaya Chandra — Internal ERP
-- Supabase PostgreSQL Schema
-- ============================================================

-- 1. ENUM TYPES
-- ------------------------------------------------------------
CREATE TYPE user_role AS ENUM ('HR', 'SUPERVISOR', 'ADMIN_GUDANG', 'PACKING', 'MANAGER');
CREATE TYPE user_status AS ENUM ('active', 'inactive');
CREATE TYPE product_unit AS ENUM ('pcs', 'dus');
CREATE TYPE order_type AS ENUM ('INBOUND', 'OUTBOUND');
CREATE TYPE order_status AS ENUM ('PENDING', 'PROCESSING', 'PACKING', 'SHIPPED', 'COMPLETED');

-- 2. TABLES
-- ------------------------------------------------------------

-- profiles: Extends Supabase auth.users via trigger
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  role        user_role NOT NULL DEFAULT 'PACKING',
  status      user_status NOT NULL DEFAULT 'active',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- products: Inventory catalog
CREATE TABLE products (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku                   TEXT NOT NULL UNIQUE,
  name                  TEXT NOT NULL,
  stock                 INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  unit                  product_unit NOT NULL DEFAULT 'pcs',
  price_retail          NUMERIC(12, 2) NOT NULL DEFAULT 0,
  price_wholesale       NUMERIC(12, 2) NOT NULL DEFAULT 0,
  min_stock_threshold   INTEGER NOT NULL DEFAULT 10,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- orders: Header transaksi masuk/keluar
CREATE TABLE orders (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type        order_type NOT NULL,
  status      order_status NOT NULL DEFAULT 'PENDING',
  created_by  UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- order_items: Detail barang per transaksi (1 order → banyak item)
CREATE TABLE order_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity    INTEGER NOT NULL CHECK (quantity > 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- attendance: Absensi karyawan harian
CREATE TABLE attendance (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  check_in    TIMESTAMPTZ,
  check_out   TIMESTAMPTZ,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Satu user hanya boleh punya satu record per hari
  UNIQUE (user_id, date)
);

-- 3. INDEXES
-- ------------------------------------------------------------
CREATE INDEX idx_orders_status      ON orders(status);
CREATE INDEX idx_orders_created_by  ON orders(created_by);
CREATE INDEX idx_order_items_order  ON order_items(order_id);
CREATE INDEX idx_attendance_user    ON attendance(user_id);
CREATE INDEX idx_attendance_date    ON attendance(date);
CREATE INDEX idx_products_sku       ON products(sku);
CREATE INDEX idx_products_low_stock ON products(stock) WHERE stock <= min_stock_threshold;

-- 4. AUTO-UPDATE updated_at TRIGGER
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 5. AUTO-CREATE PROFILE TRIGGER
-- Setiap user baru di auth.users otomatis dibuatkan profile
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Pengguna Baru'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'PACKING')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 6. STOCK ADJUSTMENT TRIGGER (INTI BISNIS)
-- Saat order berstatus COMPLETED:
-- - INBOUND  → stok BERTAMBAH
-- - OUTBOUND → stok BERKURANG
-- Dipicu saat status order diupdate ke COMPLETED
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION adjust_stock_on_completion()
RETURNS TRIGGER AS $$
DECLARE
  item       RECORD;
  multiplier INTEGER;
BEGIN
  -- Hanya proses saat status berubah MENJADI 'COMPLETED'
  IF OLD.status = 'COMPLETED' OR NEW.status <> 'COMPLETED' THEN
    RETURN NEW;
  END IF;

  -- Tentukan arah perubahan stok berdasarkan tipe order
  IF NEW.type = 'INBOUND' THEN
    multiplier := 1;   -- Stok bertambah
  ELSE
    multiplier := -1;  -- Stok berkurang
  END IF;

  -- Loop seluruh item dalam order ini
  FOR item IN
    SELECT product_id, quantity
    FROM order_items
    WHERE order_id = NEW.id
  LOOP
    -- Update stok dengan validasi tidak boleh negatif
    UPDATE products
    SET stock = stock + (multiplier * item.quantity)
    WHERE id = item.product_id;

    -- Validasi: cegah stok negatif untuk OUTBOUND
    IF multiplier = -1 THEN
      IF (SELECT stock FROM products WHERE id = item.product_id) < 0 THEN
        RAISE EXCEPTION
          'Stok tidak mencukupi untuk produk %', item.product_id
          USING ERRCODE = 'P0001';
      END IF;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_adjust_stock_on_completion
  AFTER UPDATE OF status ON orders
  FOR EACH ROW EXECUTE FUNCTION adjust_stock_on_completion();

-- 7. ROW LEVEL SECURITY (RLS)
-- ------------------------------------------------------------

-- Aktifkan RLS di semua tabel
ALTER TABLE profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE products   ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders     ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Helper function: ambil role dari profiles
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- PROFILES: User hanya bisa lihat profilnya sendiri
-- HR & MANAGER bisa lihat semua
CREATE POLICY "profiles_select_own"     ON profiles FOR SELECT
  USING (id = auth.uid() OR get_my_role() IN ('HR', 'MANAGER'));
CREATE POLICY "profiles_update_own"     ON profiles FOR UPDATE
  USING (id = auth.uid());
CREATE POLICY "profiles_hr_manage"      ON profiles FOR ALL
  USING (get_my_role() IN ('HR', 'MANAGER'));

-- PRODUCTS: Semua bisa baca, hanya ADMIN_GUDANG & MANAGER yang bisa ubah
CREATE POLICY "products_all_read"       ON products FOR SELECT
  USING (auth.role() = 'authenticated');
CREATE POLICY "products_gudang_write"   ON products FOR ALL
  USING (get_my_role() IN ('ADMIN_GUDANG', 'MANAGER'));

-- ORDERS: Semua bisa baca, ADMIN_GUDANG & SUPERVISOR bisa buat/ubah
CREATE POLICY "orders_all_read"         ON orders FOR SELECT
  USING (auth.role() = 'authenticated');
CREATE POLICY "orders_create"           ON orders FOR INSERT
  WITH CHECK (get_my_role() IN ('ADMIN_GUDANG', 'SUPERVISOR', 'MANAGER'));
CREATE POLICY "orders_update"           ON orders FOR UPDATE
  USING (get_my_role() IN ('ADMIN_GUDANG', 'SUPERVISOR', 'PACKING', 'MANAGER'));

-- ORDER_ITEMS: Ikuti akses orders
CREATE POLICY "order_items_all_read"    ON order_items FOR SELECT
  USING (auth.role() = 'authenticated');
CREATE POLICY "order_items_write"       ON order_items FOR ALL
  USING (get_my_role() IN ('ADMIN_GUDANG', 'SUPERVISOR', 'MANAGER'));

-- ATTENDANCE: User lihat absensinya sendiri, HR lihat semua
CREATE POLICY "attendance_own"          ON attendance FOR SELECT
  USING (user_id = auth.uid() OR get_my_role() IN ('HR', 'MANAGER'));
CREATE POLICY "attendance_insert_own"   ON attendance FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "attendance_update_own"   ON attendance FOR UPDATE
  USING (user_id = auth.uid() OR get_my_role() = 'HR');

-- 8. VIEWS UNTUK REPORTING
-- ------------------------------------------------------------

-- View: Produk dengan status stok
CREATE OR REPLACE VIEW v_product_stock_status AS
SELECT
  id, sku, name, stock, unit,
  min_stock_threshold,
  price_retail,
  price_wholesale,
  CASE
    WHEN stock = 0                        THEN 'HABIS'
    WHEN stock <= min_stock_threshold     THEN 'HAMPIR HABIS'
    ELSE                                       'AMAN'
  END AS stock_status
FROM products;

-- View: Ringkasan order hari ini
CREATE OR REPLACE VIEW v_orders_today AS
SELECT
  o.id, o.type, o.status,
  p.full_name AS created_by_name,
  COUNT(oi.id) AS total_items,
  o.created_at
FROM orders o
LEFT JOIN profiles p ON o.created_by = p.id
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.created_at::date = CURRENT_DATE
GROUP BY o.id, o.type, o.status, p.full_name, o.created_at;
