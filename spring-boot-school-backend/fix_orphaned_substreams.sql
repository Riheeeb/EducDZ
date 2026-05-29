-- Diagnostic queries to check for orphaned data
-- Run these first to see what's wrong:

-- 1. Check for orphaned sub_stream rows (rows with id_stream that don't exist in streams)
SELECT ss.id, ss.id_stream, ss.name_sub_stream 
FROM sub_stream ss 
LEFT JOIN streams s ON ss.id_stream = s.id 
WHERE s.id IS NULL;

-- 2. Check all streams
SELECT * FROM streams;

-- 3. Check all sub_streams
SELECT * FROM sub_stream;

-- FIX: Delete orphaned rows (run this to fix the issue)
-- WARNING: This will delete sub_stream rows that reference non-existent streams
DELETE ss FROM sub_stream ss 
LEFT JOIN streams s ON ss.id_stream = s.id 
WHERE s.id IS NULL;

-- After running the DELETE, restart your Spring Boot application
-- The foreign key constraint should now be created successfully
