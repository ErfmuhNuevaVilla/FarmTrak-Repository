-- Add maintenance column to buildings table
ALTER TABLE buildings 
ADD COLUMN maintenance BOOLEAN DEFAULT FALSE;

-- Add index for better query performance
CREATE INDEX idx_buildings_maintenance ON buildings(maintenance);
