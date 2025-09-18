-- Vrinda Sangha Database Initialization Script
-- This script runs when the PostgreSQL container starts for the first time

-- Create database if it doesn't exist (already created by POSTGRES_DB)
-- CREATE DATABASE vrinda_sangha;

-- Connect to the database
\c vrinda_sangha;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Set timezone
SET timezone = 'UTC';

-- Create a function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE vrinda_sangha TO vrinda_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO vrinda_user;

-- Create indexes for better performance (will be created by Prisma migrations)
-- These are just examples, actual indexes will be created by Prisma

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'Vrinda Sangha database initialized successfully!';
    RAISE NOTICE 'Database: vrinda_sangha';
    RAISE NOTICE 'User: vrinda_user';
    RAISE NOTICE 'Extensions: uuid-ossp, pg_trgm';
END $$;
