# 🔒 Secure Environment Variables Setup

## ⚠️ CRITICAL: Security Fix Applied

The previous setup **exposed R2 credentials in the mobile app** using `EXPO_PUBLIC_*` variables. This is a **security vulnerability** because:

- `EXPO_PUBLIC_*` variables are bundled into the JavaScript code
- Anyone can decompile the app and extract credentials
- Attackers could upload/delete files from your R2 bucket

## ✅ New Secure Architecture

```
Mobile App → Supabase Edge Function → Cloudflare R2
                ↓
         Credentials stored here (server-side only)
```

## Environment Variables Configuration

### Client-Side (.env in mobile app)

These are **safe to expose** because they're public keys:

```env
# Supabase Public Credentials (SAFE - these are meant to be public)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# R2 Public URL ONLY (no credentials!)
EXPO_PUBLIC_R2_PUBLIC_URL=https://podup-media.r2.dev
```

### Server-Side (Supabase Edge Function Secrets)

These are **NEVER exposed** to the client. Set them using Supabase CLI:

```bash
# Navigate to your project
cd c:\projects\startup\fromgit02062025\podup

# Set Edge Function secrets (server-side only)
supabase secrets set R2_ACCOUNT_ID=your_r2_account_id
supabase secrets set R2_ACCESS_KEY_ID=your_r2_access_key_id
supabase secrets set R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
supabase secrets set R2_BUCKET_NAME=podup-media
supabase secrets set R2_PUBLIC_URL=https://podup-media.r2.dev
```

**Or** set them all at once from a file:

```bash
# Create supabase/.env.local
cat > supabase/.env.local << EOF
R2_ACCOUNT_ID=your_r2_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=podup-media
R2_PUBLIC_URL=https://podup-media.r2.dev
EOF

# Upload all secrets
supabase secrets set --env-file ./supabase/.env.local
```

### Important Notes

1. **NEVER use `EXPO_PUBLIC_` prefix for secrets!**
   - ❌ `EXPO_PUBLIC_R2_ACCESS_KEY_ID` - WRONG (exposed to client)
   - ✅ `R2_ACCESS_KEY_ID` - CORRECT (server-side only)

2. **Server-side secrets are accessed in Edge Functions:**
   ```typescript
   const accessKey = Deno.env.get('R2_ACCESS_KEY_ID');
   ```

3. **Client-side public variables are accessed in React Native:**
   ```typescript
   const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
   ```

## How to Update Your Existing Setup

### Step 1: Remove Client-Side Secrets

**Remove these from your `.env` file:**
```env
# ❌ DELETE THESE - They're security vulnerabilities
EXPO_PUBLIC_R2_ACCOUNT_ID=...
EXPO_PUBLIC_R2_ACCESS_KEY_ID=...
EXPO_PUBLIC_R2_SECRET_ACCESS_KEY=...
```

**Keep only these:**
```env
# ✅ KEEP THESE - They're safe
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
EXPO_PUBLIC_R2_PUBLIC_URL=...
```

### Step 2: Set Server-Side Secrets

```bash
# Link to your Supabase project (if not already linked)
supabase link --project-ref your-project-ref

# Set the secrets
supabase secrets set R2_ACCOUNT_ID=your_account_id
supabase secrets set R2_ACCESS_KEY_ID=your_access_key_id
supabase secrets set R2_SECRET_ACCESS_KEY=your_secret_access_key
supabase secrets set R2_BUCKET_NAME=podup-media
supabase secrets set R2_PUBLIC_URL=https://podup-media.r2.dev
```

### Step 3: Deploy Edge Function

```bash
# Deploy the upload-to-r2 Edge Function
supabase functions deploy upload-to-r2

# Verify it's deployed
supabase functions list
```

### Step 4: Update Client Code

The client code will now call the Edge Function instead of uploading directly to R2. This is handled in the next steps.

## Verification

### Check Client Variables (Should NOT contain secrets)

```bash
# View your .env file
cat .env

# You should NOT see:
# - R2_ACCESS_KEY_ID
# - R2_SECRET_ACCESS_KEY
# - R2_ACCOUNT_ID

# You SHOULD only see:
# - EXPO_PUBLIC_SUPABASE_URL
# - EXPO_PUBLIC_SUPABASE_ANON_KEY  
# - EXPO_PUBLIC_R2_PUBLIC_URL
```

### Check Server Secrets (Should contain R2 credentials)

```bash
# List Edge Function secrets
supabase secrets list

# You should see:
# - R2_ACCOUNT_ID
# - R2_ACCESS_KEY_ID
# - R2_SECRET_ACCESS_KEY
# - R2_BUCKET_NAME
# - R2_PUBLIC_URL
```

## Security Best Practices

### ✅ DO:
- Store R2 credentials in Supabase Edge Function secrets
- Use `EXPO_PUBLIC_` prefix only for truly public values
- Upload files through Edge Functions
- Validate file types and sizes server-side
- Implement rate limiting
- Sanitize user inputs

### ❌ DON'T:
- Put secrets in `EXPO_PUBLIC_*` variables
- Upload directly from mobile app to R2
- Trust client-side validation alone
- Expose internal error messages to users
- Skip authentication checks
- Allow unlimited uploads

## Comparison Table

| Variable | Old (❌ Insecure) | New (✅ Secure) |
|----------|------------------|-----------------|
| Supabase URL | `EXPO_PUBLIC_SUPABASE_URL` | `EXPO_PUBLIC_SUPABASE_URL` ✅ |
| Supabase Anon Key | `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `EXPO_PUBLIC_SUPABASE_ANON_KEY` ✅ |
| R2 Account ID | `EXPO_PUBLIC_R2_ACCOUNT_ID` ❌ | Server secret: `R2_ACCOUNT_ID` ✅ |
| R2 Access Key | `EXPO_PUBLIC_R2_ACCESS_KEY_ID` ❌ | Server secret: `R2_ACCESS_KEY_ID` ✅ |
| R2 Secret Key | `EXPO_PUBLIC_R2_SECRET_ACCESS_KEY` ❌ | Server secret: `R2_SECRET_ACCESS_KEY` ✅ |
| R2 Bucket Name | `EXPO_PUBLIC_R2_BUCKET_NAME` | Server secret: `R2_BUCKET_NAME` ✅ |
| R2 Public URL | `EXPO_PUBLIC_R2_PUBLIC_URL` | `EXPO_PUBLIC_R2_PUBLIC_URL` ✅ |

## What Changed in the Code

### Before (Insecure):
```typescript
// Client-side code had direct access to R2
const r2Client = new S3Client({
  credentials: {
    // ❌ These were exposed in the app bundle!
    accessKeyId: process.env.EXPO_PUBLIC_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.EXPO_PUBLIC_R2_SECRET_ACCESS_KEY,
  }
});
```

### After (Secure):
```typescript
// Client-side code calls Edge Function
const { data, error } = await supabase.functions.invoke('upload-to-r2', {
  body: formData, // Just sends the file
});
// ✅ No credentials in client code!
```

```typescript
// Edge Function (server-side) has access to secrets
const r2Client = new S3Client({
  credentials: {
    // ✅ These are server-side environment variables
    accessKeyId: Deno.env.get('R2_ACCESS_KEY_ID'),
    secretAccessKey: Deno.env.get('R2_SECRET_ACCESS_KEY'),
  }
});
```

## Cost Impact

**No change!** This secure architecture uses the same R2 storage:
- Still 10GB free storage
- Still unlimited egress (0 fees for downloads)
- Edge Function invocations are free (within Supabase limits)

## Need Help?

If you're unsure about any step:

1. **Check your current .env file** - does it have `EXPO_PUBLIC_R2_SECRET_ACCESS_KEY`? If yes, it's insecure.
2. **Check Supabase secrets** - run `supabase secrets list`
3. **Test Edge Function** - run `supabase functions serve upload-to-r2`

---

**Status:** ✅ Secure architecture implemented
**Action Required:** Update environment variables and deploy Edge Function
