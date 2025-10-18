# 🔒 Row Level Security (RLS) Setup

## Why RLS is Critical

Without RLS, **any authenticated user can:**
- Delete anyone's podcasts
- Modify other users' profiles
- Access private data
- Impersonate other creators

**RLS prevents these attacks by enforcing access control at the database level.**

## Required RLS Policies

### 1. Podcasts Table

Run these SQL queries in your Supabase dashboard's SQL Editor:

```sql
-- Enable RLS on podcasts table
ALTER TABLE podcasts ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view public podcasts
CREATE POLICY "Public podcasts are viewable by everyone"
ON podcasts FOR SELECT
USING (true);

-- Policy: Users can insert their own podcasts
CREATE POLICY "Users can create their own podcasts"
ON podcasts FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own podcasts
CREATE POLICY "Users can update their own podcasts"
ON podcasts FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own podcasts
CREATE POLICY "Users can delete their own podcasts"
ON podcasts FOR DELETE
USING (auth.uid() = user_id);
```

### 2. Profiles Table

```sql
-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view profiles
CREATE POLICY "Profiles are viewable by everyone"
ON profiles FOR SELECT
USING (true);

-- Policy: Users can update their own profile only
CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy: Users can insert their own profile (typically done on signup)
CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);
```

### 3. Series Table (if you have one)

```sql
-- Enable RLS on series table
ALTER TABLE series ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view public series
CREATE POLICY "Series are viewable by everyone"
ON series FOR SELECT
USING (true);

-- Policy: Users can create their own series
CREATE POLICY "Users can create their own series"
ON series FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own series
CREATE POLICY "Users can update their own series"
ON series FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own series
CREATE POLICY "Users can delete their own series"
ON series FOR DELETE
USING (auth.uid() = user_id);
```

### 4. Episodes Table (if you have one)

```sql
-- Enable RLS on episodes table
ALTER TABLE episodes ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view episodes
CREATE POLICY "Episodes are viewable by everyone"
ON episodes FOR SELECT
USING (true);

-- Policy: Users can create episodes for their own series
CREATE POLICY "Users can create episodes for their series"
ON episodes FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM series 
    WHERE series.id = episodes.series_id 
    AND series.user_id = auth.uid()
  )
);

-- Policy: Users can update episodes in their own series
CREATE POLICY "Users can update episodes in their series"
ON episodes FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM series 
    WHERE series.id = episodes.series_id 
    AND series.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM series 
    WHERE series.id = episodes.series_id 
    AND series.user_id = auth.uid()
  )
);

-- Policy: Users can delete episodes in their own series
CREATE POLICY "Users can delete episodes in their series"
ON episodes FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM series 
    WHERE series.id = episodes.series_id 
    AND series.user_id = auth.uid()
  )
);
```

## Verification Steps

### Step 1: Check RLS is Enabled

Run this query to verify RLS is enabled:

```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('podcasts', 'profiles', 'series', 'episodes');
```

**Expected Result:** `rowsecurity` should be `true` for all tables.

### Step 2: Test Policies

Try these tests in the Supabase SQL Editor:

```sql
-- Test 1: Try to view all podcasts (should work)
SELECT COUNT(*) FROM podcasts;

-- Test 2: Try to update another user's podcast (should fail)
UPDATE podcasts 
SET title = 'Hacked!' 
WHERE user_id != auth.uid() 
LIMIT 1;
-- Expected: 0 rows affected (policy blocks it)

-- Test 3: Try to delete another user's podcast (should fail)
DELETE FROM podcasts 
WHERE user_id != auth.uid() 
LIMIT 1;
-- Expected: 0 rows affected (policy blocks it)
```

### Step 3: Test in Your App

1. Create a podcast as User A
2. Log in as User B
3. Try to delete User A's podcast
4. **Expected:** Error or no effect (RLS blocks it)

## Common RLS Patterns

### Pattern 1: Owner-Only Access

```sql
-- User can only access their own records
CREATE POLICY "policy_name"
ON table_name
FOR ALL
USING (auth.uid() = user_id);
```

### Pattern 2: Public Read, Owner Write

```sql
-- Everyone can read, only owner can write
CREATE POLICY "Anyone can view"
ON table_name FOR SELECT
USING (true);

CREATE POLICY "Owner can modify"
ON table_name FOR UPDATE
USING (auth.uid() = user_id);
```

### Pattern 3: Relationship-Based Access

```sql
-- Access based on foreign key relationship
CREATE POLICY "policy_name"
ON child_table
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM parent_table
    WHERE parent_table.id = child_table.parent_id
    AND parent_table.user_id = auth.uid()
  )
);
```

## Advanced: Admin Override

If you need admin users who can access everything:

```sql
-- Add is_admin column to profiles
ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT false;

-- Update policies to allow admin access
CREATE POLICY "Admins can do anything with podcasts"
ON podcasts
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);
```

## Security Best Practices

### ✅ DO:
- Enable RLS on ALL tables with user data
- Test policies thoroughly
- Use `auth.uid()` to identify current user
- Separate SELECT from INSERT/UPDATE/DELETE policies
- Use `USING` for read access, `WITH CHECK` for write validation

### ❌ DON'T:
- Disable RLS on production tables
- Use `USING (true)` for INSERT/UPDATE/DELETE (too permissive)
- Hardcode user IDs in policies
- Forget to test edge cases
- Skip RLS because "we validate on the client" (client validation can be bypassed!)

## Troubleshooting

### Issue: "New row violates row-level security policy"

**Cause:** The `WITH CHECK` clause is failing.

**Solution:** 
- Check that `user_id` matches `auth.uid()`
- Verify the user is authenticated
- Review the policy's `WITH CHECK` condition

### Issue: "Permission denied for table"

**Cause:** RLS is enabled but no policies exist.

**Solution:**
- Create at least one policy for the operation (SELECT, INSERT, UPDATE, DELETE)
- Or grant explicit permissions

### Issue: Can't see any data after enabling RLS

**Cause:** No SELECT policy exists.

**Solution:**
```sql
-- Add a SELECT policy
CREATE POLICY "Enable read access"
ON table_name FOR SELECT
USING (true); -- Or more restrictive condition
```

## Migration from No RLS to RLS

If you already have data and are adding RLS:

```sql
-- Step 1: Enable RLS
ALTER TABLE podcasts ENABLE ROW LEVEL SECURITY;

-- Step 2: Create permissive SELECT policy first (so you can still see data)
CREATE POLICY "Temporary read access"
ON podcasts FOR SELECT
USING (true);

-- Step 3: Test that you can still read data
SELECT * FROM podcasts LIMIT 5;

-- Step 4: Add proper INSERT/UPDATE/DELETE policies
-- (see above)

-- Step 5: Test everything works

-- Step 6: (Optional) Restrict SELECT policy if needed
DROP POLICY "Temporary read access" ON podcasts;
CREATE POLICY "Final read policy"
ON podcasts FOR SELECT
USING (true); -- Or your actual condition
```

## Performance Considerations

RLS policies add a WHERE clause to every query. For best performance:

### ✅ Good:
```sql
-- Simple equality check (uses index)
USING (auth.uid() = user_id)
```

### ⚠️ Slower:
```sql
-- Complex subquery (may be slow on large tables)
USING (
  EXISTS (
    SELECT 1 FROM other_table
    WHERE complex_condition
  )
)
```

**Optimization:** Create indexes on columns used in policies:

```sql
CREATE INDEX idx_podcasts_user_id ON podcasts(user_id);
CREATE INDEX idx_series_user_id ON series(user_id);
```

## Monitoring RLS

Check which policies are being applied:

```sql
-- List all RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

**Status:** 🔒 Critical Security Feature
**Action Required:** Run SQL queries in Supabase dashboard
**Priority:** HIGH - Do this before deploying to production
