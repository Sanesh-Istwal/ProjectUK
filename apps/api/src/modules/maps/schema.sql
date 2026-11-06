-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Places table
CREATE TABLE IF NOT EXISTS places (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(60) DEFAULT 'landmark',
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    location GEOMETRY(Point, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automatically set the geometry point on insert or update
CREATE OR REPLACE FUNCTION update_places_geom() RETURNS trigger AS $$
BEGIN
    NEW.location := ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_places_geom ON places;
CREATE TRIGGER trg_places_geom
BEFORE INSERT OR UPDATE ON places
FOR EACH ROW
EXECUTE FUNCTION update_places_geom();

-- Spatial index for high performance bounding box / viewport queries
CREATE INDEX IF NOT EXISTS idx_places_location ON places USING GIST (location);

-- Seed Landmarks across the UK
INSERT INTO places (title, description, category, lat, lng) VALUES
('Tower Bridge', 'Victorian engine-powered suspension bridge across the River Thames.', 'landmark', 51.5055, -0.0754),
('Big Ben & Westminster', 'Iconic Elizabeth Tower and the Houses of Parliament.', 'landmark', 51.5007, -0.1246),
('Edinburgh Castle', 'Historic fortress dominating the skyline of the city of Edinburgh.', 'historic', 55.9486, -3.1999),
('Stonehenge', 'Prehistoric megalithic monument on Salisbury Plain.', 'historic', 51.1789, -1.8262),
('Roman Baths', 'Ancient Roman public bathing site in the city of Bath.', 'historic', 51.3810, -2.3596),
('Giant''s Causeway', 'Area of about 40,000 interlocking basalt columns in Northern Ireland.', 'nature', 55.2408, -6.5116),
('Windermere', 'The largest natural lake in England, located in the Lake District National Park.', 'nature', 54.3820, -2.9090),
('Eryri (Snowdonia)', 'Dramatic mountainous national park in North Wales.', 'nature', 53.0685, -4.0763),
('York Minster', 'One of the largest cathedrals of its kind in Northern Europe.', 'historic', 53.9623, -1.0819),
('St Ives Bay', 'Stunning coastal resort town and surf haven in Cornwall.', 'nature', 50.2110, -5.4800)
ON CONFLICT DO NOTHING;

