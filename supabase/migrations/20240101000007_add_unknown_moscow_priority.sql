-- Add 'UNKNOWN' to the valid_moscow_priority constraint
ALTER TABLE backlog_items DROP CONSTRAINT valid_moscow_priority;
ALTER TABLE backlog_items ADD CONSTRAINT valid_moscow_priority CHECK (moscow_priority IN ('MUST', 'SHOULD', 'COULD', 'WONT', 'UNKNOWN'));
ALTER TABLE backlog_items ALTER COLUMN moscow_priority SET DEFAULT 'UNKNOWN';
