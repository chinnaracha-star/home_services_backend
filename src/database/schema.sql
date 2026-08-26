CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  full_name text NOT NULL,
  phone text,
  address text,
  avatar_url text,
  role text NOT NULL DEFAULT 'USER' CHECK (UPPER(role) IN ('USER', 'ADMIN', 'TECHNICIAN')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
  category_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS promotions (
  promotion_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  promotion_code VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  quota INTEGER DEFAULT 0,
  quota_used INTEGER DEFAULT 0,
  type VARCHAR(50) NOT NULL,
  discount NUMERIC NOT NULL,
  expire TIMESTAMPTZ,
  create_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  update_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

DO $$
DECLARE
  role_constraint_name text;
BEGIN
  SELECT con.conname
  INTO role_constraint_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  WHERE nsp.nspname = 'public'
    AND rel.relname = 'users'
    AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) ILIKE '%IN (%USER%'
  LIMIT 1;

  IF role_constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.users DROP CONSTRAINT %I', role_constraint_name);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_role_check'
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_role_check
      CHECK (UPPER(role) IN ('USER', 'ADMIN', 'TECHNICIAN'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS technicians (
  technician_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE,
  is_available BOOLEAN NOT NULL DEFAULT false,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'user_id'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'technicians_user_id_fkey'
  ) THEN
    ALTER TABLE technicians
      ADD CONSTRAINT technicians_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users(user_id);
  END IF;
END $$;

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_name TEXT;

CREATE TABLE IF NOT EXISTS technician_skills (
  technician_id BIGINT NOT NULL,
  service_id BIGINT NOT NULL,
  PRIMARY KEY (technician_id, service_id)
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'technicians'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'technician_skills_technician_id_fkey'
  ) THEN
    ALTER TABLE technician_skills
      ADD CONSTRAINT technician_skills_technician_id_fkey
      FOREIGN KEY (technician_id) REFERENCES technicians(technician_id) ON DELETE CASCADE;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'services'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'technician_skills_service_id_fkey'
  ) THEN
    ALTER TABLE technician_skills
      ADD CONSTRAINT technician_skills_service_id_fkey
      FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE CASCADE;
  END IF;
END $$;

ALTER TABLE technicians ADD COLUMN IF NOT EXISTS current_latitude NUMERIC(9, 6);
ALTER TABLE technicians ADD COLUMN IF NOT EXISTS current_longitude NUMERIC(9, 6);
ALTER TABLE technicians ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMPTZ;

INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Avatar images are publicly readable'
  ) THEN
    CREATE POLICY "Avatar images are publicly readable"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'avatars');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users can upload own avatar'
  ) THEN
    CREATE POLICY "Users can upload own avatar"
      ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users can update own avatar'
  ) THEN
    CREATE POLICY "Users can update own avatar"
      ON storage.objects FOR UPDATE TO authenticated
      USING (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
      )
      WITH CHECK (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

-- ============================================
-- ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  order_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL,
  service_id BIGINT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  total_price NUMERIC(10, 2) NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  address TEXT NOT NULL,
  province VARCHAR(255) NOT NULL,
  district VARCHAR(255) NOT NULL,
  subdistrict VARCHAR(255) NOT NULL,
  additional_info TEXT,
  promotion_id BIGINT,
  discount NUMERIC(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create order_items table for additional service options
CREATE TABLE IF NOT EXISTS order_items (
  order_item_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id BIGINT NOT NULL,
  option_id BIGINT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
);

-- Payments are separate from order_items, which represent selected service options.
CREATE TABLE IF NOT EXISTS payments (
  payment_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id BIGINT NOT NULL,
  payment_method VARCHAR(100) NOT NULL,
  payment_status VARCHAR(50) NOT NULL,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
);

-- Add foreign key constraints for orders
DO $$
BEGIN
  -- Add user_id foreign key if users table exists with user_id column
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'user_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_orders_user'
  ) THEN
    ALTER TABLE orders ADD CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;
  END IF;

  -- Add promotion_id foreign key
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'promotions'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_orders_promotion'
  ) THEN
    ALTER TABLE orders ADD CONSTRAINT fk_orders_promotion FOREIGN KEY (promotion_id) REFERENCES promotions(promotion_id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for orders
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_service_id ON orders(service_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_scheduled_date ON orders(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create updated_at trigger for orders
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
