# 🚀 Cloudflare R2 Setup Instructions

## Step 1: Install Required Packages

Run this command to install AWS SDK packages (R2 is S3-compatible):

```bash
npx expo install @aws-sdk/client-s3 @aws-sdk/lib-storage react-native-get-random-values web-streams-polyfill
```

**Note:** You must use `npx expo install` to ensure compatibility with React Native.

## Step 2: Create Cloudflare R2 Bucket

1. Go to https://dash.cloudflare.com/
2. In the left sidebar, click **R2 Object Storage**
3. Click **Create bucket**
4. Enter bucket name: `podup-media` (or your preferred name)
5. Click **Create bucket**

## Step 3: Configure Public Access (Optional but Recommended)

For direct playback URLs without signed URLs:

1. Go to your bucket settings
2. Click on **Settings** tab
3. Under **Public access**, click **Allow Access**
4. Enable **Custom Domains** or use the default `r2.dev` subdomain

Your public URL will be: `https://podup-media.r2.dev` or your custom domain.

## Step 4: Generate R2 API Tokens

1. In R2 dashboard, click **Manage R2 API Tokens**
2. Click **Create API Token**
3. Configure token:
   - **Token name:** podup-app
   - **Permissions:** Object Read & Write
   - **Apply to:** Specific bucket (select `podup-media`) or All buckets
   - **TTL:** Never expire (or set expiration as needed)
4. Click **Create API Token**
5. **IMPORTANT:** Copy these values immediately (you won't see them again):
   - Access Key ID
   - Secret Access Key
   - Account ID (shown at top of page)

## Step 5: Configure Environment Variables

1. Copy `.env.example` to `.env` (if you don't have one already)
2. Add your R2 credentials:

```env
# Keep your existing Supabase config
EXPO_PUBLIC_SUPABASE_URL=https://msdhktwmadlijxeawkwx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Add these NEW R2 variables
EXPO_PUBLIC_R2_ACCOUNT_ID=your_account_id_here
EXPO_PUBLIC_R2_ACCESS_KEY_ID=your_access_key_id_here
EXPO_PUBLIC_R2_SECRET_ACCESS_KEY=your_secret_access_key_here
EXPO_PUBLIC_R2_BUCKET_NAME=podup-media
EXPO_PUBLIC_R2_PUBLIC_URL=https://podup-media.r2.dev
```

**Security Note:** The R2 credentials are prefixed with `EXPO_PUBLIC_` so they are embedded in the app. This is acceptable because:
- R2 bucket will have public read access (like Supabase Storage did)
- Write operations require valid Supabase authentication
- You can implement additional security via R2 bucket policies

## Step 6: Restart Development Server

After adding environment variables:

```bash
# Stop the current server (Ctrl+C)
# Clear cache and restart
npx expo start --clear
```

## Step 7: Test the Integration

1. Open your app
2. Try uploading a podcast (either from file picker or recording)
3. Check the Cloudflare R2 dashboard to verify files are uploaded
4. Verify playback works with the R2 URLs

## Troubleshooting

### Error: "R2 configuration missing"
- Ensure all R2 environment variables are set in `.env`
- Restart the Expo development server after adding variables
- Check that variable names match exactly (including `EXPO_PUBLIC_` prefix)

### Error: "File upload failed"
- Verify R2 API token has write permissions
- Check that bucket name matches in both R2 dashboard and `.env`
- Ensure bucket has public access enabled

### Error: "Cannot find module '@aws-sdk/client-s3'"
- Run: `npx expo install @aws-sdk/client-s3 @aws-sdk/lib-storage`
- Make sure to use `npx expo install`, not `npm install`

### Audio won't play
- Verify R2 bucket has public access enabled
- Check that `EXPO_PUBLIC_R2_PUBLIC_URL` is correct
- Test the audio URL directly in a browser

## Benefits of R2 Migration

✅ **10GB free storage** (vs 1GB Supabase)  
✅ **Zero egress fees** (unlimited bandwidth)  
✅ **Global CDN** (faster audio streaming)  
✅ **S3-compatible** (standard APIs)  
✅ **Better for media** (optimized for large files)

## Database Changes

No database migrations needed! The `podcasts` table already has:
- `audio_url` (string) - stores R2 audio URL
- `image_url` (string) - stores R2 image URL

Old Supabase Storage URLs will continue to work for existing podcasts.

## Cost Comparison

| Service | Storage | Bandwidth | Cost |
|---------|---------|-----------|------|
| **Supabase Free** | 1GB | Limited | $0 |
| **R2 Free Tier** | 10GB | Unlimited | $0 |
| **R2 Paid** | $0.015/GB | $0 | ~$1.50 for 100GB |

For a podcast app, R2 is significantly cheaper for both storage and streaming.

## Next Steps

- ✅ Packages installed
- ✅ R2 bucket created
- ✅ API tokens generated
- ✅ Environment variables configured
- ✅ Code updated to use R2
- 🔄 Test uploads
- 🔄 Verify playback
- 🔄 Monitor R2 dashboard for usage

## Support

If you encounter issues:
1. Check the Cloudflare R2 documentation: https://developers.cloudflare.com/r2/
2. Review AWS SDK v3 docs: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/
3. Check console logs for detailed error messages
