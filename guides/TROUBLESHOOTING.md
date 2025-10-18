# 🔧 Troubleshooting R2 Migration

## ❌ Error: "Static class blocks are not enabled" (Babel Error)

**Full Error:**
```
ERROR  node_modules\@aws-sdk\lib-storage\dist-cjs\index.js:
Static class blocks are not enabled. Please add `@babel/plugin-transform-class-static-block` to your configuration.
```

**Cause:** AWS SDK v3 uses modern JavaScript features (static class blocks) that need Babel plugin support.

**Solution:** ✅ FIXED

The Babel plugin has been added to `babel.config.js`:

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      // Required for AWS SDK v3
      "@babel/plugin-transform-class-static-block",
    ],
  };
};
```

**Steps to resolve:**
1. The plugin is already added to `babel.config.js`
2. Install the plugin:
   ```bash
   npm install --save-dev @babel/plugin-transform-class-static-block
   ```
3. Clean cache and rebuild:
   ```bash
   npx expo start --clear
   npx expo run:android
   ```

---

## ❌ Error: "You attempted to import Node standard library module 'process'"

**Full Error:**
```
Android Bundling failed
You attempted to import the Node standard library module "process" from "src\services\r2Storage.ts".
It failed because the native React runtime does not include the Node standard library.
```

**Cause:** AWS SDK v3 polyfills were not imported at the app entry point.

**Solution:** ✅ FIXED
The polyfills are now imported at the top of `src/app/_layout.tsx`:

```typescript
// AWS SDK v3 Polyfills for React Native - MUST be imported first
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
```

**Steps to resolve:**
1. The fix is already applied in `_layout.tsx`
2. Clean the build cache:
   ```bash
   npx expo start --clear
   ```
3. If running Android:
   ```bash
   npx expo run:android
   ```

---

## ❌ Error: "Cannot find module '@aws-sdk/client-s3'"

**Cause:** AWS SDK packages not installed.

**Solution:**
```bash
npx expo install @aws-sdk/client-s3 @aws-sdk/lib-storage react-native-get-random-values web-streams-polyfill
```

Make sure to use `npx expo install` (not `npm install`) for React Native compatibility.

---

## ❌ Error: "R2 configuration missing"

**Cause:** R2 environment variables not set or missing `EXPO_PUBLIC_` prefix.

**Solution:**
1. Check your `.env` file has all required variables:
   ```env
   EXPO_PUBLIC_R2_ACCOUNT_ID=your_account_id
   EXPO_PUBLIC_R2_ACCESS_KEY_ID=your_access_key_id
   EXPO_PUBLIC_R2_SECRET_ACCESS_KEY=your_secret_key
   EXPO_PUBLIC_R2_BUCKET_NAME=podup-media
   EXPO_PUBLIC_R2_PUBLIC_URL=https://podup-media.r2.dev
   ```

2. Restart the development server:
   ```bash
   npx expo start --clear
   ```

3. Verify variables are loaded:
   - Add console log in `r2Storage.ts` constructor to check `process.env`

---

## ❌ Upload Fails Silently

**Symptoms:** Upload progress shows but completes with no file in R2.

**Debugging:**
1. Check console logs for detailed errors
2. Verify R2 credentials are correct
3. Test R2 connection:
   - Go to R2 dashboard
   - Try manual file upload
   - Check bucket permissions

**Common causes:**
- Invalid API credentials
- Bucket doesn't exist
- Incorrect endpoint URL
- Network connectivity issues

---

## ❌ Audio Won't Play After Upload

**Symptoms:** File uploads successfully but audio player shows error.

**Causes & Solutions:**

### 1. Bucket not public
**Solution:** Enable public access in R2 dashboard:
- Go to bucket settings
- Enable "Public Access"
- Or configure custom domain

### 2. Wrong public URL
**Check:** Is `EXPO_PUBLIC_R2_PUBLIC_URL` correct?
- Should be: `https://[bucket-name].r2.dev`
- Or your custom domain
- Test by opening audio URL in browser

### 3. CORS issues
**Solution:** Configure CORS in R2 bucket:
```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3000
  }
]
```

---

## ❌ Build Fails with "Duplicate Module" Error

**Cause:** Multiple versions of polyfills installed.

**Solution:**
```bash
# Remove node_modules and reinstall
rm -rf node_modules
rm package-lock.json
npx expo install
```

---

## ❌ TypeScript Errors in r2Storage.ts

**Error:** `Cannot find module '@aws-sdk/client-s3'`

**Cause:** Packages not installed or TypeScript cache stale.

**Solution:**
1. Install packages (if not done):
   ```bash
   npx expo install @aws-sdk/client-s3 @aws-sdk/lib-storage
   ```

2. Restart TypeScript server:
   - In VS Code: Ctrl+Shift+P → "TypeScript: Restart TS Server"

3. Clear TypeScript cache:
   ```bash
   rm -rf node_modules/.cache
   ```

---

## ❌ Progress Percentage Not Updating

**Cause:** `XhrHttpHandler` not configured for detailed progress.

**Note:** Current implementation uses standard progress tracking. For more granular updates, you can modify `r2Storage.ts` to use `XhrHttpHandler`:

```typescript
import { XhrHttpHandler } from '@aws-sdk/xhr-http-handler';

this.client = new S3Client({
  requestHandler: new XhrHttpHandler({}),
  // ... rest of config
});
```

---

## 🔍 Debugging Tips

### Enable Verbose Logging

In `r2Storage.ts`, add console logs:

```typescript
async uploadFile(options: R2UploadOptions) {
  console.log('🔍 Upload options:', options);
  console.log('🔍 R2 Config:', {
    accountId: this.accountId,
    bucket: this.bucketName,
    publicUrl: this.publicUrl,
  });
  
  // ... rest of code
}
```

### Check R2 Dashboard
1. Go to R2 bucket in Cloudflare dashboard
2. Verify files appear after upload
3. Check file sizes match
4. Try downloading files directly

### Test Audio URL
Open the `audio_url` from database directly in browser:
- Should download or play the audio
- If 404: Public access not enabled
- If 403: Authentication issue

### Network Inspector
- In Expo: Shake device → Debug → Network
- Check for failed requests
- Look for 401/403/404 errors

---

## 📞 Getting Help

If issues persist:

1. **Check these files:**
   - `src/app/_layout.tsx` - Polyfills at top
   - `src/services/r2Storage.ts` - No process import
   - `.env` - All R2 variables present

2. **Console logs to check:**
   - R2 configuration values
   - Upload progress events
   - Error messages

3. **Test basic S3 operations:**
   Use AWS CLI to verify bucket access:
   ```bash
   aws s3 ls --endpoint-url https://[account-id].r2.cloudflarestorage.com
   ```

---

## ✅ Verification Checklist

After fixing any issue:

- [ ] `npx expo start --clear` runs without errors
- [ ] App builds successfully
- [ ] Can upload audio file
- [ ] Can upload image
- [ ] Files appear in R2 dashboard
- [ ] Audio plays in app
- [ ] Database shows R2 URLs
- [ ] No console errors

---

**Still stuck?** Check the console logs carefully - they contain detailed error information that can help identify the exact issue.
