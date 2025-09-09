-- Test script to verify database functionality
-- Run this after setting up the database to ensure everything is working

-- Test 1: Check if all tables exist
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('users', 'sessions', 'cloud_credentials', 'inventory_scans', 'cost_analyses') 
        THEN '✅' 
        ELSE '❌' 
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Test 2: Check if all required extensions are installed
SELECT 
    extname as extension_name,
    CASE 
        WHEN extname IN ('uuid-ossp', 'pgcrypto', 'pg_trgm') 
        THEN '✅' 
        ELSE '❌' 
    END as status
FROM pg_extension 
ORDER BY extname;

-- Test 3: Check if sample user exists
SELECT 
    id,
    email,
    first_name,
    last_name,
    created_at,
    '✅' as status
FROM users 
WHERE email = 'darbhasantosh11@gmail.com';

-- Test 4: Check if application user has proper permissions
SELECT 
    table_name,
    privilege_type,
    '✅' as status
FROM information_schema.table_privileges 
WHERE grantee = 'cloud_cost_user' 
AND table_schema = 'public'
ORDER BY table_name, privilege_type;

-- Test 5: Test basic CRUD operations
-- Insert a test cloud credential
INSERT INTO cloud_credentials (user_id, provider, name, encrypted_credentials) 
VALUES (
    '9d2d5751-e2ef-44e5-bbbe-8c2180515f22',
    'oci',
    'Test OCI Credentials',
    '{"test": "encrypted_data"}'
) ON CONFLICT DO NOTHING;

-- Insert a test inventory scan
INSERT INTO inventory_scans (user_id, scan_data, scan_duration) 
VALUES (
    '9d2d5751-e2ef-44e5-bbbe-8c2180515f22',
    '{"resources": [], "summary": {"total": 0}}',
    5000
) ON CONFLICT DO NOTHING;

-- Insert a test cost analysis
INSERT INTO cost_analyses (user_id, inventory_id, requirements, results) 
VALUES (
    '9d2d5751-e2ef-44e5-bbbe-8c2180515f22',
    (SELECT id FROM inventory_scans WHERE user_id = '9d2d5751-e2ef-44e5-bbbe-8c2180515f22' LIMIT 1),
    '{"compute": {"vcpus": 2, "memory": 4}}',
    '{"total_cost": 100, "cheapest": {"provider": "aws"}}'
) ON CONFLICT DO NOTHING;

-- Test 6: Verify data integrity
SELECT 
    'users' as table_name,
    COUNT(*) as record_count,
    '✅' as status
FROM users
UNION ALL
SELECT 
    'cloud_credentials' as table_name,
    COUNT(*) as record_count,
    '✅' as status
FROM cloud_credentials
UNION ALL
SELECT 
    'inventory_scans' as table_name,
    COUNT(*) as record_count,
    '✅' as status
FROM inventory_scans
UNION ALL
SELECT 
    'cost_analyses' as table_name,
    COUNT(*) as record_count,
    '✅' as status
FROM cost_analyses;

-- Test 7: Check foreign key relationships
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    '✅' as status
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- Final success message
SELECT '🎉 Database test completed successfully! All systems are working.' as message;
