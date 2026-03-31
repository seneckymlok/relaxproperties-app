-- Hero Featured Properties table
-- Stores admin-selected properties for the homepage hero slider

CREATE TABLE IF NOT EXISTS hero_featured_properties (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    display_order integer NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT hero_featured_properties_property_id_key UNIQUE (property_id)
);

-- Allow service role full access (admin operations)
ALTER TABLE hero_featured_properties ENABLE ROW LEVEL SECURITY;

-- Public read access (homepage needs to read featured properties)
CREATE POLICY "Public can read hero featured properties"
    ON hero_featured_properties FOR SELECT
    USING (true);
