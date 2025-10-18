# Insaty - Google Play Store Deployment Guide

## ✅ Completed Setup
- [x] App rebranded from "podup" to "insaty"
- [x] Package name changed to `com.insaty.app`
- [x] EAS configured for production AAB builds
- [x] App assets verified (icon, splash screen)

---

## 📋 Prerequisites Checklist

### 1. Install and Login to EAS CLI
```bash
npm install -g eas-cli
eas login
```

### 2. Verify Your Configuration
Check that your files are correctly configured:
- ✅ `app.json` - name: "insaty", package: "com.insaty.app"
- ✅ `package.json` - name: "insaty"
- ✅ `eas.json` - buildType: "aab" for production

---

## 🚀 Step-by-Step Deployment Process

### Step 1: Build Production AAB

You have **TWO OPTIONS** for building:

#### Option A: EAS Build (Cloud - Recommended for First Time)

Run this command to create a production build:
```bash
eas build --platform android --profile production
```

**What this does:**
- Creates an Android App Bundle (.aab) file
- Automatically handles code signing with EAS credentials
- Auto-increments version number (configured in eas.json)
- Injects environment variables from eas.json

**Expected Output:**
- Build will start on EAS servers
- You'll get a URL to monitor build progress
- Build typically takes 10-20 minutes
- Once complete, you'll get a download link for the .aab file

**Pros:** No local setup, automatic credentials, great for CI/CD  
**Cons:** Takes 15-20 minutes, requires internet

---

#### Option B: Local Build (Faster if you have Android Studio)

If you're already using `npx expo run:android --variant release`, here's what you need:

```bash
# ⚠️ Important: Your usual command creates APK, but Play Store needs AAB!

# Correct command for Play Store (creates AAB):
cd android && ./gradlew app:bundleRelease

# Output location:
# android/app/build/outputs/bundle/release/app-release.aab
```

**What this does:**
- Builds AAB locally on your machine (not APK)
- Uses your existing keystore/credentials
- Much faster (2-5 minutes)
- Gives you full control

**Prerequisites:**
- Android Studio installed
- Android SDK configured
- `android/` folder exists (run `npx expo prebuild` if needed)

**Pros:** Much faster, works offline, full control  
**Cons:** Requires Android Studio setup, manual credential management

📚 **See `LOCAL_BUILD_GUIDE.md` for complete local build documentation**

### Step 2: Set Up Google Play Console

#### 2a. Create App in Google Play Console
1. Go to [Google Play Console](https://play.google.com/console)
2. Click "Create App"
3. Fill in details:
   - **App name:** insaty
   - **Default language:** Choose your language
   - **App or game:** App
   - **Free or paid:** Free (or Paid if applicable)
4. Accept declarations and create app

#### 2b. Set Up Service Account (for automated submissions)

This is optional but recommended for future automated deployments.

1. In Google Play Console → Settings → API Access
2. Create a new service account or link existing one
3. Download the JSON key file
4. Save it as `service-account-file.json` in your project root
5. Add to `.gitignore`:
   ```
   service-account-file.json
   ```

6. Update `eas.json` submit section:
   ```json
   {
     "submit": {
       "production": {
         "android": {
           "serviceAccountKeyPath": "./service-account-file.json",
           "track": "internal"
         }
       }
     }
   }
   ```

**Tracks explained:**
- `internal` - Internal testing (up to 100 testers)
- `alpha` - Closed testing
- `beta` - Open testing
- `production` - Full public release

### Step 3: Complete Store Listing

In Google Play Console, complete all required sections:

#### App Content
1. **Privacy Policy** - Required for all apps
   - Host your privacy policy URL
   - Add the URL in Play Console

2. **App Access** - Declare if login is required
   - If yes, provide test credentials

3. **Ads** - Declare if your app contains ads

4. **Content Rating** - Complete questionnaire
   - Takes 5-10 minutes
   - Required before publishing

5. **Target Audience** - Select age groups

6. **Data Safety** - Declare data collection practices
   - What data you collect
   - How it's used
   - Security practices

#### Store Presence
1. **Main Store Listing**
   - App name: insaty
   - Short description (80 chars max)
   - Full description (4000 chars max)
   - Screenshots (minimum 2, up to 8)
   - Feature graphic (1024 x 500 px)
   - App icon (512 x 512 px)

2. **Screenshots Requirements:**
   - Minimum: 2 screenshots
   - Format: PNG or JPEG
   - Dimensions: 
     - Phone: 16:9 or 9:16 aspect ratio
     - Min: 320px, Max: 3840px
   - Show key features of your app

### Step 4: Submit Your Build

#### Option A: Manual Upload (First Time)
1. In Play Console → Testing → Internal testing (or Production)
2. Click "Create new release"
3. Upload the .aab file you downloaded from EAS
4. Add release notes
5. Review and roll out

#### Option B: Automated with EAS Submit (After service account setup)
```bash
# Submit the build automatically
eas submit --platform android

# Or build and submit in one command
eas build --platform android --auto-submit
```

### Step 5: Review and Publish

1. **Internal Testing** (Recommended first)
   - Test with a small group first
   - Add tester emails in Play Console
   - They'll receive an invite link
   - Gather feedback and fix issues

2. **Production Release**
   - Once testing is complete
   - Go to Production track
   - Upload build or promote from testing
   - Add release notes
   - Review and publish

**Review Time:**
- Google typically reviews within 1-7 days
- First submission usually takes longer
- Updates are usually faster

---

## 🔧 Troubleshooting

### Build Fails
```bash
# Check build logs
eas build:list

# View specific build details
eas build:view [BUILD_ID]
```

### Common Issues

1. **Keystore/Signing Issues**
   - EAS handles this automatically
   - If issues occur, run: `eas credentials`

2. **Environment Variables Not Working**
   - Check `eas.json` production env section
   - Verify variable names start with `EXPO_PUBLIC_`

3. **Version Conflicts**
   - EAS auto-increments if `autoIncrement: true`
   - Manual override: `eas build:version:set`

---

## 📱 Testing Your Build

### Install on Physical Device
```bash
# Download and install the build
eas build:run -p android
```

### Generate Internal Testing Link
1. Upload build to Internal testing track
2. Add testers' Gmail addresses
3. Share the testing link with them

---

## 🔄 Future Updates

### Update Process:
1. Make code changes
2. Build new version: `eas build --platform android --profile production`
3. Submit: `eas submit --platform android --auto-submit`
4. Add release notes in Play Console
5. Publish update

### Version Management:
- `autoIncrement: true` in eas.json handles version bumping
- Manual control: `eas build:version:set`

---

## 📚 Useful Commands

```bash
# Login to EAS
eas login

# Build production
eas build --platform android --profile production

# Submit to Play Store
eas submit --platform android

# Build and submit together
eas build --platform android --auto-submit

# Check build status
eas build:list

# Download build
eas build:run -p android

# Manage credentials
eas credentials

# Set version manually
eas build:version:set
```

---

## 🎯 Next Steps

1. **Run the production build:**
   ```bash
   eas build --platform android --profile production
   ```

2. **While build is running, prepare:**
   - Create Google Play Console account (if needed)
   - Prepare app screenshots
   - Write app description
   - Create privacy policy
   - Prepare feature graphic

3. **After build completes:**
   - Test the build on a physical device
   - Create Play Console app listing
   - Upload the .aab file
   - Complete all required sections
   - Submit for review

---

## 🔗 Resources

- [Expo EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)
- [Google Play Console](https://play.google.com/console)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
- [Android App Bundle Docs](https://developer.android.com/guide/app-bundle)

---

## ⚠️ Important Notes

1. **First Release:** Allow 1-7 days for Google review
2. **Privacy Policy:** Required for all apps on Play Store
3. **Content Rating:** Must be completed before publishing
4. **Data Safety:** Carefully review and declare all data practices
5. **Testing:** Always test on physical devices before production
6. **Screenshots:** Show real app content, no mockups
7. **Service Account:** Keep JSON key secure, never commit to git

---

**Status:** Ready to build! Run `eas build --platform android --profile production` to start.
