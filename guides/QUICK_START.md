# 🚀 Quick Start - R2 Migration

## Install Packages (Required First!)

```bash
# Install AWS SDK packages
npx expo install @aws-sdk/client-s3 @aws-sdk/lib-storage react-native-get-random-values web-streams-polyfill

# Install Babel plugin for AWS SDK support
npm install --save-dev @babel/plugin-transform-class-static-block
```

## Setup Cloudflare R2 (5 minutes)

### 1. Create Bucket
- Go to https://dash.cloudflare.com/ → R2
- Create bucket named: `podup-media`
- Enable public access

### 2. Get Credentials
- Click "Manage R2 API Tokens"
- Create token with Read & Write permissions
- Copy: Account ID, Access Key ID, Secret Access Key

### 3. Add to `.env`

```env
EXPO_PUBLIC_R2_ACCOUNT_ID=your_account_id
EXPO_PUBLIC_R2_ACCESS_KEY_ID=your_access_key_id  
EXPO_PUBLIC_R2_SECRET_ACCESS_KEY=your_secret_key
EXPO_PUBLIC_R2_BUCKET_NAME=podup-media
EXPO_PUBLIC_R2_PUBLIC_URL=https://podup-media.r2.dev
```

### 4. Restart Server

```bash
npx expo start --clear
```

## Test It

1. Open app → Upload tab
2. Pick audio file or record
3. Add cover image and details
4. Publish
5. Check R2 dashboard for files
6. Play audio to verify

## Done! 🎉

Your app now uses:
- ✅ Cloudflare R2 for audio/images (10GB free)
- ✅ Supabase for auth/database (unchanged)

## ⚠️ Troubleshooting

**Error: "You attempted to import Node standard library module 'process'"**

✅ **FIXED** - Polyfills are now properly imported in `src/app/_layout.tsx`

If you still see this error:
1. Run: `npx expo start --clear`
2. Rebuild: `npx expo run:android`

**Other issues?** See `TROUBLESHOOTING.md`

---

**Full docs:** See `MIGRATION_SUMMARY.md` and `R2_SETUP_INSTRUCTIONS.md`
