-- ============================================
-- Relax Properties — Database Schema
-- Run this in the Supabase SQL Editor
-- ============================================

-- Properties table
CREATE TABLE IF NOT EXISTS properties (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  property_id_external TEXT,

  -- Translatable text fields (SK = source, EN/CZ = auto-translated)
  title_sk TEXT NOT NULL,
  title_en TEXT,
  title_cz TEXT,
  description_sk TEXT,
  description_en TEXT,
  description_cz TEXT,
  location_sk TEXT NOT NULL,
  location_en TEXT,
  location_cz TEXT,
  location_description_sk TEXT,
  location_description_en TEXT,
  location_description_cz TEXT,

  -- Location data
  country TEXT NOT NULL,
  city TEXT NOT NULL,
  distance_from_sea INTEGER,

  -- Core specs
  property_type TEXT NOT NULL,
  status TEXT,
  ownership TEXT,
  disposition TEXT,
  beds INTEGER NOT NULL DEFAULT 0,
  baths INTEGER NOT NULL DEFAULT 0,
  area INTEGER NOT NULL DEFAULT 0,
  floors INTEGER,
  floor_number INTEGER,
  year INTEGER,
  parking INTEGER DEFAULT 0,
  available_from DATE,

  -- Price
  price INTEGER NOT NULL,
  price_on_request BOOLEAN DEFAULT FALSE,

  -- Feature flags
  pool BOOLEAN DEFAULT FALSE,
  balcony BOOLEAN DEFAULT FALSE,
  garden BOOLEAN DEFAULT FALSE,
  sea_view BOOLEAN DEFAULT FALSE,
  first_line BOOLEAN DEFAULT FALSE,
  new_build BOOLEAN DEFAULT FALSE,
  new_project BOOLEAN DEFAULT FALSE,
  luxury BOOLEAN DEFAULT FALSE,
  golf BOOLEAN DEFAULT FALSE,
  mountains BOOLEAN DEFAULT FALSE,

  -- Media (array of {url, alt, order})
  images JSONB DEFAULT '[]'::jsonb,

  -- SEO
  meta_title_sk TEXT,
  meta_title_en TEXT,
  meta_title_cz TEXT,
  meta_description_sk TEXT,
  meta_description_en TEXT,
  meta_description_cz TEXT,

  -- Tags
  tags TEXT[] DEFAULT '{}',

  -- Publishing
  featured BOOLEAN DEFAULT FALSE,
  publish_status TEXT DEFAULT 'draft',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast filtering
CREATE INDEX IF NOT EXISTS idx_properties_country ON properties(country);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(publish_status);
CREATE INDEX IF NOT EXISTS idx_properties_featured ON properties(featured);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_slug ON properties(slug);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Row Level Security (RLS)
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Public can read published properties
CREATE POLICY "Public can read published properties"
  ON properties FOR SELECT
  USING (publish_status = 'published');

-- Service role can do everything (admin operations)
CREATE POLICY "Service role has full access"
  ON properties FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- Video URL columns
-- ============================================
ALTER TABLE properties ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS hero_image_index INTEGER DEFAULT 0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS pdf_images INTEGER[] DEFAULT '{}';
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS video_url TEXT;

-- ============================================
-- Page Hero Images table
-- ============================================
CREATE TABLE IF NOT EXISTS page_hero_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key TEXT NOT NULL UNIQUE,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER page_hero_images_updated_at
  BEFORE UPDATE ON page_hero_images
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

ALTER TABLE page_hero_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read page hero images"
  ON page_hero_images FOR SELECT
  USING (true);

CREATE POLICY "Service role has full access to page_hero_images"
  ON page_hero_images FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- Hero Images table
-- ============================================
CREATE TABLE IF NOT EXISTS hero_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  image_url TEXT NOT NULL,
  title_sk TEXT,
  title_en TEXT,
  title_cz TEXT,
  subtitle_sk TEXT,
  subtitle_en TEXT,
  subtitle_cz TEXT,
  cta_link TEXT,
  display_order INT DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER hero_images_updated_at
  BEFORE UPDATE ON hero_images
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

ALTER TABLE hero_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active hero images"
  ON hero_images FOR SELECT
  USING (active = true);

CREATE POLICY "Service role has full access to hero_images"
  ON hero_images FOR ALL
  USING (true)
  WITH CHECK (true);
