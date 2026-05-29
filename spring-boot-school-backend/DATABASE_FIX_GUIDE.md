# Database Foreign Key Constraint Fix Guide

## Problem
Hibernate cannot create a foreign key constraint because the `sub_stream` table contains rows with `id_stream` values that don't exist in the `streams` table (orphaned data).

## Solution Steps

### Step 1: Start the application (temporary workaround)
I've temporarily changed `ddl-auto` from `update` to `validate` in `application.properties`. This allows the app to start without trying to create the constraint.

**The app should now start successfully.**

### Step 2: Fix the orphaned data

Run these SQL queries in your MySQL database:

```sql
-- 1. Check for orphaned rows
SELECT ss.id, ss.id_stream, ss.name_sub_stream 
FROM sub_stream ss 
LEFT JOIN streams s ON ss.id_stream = s.id 
WHERE s.id IS NULL;

-- 2. If orphaned rows exist, delete them:
DELETE ss FROM sub_stream ss 
LEFT JOIN streams s ON ss.id_stream = s.id 
WHERE s.id IS NULL;
```

**Alternative:** If you want to keep the orphaned rows, you need to:
- Either create the missing `streams` records with the IDs referenced in `sub_stream`
- Or update the `id_stream` values in `sub_stream` to point to existing streams

### Step 3: Re-enable schema updates

After fixing the data, change `application.properties` back:

```properties
spring.jpa.hibernate.ddl-auto=update
spring.jpa.properties.hibernate.hbm2ddl.auto=update
```

Then restart the application. Hibernate will now successfully create the foreign key constraint.

## Why this happened
This typically occurs when:
- Data was inserted manually without checking referential integrity
- A stream was deleted but its associated sub_streams were not
- The database was migrated/imported without maintaining relationships
