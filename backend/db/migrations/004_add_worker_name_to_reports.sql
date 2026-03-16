-- Add worker_name column to reports table
ALTER TABLE reports 
ADD COLUMN worker_name VARCHAR(255);

-- Add index for better query performance
CREATE INDEX idx_reports_worker_name ON reports(worker_name);
