ALTER TABLE users DROP INDEX idx_source;
ALTER TABLE users ADD UNIQUE KEY idx_source (source, source_id);
ALTER TABLE users DROP COLUMN issuer;
