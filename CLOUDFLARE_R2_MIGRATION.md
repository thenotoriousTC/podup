# Cloudflare R2 Migration Guide

## Overview
Migrating from Supabase Storage (1GB free) to Cloudflare R2 (10GB free + zero egress fees) for audio files and images.

## Prerequisites

### 1. Create Cloudflare R2 Bucket
1. Go to https://dash.cloudflare.com/
2. Navigate to R2 Object Storage
3. Create a new bucket (e.g., `podup-media`)
4. Note your Account ID

### 2. Generate R2 API Tokens
1. In R2 dashboard, go to "Manage R2 API Tokens"
2. Click "Create API Token"
3. Set permissions: Object Read & Write
4. Apply to specific bucket or all buckets
5. Copy the Access Key ID and Secret Access Key

### 3. Configure R2 Bucket for Public Access (Optional)
If you want direct public URLs without presigned URLs:
1. Go to your bucket settings
2. Enable "Public Access" 
3. Configure custom domain (recommended) or use r2.dev subdomain

## Installation

Run these commands to install AWS SDK packages (R2 is S3-compatible):

```bash
npx expo install @aws-sdk/client-s3 @aws-sdk/lib-storage react-native-get-random-values web-streams-polyfill
```

## Environment Variables

Add these to your `.env` file:

```env
# Cloudflare R2 Configuration
EXPO_PUBLIC_R2_ACCOUNT_ID=your_account_id_here
EXPO_PUBLIC_R2_ACCESS_KEY_ID=your_access_key_id_here
EXPO_PUBLIC_R2_SECRET_ACCESS_KEY=your_secret_access_key_here
EXPO_PUBLIC_R2_BUCKET_NAME=podup-media
EXPO_PUBLIC_R2_PUBLIC_URL=https://your-bucket.r2.dev

# Existing Supabase config (keep these)
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

## Architecture

### What Stays in Supabase:
- ✅ Authentication (user auth)
- ✅ Database (podcasts, profiles, series tables)
- ✅ Edge Functions (create-podcast)
- ✅ Row Level Security policies

### What Moves to Cloudflare R2:
- ✅ Audio files (`.m4a`, `.mp3`) - Large files, streaming
- ✅ Cover images (`.jpg`, `.png`) - Images for podcasts/series
- ✅ Profile avatars

## Benefits

1. **10x More Storage**: 10GB free (vs 1GB Supabase)
2. **Zero Egress Fees**: No bandwidth charges for streaming
3. **Global CDN**: Built-in edge caching
4. **S3 Compatible**: Easy migration, standard APIs
5. **Better Performance**: Optimized for media delivery

## Database Changes

The `podcasts` table already has `audio_url` and `image_url` fields. These will now store R2 URLs instead of Supabase Storage URLs.

**Before (Supabase):**
```
audio_url: "https://msdhktwmadlijxeawkwx.supabase.co/storage/v1/object/public/podcasts/audio_..."
```

**After (R2):**
```
audio_url: "https://podup-media.r2.dev/audio/user123_1234567890.m4a"
```

## Migration Steps

1. ✅ Install AWS SDK packages
2. ✅ Add R2 credentials to `.env`
3. ✅ Create R2 storage service (`src/services/r2Storage.ts`)
4. ✅ Update upload hooks to use R2
5. ✅ Update Edge Function to accept R2 URLs
6. ✅ Test uploads and playback
7. 🔄 (Optional) Migrate existing files from Supabase to R2

## Code Changes Summary

- **New File**: `src/services/r2Storage.ts` - R2 upload/download service
- **Modified**: `src/components/uploadComponents/usePodcastUpload.ts` - Use R2 for uploads
- **Modified**: `src/components/recordingcomponents/useRecordingUpload.ts` - Use R2 for uploads  
- **Modified**: Supabase Edge Function `create-podcast` - Accept R2 URLs
- **Modified**: `.env` - Add R2 credentials

## Testing Checklist

- [ ] Upload audio file from file picker
- [ ] Upload recorded audio
- [ ] Upload cover images
- [ ] Play audio from R2 URL
- [ ] Verify URLs stored correctly in database
- [ ] Test offline caching still works
- [ ] Check upload progress indicators
- [ ] Verify error handling

## Rollback Plan

If issues arise, you can temporarily revert by:
1. Commenting out R2 service imports
2. Uncommenting Supabase storage code
3. Supabase files remain accessible during migration

## Notes

- R2 URLs will be publicly accessible if public access is enabled
- Consider implementing signed URLs for private content
- Current Supabase files remain accessible (no data loss)
- Can run both storage systems in parallel during transition
