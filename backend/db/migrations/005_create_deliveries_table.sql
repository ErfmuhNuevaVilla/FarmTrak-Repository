-- Create deliveries table for egg deliveries and feed tracking
CREATE TABLE deliveries (
    id BIGSERIAL PRIMARY KEY,
    submitted_by VARCHAR(255) NOT NULL,
    worker_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    client VARCHAR(255) NOT NULL,
    egg_trays INTEGER CHECK (egg_trays IS NULL OR egg_trays >= 0),
    feed_bags INTEGER CHECK (feed_bags IS NULL OR feed_bags >= 0),
    delivery_type VARCHAR(50) NOT NULL CHECK (delivery_type IN ('Outgoing Eggs', 'Ingoing Feed')),
    user_id UUID REFERENCES auth.users(id)
);

-- Create indexes for better query performance
CREATE INDEX idx_deliveries_created_at ON deliveries(created_at);
CREATE INDEX idx_deliveries_client ON deliveries(client);
CREATE INDEX idx_deliveries_submitted_by ON deliveries(submitted_by);
CREATE INDEX idx_deliveries_worker_name ON deliveries(worker_name);
CREATE INDEX idx_deliveries_delivery_type ON deliveries(delivery_type);

-- Add RLS (Row Level Security) policies
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all deliveries (for managers)
CREATE POLICY "Users can view all deliveries" ON deliveries
    FOR SELECT USING (auth.role() = 'manager');

-- Policy: Users can insert deliveries (for workers/managers)
CREATE POLICY "Users can insert deliveries" ON deliveries
    FOR INSERT WITH CHECK (auth.role() IN ('worker', 'manager'));

-- Policy: Users can update their own deliveries
CREATE POLICY "Users can update own deliveries" ON deliveries
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Only managers can delete deliveries
CREATE POLICY "Only managers can delete deliveries" ON deliveries
    FOR DELETE USING (auth.role() = 'manager');
