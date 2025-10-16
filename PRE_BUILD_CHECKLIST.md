# Pre-Build Checklist for Insaty

## ✅ Configuration Verified
- [x] App name changed to "insaty"
- [x] Package name: `com.insaty.app`
- [x] Build type: AAB (Android App Bundle)
- [x] Auto-increment enabled
- [x] Environment variables configured
- [x] App assets present (icon, splash)

## 📝 Before You Build

### 1. Verify EAS CLI Installation
Run these commands:
```bash
# Check if EAS CLI is installed
eas --version

# If not installed, install it
npm install -g eas-cli

# Login to your Expo account
eas login
```

### 2. Check Your Expo Account
- Make sure you have an Expo account
- Verify you're logged in with the correct account
- Check your account has no billing issues

### 3. Review Environment Variables
Your production build will include:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

These are configured in `eas.json` and will be injected during build.

### 4. Final Code Check
- [ ] All features working locally?
- [ ] No console errors?
- [ ] Tested on Android device/emulator?
- [ ] Audio playback working?
- [ ] Recording working?
- [ ] Database operations working?

## 🚀 Ready to Build?

Once all checks pass, run:
```bash
eas build --platform android --profile production
```

## ⏱️ What to Expect

1. **Build Queue:** ~1-5 minutes
2. **Build Process:** ~10-20 minutes
3. **Output:** Download link for .aab file

## 📊 Monitor Your Build

After starting the build:
1. You'll get a URL to monitor progress
2. Visit the URL to see real-time logs
3. EAS dashboard shows all your builds
4. You'll receive email when build completes

## 🎯 After Build Completes

1. Download the .aab file
2. Test it on a physical device:
   ```bash
   eas build:run -p android
   ```
3. If everything works, proceed to Play Store submission

## 🆘 If Build Fails

Check the build logs:
```bash
eas build:list
eas build:view [BUILD_ID]
```

Common fixes:
- Ensure all dependencies are installed
- Check for TypeScript errors
- Verify eas.json is valid JSON
- Make sure you're logged into EAS

---

**Next:** Run `eas build --platform android --profile production` 🚀
