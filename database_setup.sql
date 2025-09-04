-- Cloud Cost Optimizer Database Setup
-- PostgreSQL DDL Script for complete database schema

-- Create database (run this separately if needed)
CREATE DATABASE cloud_cost_optimizer;

-- Connect to the database
\c cloud_cost_optimizer;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables if they exist (be careful in production!)
-- DROP TABLE IF EXISTS cost_analyses CASCADE;

-- Create cost_analyses table
CREATE TABLE cost_analyses (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    requirements JSONB NOT NULL,
    results JSONB NOT NULL,
    created_at TEXT DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cost_analyses_created_at ON cost_analyses(created_at);
CREATE INDEX IF NOT EXISTS idx_cost_analyses_requirements ON cost_analyses USING GIN(requirements);
CREATE INDEX IF NOT EXISTS idx_cost_analyses_results ON cost_analyses USING GIN(results);

-- Create indexes on specific JSONB fields for common queries
CREATE INDEX IF NOT EXISTS idx_cost_analyses_currency ON cost_analyses USING GIN((requirements->'currency'));
CREATE INDEX IF NOT EXISTS idx_cost_analyses_compute_vcpus ON cost_analyses USING GIN((requirements->'compute'->'vcpus'));
CREATE INDEX IF NOT EXISTS idx_cost_analyses_cheapest_provider ON cost_analyses USING GIN((results->'cheapest'->'name'));

-- Add comments to table and columns
COMMENT ON TABLE cost_analyses IS 'Stores cloud cost analysis requests and results';
COMMENT ON COLUMN cost_analyses.id IS 'Unique identifier for each cost analysis';
COMMENT ON COLUMN cost_analyses.requirements IS 'JSON object containing infrastructure requirements and preferences';
COMMENT ON COLUMN cost_analyses.results IS 'JSON object containing cost calculation results for all providers';
COMMENT ON COLUMN cost_analyses.created_at IS 'Timestamp when the analysis was created';

-- Sample data insertion (optional - remove if not needed)
-- INSERT INTO cost_analyses (requirements, results) VALUES 
-- (
--     '{"currency": "USD", "compute": {"vcpus": 4, "ram": 16, "instanceType": "general-purpose", "region": "us-east-1"}}',
--     '{"providers": [{"name": "AWS", "total": 150.00}, {"name": "Azure", "total": 145.00}], "cheapest": {"name": "Azure", "total": 145.00}}'
-- );

-- Grant permissions (adjust as needed for your environment)
-- GRANT ALL PRIVILEGES ON TABLE cost_analyses TO your_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_app_user;

-- Verify table creation
\d+ cost_analyses;

-- Show all tables in the database
\dt;

PRINT 'Database setup completed successfully!';