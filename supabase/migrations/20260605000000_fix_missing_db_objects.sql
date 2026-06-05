-- Add bp_extracted_fields column to kb_sources (was created via dashboard)
ALTER TABLE kb_sources
ADD COLUMN IF NOT EXISTS bp_extracted_fields text[] DEFAULT '{}';

-- Create required_info_templates table if it doesn't exist
CREATE TABLE IF NOT EXISTS required_info_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    business_type text NOT NULL DEFAULT 'hotel',
    section text NOT NULL,
    field_key text NOT NULL,
    label text NOT NULL,
    field_type text NOT NULL DEFAULT 'text',
    description text,
    priority integer NOT NULL DEFAULT 0,
    is_required boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE required_info_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY required_info_templates_rls ON required_info_templates
    FOR ALL
    USING (true);

-- Seed templates for hotel
INSERT INTO required_info_templates (business_type, section, field_key, label, field_type, description, priority, is_required)
VALUES
    ('hotel', 'business_profile', 'contact', 'Contact Info', 'contact', 'Phone, email, address', 1, true),
    ('hotel', 'business_profile', 'hours', 'Hours', 'hours', 'Business hours for each day', 2, true),
    ('hotel', 'business_profile', 'policies', 'Policies', 'policies', 'Cancellation, pets, smoking, children, payment', 3, false),
    ('hotel', 'business_profile', 'amenities', 'Amenities', 'amenities', 'wifi, parking, pool, gym, spa', 4, true),
    ('hotel', 'business_profile', 'pricing', 'Pricing', 'pricing', 'Room rates and currency', 5, true),
    ('hotel', 'business_profile', 'extras.check_in', 'Check-in Time', 'time', 'Standard check-in time', 6, false),
    ('hotel', 'business_profile', 'extras.check_out', 'Check-out Time', 'time', 'Standard check-out time', 7, false),
    ('hotel', 'business_profile', 'extras.rooms', 'Rooms', 'rooms', 'Room types and rates', 8, false),
    ('hotel', 'business_profile', 'extras.cuisine', 'Cuisine', 'text', 'Type of cuisine', 9, false),
    ('hotel', 'business_profile', 'extras.services', 'Services', 'tags', 'Additional services', 10, false),
    ('hotel', 'knowledge_base', 'property_overview', 'Property Overview', 'text', 'Overview of property', 1, false),
    ('hotel', 'knowledge_base', 'location', 'Location and Area', 'text', 'Location and nearby attractions', 2, false),
    ('hotel', 'knowledge_base', 'policies_rules', 'Policies and Rules', 'text', 'Cancellation, pet policy, etc', 3, false),
    ('hotel', 'knowledge_base', 'dining', 'Dining and Restaurants', 'text', 'Restaurants, bars, room service', 4, false),
    ('hotel', 'knowledge_base', 'activities', 'Activities and Events', 'text', 'Activities, events, excursions', 5, false)
ON CONFLICT DO NOTHING;

-- Seed templates for dental
INSERT INTO required_info_templates (business_type, section, field_key, label, field_type, description, priority, is_required)
VALUES
    ('dental', 'business_profile', 'contact', 'Contact Info', 'contact', 'Phone, email, address', 1, true),
    ('dental', 'business_profile', 'hours', 'Hours', 'hours', 'Business hours', 2, true),
    ('dental', 'business_profile', 'policies', 'Policies', 'policies', 'Appointment, cancellation', 3, false),
    ('dental', 'business_profile', 'amenities', 'Services', 'tags', 'Root canal, implants, braces', 4, true),
    ('dental', 'business_profile', 'pricing', 'Pricing', 'pricing', 'Service range and currency', 5, false),
    ('dental', 'business_profile', 'extras.specialties', 'Specialties', 'tags', 'Specialized treatments', 6, false),
    ('dental', 'knowledge_base', 'practice_overview', 'Practice Overview', 'text', 'Overview of the practice', 1, false),
    ('dental', 'knowledge_base', 'location', 'Location and Area', 'text', 'Location and accessibility', 2, false),
    ('dental', 'knowledge_base', 'treatments', 'Treatments and Services', 'text', 'All treatments offered', 3, false),
    ('dental', 'knowledge_base', 'insurance', 'Insurance and Payment', 'text', 'Insurance accepted, payment options', 4, false),
    ('dental', 'knowledge_base', 'faq', 'FAQ', 'text', 'Frequently asked questions', 5, false)
ON CONFLICT DO NOTHING;

-- Seed templates for restaurant
INSERT INTO required_info_templates (business_type, section, field_key, label, field_type, description, priority, is_required)
VALUES
    ('restaurant', 'business_profile', 'contact', 'Contact Info', 'contact', 'Phone, email, address', 1, true),
    ('restaurant', 'business_profile', 'hours', 'Hours', 'hours', 'Business hours', 2, true),
    ('restaurant', 'business_profile', 'policies', 'Policies', 'policies', 'Reservation, dress code', 3, false),
    ('restaurant', 'business_profile', 'amenities', 'Features', 'tags', 'outdoor_seating, wifi, parking', 4, false),
    ('restaurant', 'business_profile', 'pricing', 'Pricing', 'pricing', 'Price range and currency', 5, true),
    ('restaurant', 'business_profile', 'extras.cuisine', 'Cuisine Type', 'text', 'Type of cuisine', 6, true),
    ('restaurant', 'business_profile', 'extras.seating_capacity', 'Seating Capacity', 'number', 'Total seating capacity', 7, false),
    ('restaurant', 'knowledge_base', 'restaurant_overview', 'Restaurant Overview', 'text', 'Overview of the restaurant', 1, false),
    ('restaurant', 'knowledge_base', 'location', 'Location and Area', 'text', 'Location details', 2, false),
    ('restaurant', 'knowledge_base', 'menu', 'Menu', 'text', 'Menu items and descriptions', 3, false),
    ('restaurant', 'knowledge_base', 'faq', 'FAQ', 'text', 'Frequently asked questions', 4, false)
ON CONFLICT DO NOTHING;

-- Seed templates for spa
INSERT INTO required_info_templates (business_type, section, field_key, label, field_type, description, priority, is_required)
VALUES
    ('spa', 'business_profile', 'contact', 'Contact Info', 'contact', 'Phone, email, address', 1, true),
    ('spa', 'business_profile', 'hours', 'Hours', 'hours', 'Business hours', 2, true),
    ('spa', 'business_profile', 'policies', 'Policies', 'policies', 'Cancellation, appointment', 3, false),
    ('spa', 'business_profile', 'amenities', 'Treatments', 'tags', 'massage, facial, sauna', 4, true),
    ('spa', 'business_profile', 'pricing', 'Pricing', 'pricing', 'Treatment range and currency', 5, true),
    ('spa', 'business_profile', 'extras.class_types', 'Class Types', 'tags', 'Yoga, meditation', 6, false),
    ('spa', 'knowledge_base', 'spa_overview', 'Spa Overview', 'text', 'Overview of the spa', 1, false),
    ('spa', 'knowledge_base', 'treatments', 'Treatments and Services', 'text', 'All treatments and services', 2, false),
    ('spa', 'knowledge_base', 'location', 'Location and Area', 'text', 'Location details', 3, false),
    ('spa', 'knowledge_base', 'faq', 'FAQ', 'text', 'Frequently asked questions', 4, false)
ON CONFLICT DO NOTHING;

-- Seed templates for fitness
INSERT INTO required_info_templates (business_type, section, field_key, label, field_type, description, priority, is_required)
VALUES
    ('fitness', 'business_profile', 'contact', 'Contact Info', 'contact', 'Phone, email, address', 1, true),
    ('fitness', 'business_profile', 'hours', 'Hours', 'hours', 'Business hours', 2, true),
    ('fitness', 'business_profile', 'policies', 'Policies', 'policies', 'Membership, cancellation', 3, false),
    ('fitness', 'business_profile', 'amenities', 'Amenities', 'tags', 'weights, cardio, sauna', 4, true),
    ('fitness', 'business_profile', 'pricing', 'Pricing', 'pricing', 'Membership range and currency', 5, true),
    ('fitness', 'business_profile', 'extras.class_types', 'Class Types', 'tags', 'Yoga, spin, HIIT', 6, false),
    ('fitness', 'knowledge_base', 'gym_overview', 'Gym Overview', 'text', 'Overview of the gym', 1, false),
    ('fitness', 'knowledge_base', 'facilities', 'Facilities and Equipment', 'text', 'Available facilities and equipment', 2, false),
    ('fitness', 'knowledge_base', 'classes', 'Classes and Programs', 'text', 'Classes and training programs', 3, false),
    ('fitness', 'knowledge_base', 'membership', 'Membership', 'text', 'Membership plans and pricing', 4, false)
ON CONFLICT DO NOTHING;

-- Create get_distinct_kb_tags RPC
CREATE OR REPLACE FUNCTION get_distinct_kb_tags(p_workspace_id uuid)
RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS \$\$
DECLARE
    tags text[];
BEGIN
    SELECT array_agg(DISTINCT t.tag)
    INTO tags
    FROM (
        SELECT jsonb_array_elements_text(
            CASE
                WHEN metadata IS NOT NULL AND metadata ? 'tag'
                THEN jsonb_build_array(metadata->>'tag')
                ELSE '[]'::jsonb
            END
        ) AS tag
        FROM kb_chunks
        WHERE workspace_id = p_workspace_id
        AND deleted_at IS NULL
    ) t
    WHERE t.tag IS NOT NULL AND t.tag != '';
    RETURN COALESCE(tags, '{}'::text[]);
END;
\$\$;
