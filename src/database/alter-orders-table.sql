-- ============================================
-- ALTER ORDERS TABLE - Add Missing Columns
-- ============================================
-- Run this if you already have an orders table that's missing columns

-- Add scheduled_date column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'scheduled_date'
  ) THEN
    ALTER TABLE orders ADD COLUMN scheduled_date DATE;
    RAISE NOTICE 'Added scheduled_date column';
  ELSE
    RAISE NOTICE 'scheduled_date column already exists';
  END IF;
END $$;

-- Add scheduled_time column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'scheduled_time'
  ) THEN
    ALTER TABLE orders ADD COLUMN scheduled_time TIME;
    RAISE NOTICE 'Added scheduled_time column';
  ELSE
    RAISE NOTICE 'scheduled_time column already exists';
  END IF;
END $$;

-- Add address column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'address'
  ) THEN
    ALTER TABLE orders ADD COLUMN address TEXT;
    RAISE NOTICE 'Added address column';
  ELSE
    RAISE NOTICE 'address column already exists';
  END IF;
END $$;

-- Add province column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'province'
  ) THEN
    ALTER TABLE orders ADD COLUMN province VARCHAR(255);
    RAISE NOTICE 'Added province column';
  ELSE
    RAISE NOTICE 'province column already exists';
  END IF;
END $$;

-- Add district column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'district'
  ) THEN
    ALTER TABLE orders ADD COLUMN district VARCHAR(255);
    RAISE NOTICE 'Added district column';
  ELSE
    RAISE NOTICE 'district column already exists';
  END IF;
END $$;

-- Add subdistrict column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'subdistrict'
  ) THEN
    ALTER TABLE orders ADD COLUMN subdistrict VARCHAR(255);
    RAISE NOTICE 'Added subdistrict column';
  ELSE
    RAISE NOTICE 'subdistrict column already exists';
  END IF;
END $$;

-- Add additional_info column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'additional_info'
  ) THEN
    ALTER TABLE orders ADD COLUMN additional_info TEXT;
    RAISE NOTICE 'Added additional_info column';
  ELSE
    RAISE NOTICE 'additional_info column already exists';
  END IF;
END $$;

-- Add promotion_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'promotion_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN promotion_id BIGINT;
    RAISE NOTICE 'Added promotion_id column';
  ELSE
    RAISE NOTICE 'promotion_id column already exists';
  END IF;
END $$;

-- Add discount column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'discount'
  ) THEN
    ALTER TABLE orders ADD COLUMN discount NUMERIC(10, 2) DEFAULT 0;
    RAISE NOTICE 'Added discount column';
  ELSE
    RAISE NOTICE 'discount column already exists';
  END IF;
END $$;

-- Add created_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE orders ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT now();
    RAISE NOTICE 'Added created_at column';
  ELSE
    RAISE NOTICE 'created_at column already exists';
  END IF;
END $$;

-- Add updated_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE orders ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
    RAISE NOTICE 'Added updated_at column';
  ELSE
    RAISE NOTICE 'updated_at column already exists';
  END IF;
END $$;

-- Add foreign key for promotion_id if it doesn't exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'promotions'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_orders_promotion'
  ) THEN
    ALTER TABLE orders ADD CONSTRAINT fk_orders_promotion 
    FOREIGN KEY (promotion_id) REFERENCES promotions(promotion_id) ON DELETE SET NULL;
    RAISE NOTICE 'Added foreign key for promotion_id';
  END IF;
END $$;

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger for orders table
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verify all columns exist
DO $$
DECLARE
  missing_cols TEXT;
BEGIN
  SELECT string_agg(col, ', ')
  INTO missing_cols
  FROM (
    SELECT unnest(ARRAY[
      'order_id', 'user_id', 'service_id', 'status', 'total_price',
      'scheduled_date', 'scheduled_time', 'address', 'province', 'district',
      'subdistrict', 'additional_info', 'promotion_id', 'discount',
      'created_at', 'updated_at'
    ]) AS col
  ) required
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = col
  );

  IF missing_cols IS NOT NULL THEN
    RAISE WARNING 'Still missing columns: %', missing_cols;
  ELSE
    RAISE NOTICE '✅ All required columns exist in orders table!';
  END IF;
END $$;

-- Show final structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;
