# Local Build Guide for Play Store (Alternative to EAS)

## ✅ You Can Use Local Builds!

If you prefer building locally (like you've been doing with `npx expo run:android --variant release`), here's the correct process for Play Store submission.

---

## 🎯 Important: APK vs AAB

**Your current method creates APK:**
```bash
npx expo run:android --variant release  # ❌ Creates APK (not accepted by Play Store)
```

**Play Store requires AAB:**
```bash
cd android && ./gradlew app:bundleRelease  # ✅ Creates AAB (required for Play Store)
```

---

## 📋 Complete Local Build Process

### Step 1: Prerequisites

Make sure you have:
- ✅ Android Studio installed
- ✅ Android SDK configured
- ✅ `android/` folder exists (run `npx expo prebuild` if needed)
- ✅ Signing keystore configured

### Step 2: Generate Native Folders (if needed)

If you don't have the `android/` folder:
```bash
npx expo prebuild
```

This creates the native Android project structure.

### Step 3: Build AAB for Play Store

```bash
# Navigate to android directory
cd android

# Build release AAB
./gradlew app:bundleRelease
```

**Output location:**
```
android/app/build/outputs/bundle/release/app-release.aab
```

### Step 4: Build APK for Testing (Optional)

If you want to test locally first:
```bash
# Build APK (for local testing only)
npx expo run:android --variant release

# Or with Gradle
cd android && ./gradlew app:assembleRelease
```

**APK location:**
```
android/app/build/outputs/apk/release/app-release.apk
```

---

## 🔐 Code Signing Setup

### Option 1: EAS Manages Credentials (Recommended)

Even with local builds, you can use EAS credentials:

```bash
# Let EAS create and manage your keystore
eas credentials

# Download credentials for local use
eas credentials -p android
```

### Option 2: Manual Keystore Setup

Create your own keystore:

```bash
# Generate keystore
keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

Configure in `android/gradle.properties`:
```properties
MYAPP_UPLOAD_STORE_FILE=my-release-key.keystore
MYAPP_UPLOAD_KEY_ALIAS=my-key-alias
MYAPP_UPLOAD_STORE_PASSWORD=****
MYAPP_UPLOAD_KEY_PASSWORD=****
```

Update `android/app/build.gradle`:
```gradle
android {
    ...
    signingConfigs {
        release {
            if (project.hasProperty('MYAPP_UPLOAD_STORE_FILE')) {
                storeFile file(MYAPP_UPLOAD_STORE_FILE)
                storePassword MYAPP_UPLOAD_STORE_PASSWORD
                keyAlias MYAPP_UPLOAD_KEY_ALIAS
                keyPassword MYAPP_UPLOAD_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        release {
            ...
            signingConfig signingConfigs.release
        }
    }
}
```

---

## 🚀 Complete Workflow

### For Play Store Submission:

```bash
# 1. Clean build (optional but recommended)
cd android && ./gradlew clean

# 2. Build production AAB
./gradlew app:bundleRelease

# 3. Find your AAB
# Location: android/app/build/outputs/bundle/release/app-release.aab

# 4. Upload to Play Console manually
# Go to play.google.com/console
# Create release → Upload AAB
```

### For Local Testing:

```bash
# Build and install APK on connected device
npx expo run:android --variant release

# Or manually install
cd android
./gradlew app:assembleRelease
adb install app/build/outputs/apk/release/app-release.apk
```

---

## ⚡ Quick Commands Reference

```bash
# Generate native folders
npx expo prebuild

# Build AAB (Play Store)
cd android && ./gradlew app:bundleRelease

# Build APK (testing)
npx expo run:android --variant release

# Clean build
cd android && ./gradlew clean

# Build both debug and release
cd android && ./gradlew assemble

# Check signing
cd android && ./gradlew signingReport
```

---

## 📊 Local vs EAS: When to Use What?

### Use Local Builds When:
- ✅ You have Android Studio set up
- ✅ You want faster build times
- ✅ You prefer full control
- ✅ You're comfortable with keystore management
- ✅ You have a powerful local machine

### Use EAS Builds When:
- ✅ You don't have Android Studio
- ✅ You want automatic credential management
- ✅ You need CI/CD integration
- ✅ You want OTA updates (EAS Update)
- ✅ Team collaboration on builds
- ✅ Building for multiple platforms

---

## 🐛 Troubleshooting

### "Task bundleRelease not found"
```bash
# Make sure you're in the android directory
cd android
./gradlew tasks --all | grep bundle
```

### "No keystore configured"
```bash
# Use EAS credentials
eas credentials

# Or create manually (see Code Signing section above)
```

### "Android SDK not found"
```bash
# Add to ~/.bashrc or ~/.zshrc
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

### Build succeeds but app crashes
```bash
# Check ProGuard/R8 rules if using code obfuscation
# Debug with: npx expo run:android --variant release --no-bundler
```

---

## 📦 File Sizes Comparison

**APK (for testing):**
- Size: ~50-100 MB typically
- Contains all architectures
- Larger file size

**AAB (for Play Store):**
- Size: Similar to APK initially
- Google Play generates optimized APKs per device
- Users download smaller, optimized versions (~20-40% smaller)

---

## ✅ Verification Checklist

Before uploading to Play Store:

- [ ] Built AAB (not APK): `android/app/build/outputs/bundle/release/app-release.aab`
- [ ] File size reasonable (<150 MB)
- [ ] Signed with release keystore
- [ ] Tested on physical device
- [ ] Version code incremented
- [ ] Version name updated in `app.json`
- [ ] No debug code or console.logs
- [ ] All features work in release mode

---

## 🎯 Final Command for Play Store

**This is what you need:**

```bash
cd android && ./gradlew app:bundleRelease
```

**Output:**
```
android/app/build/outputs/bundle/release/app-release.aab
```

Upload this `.aab` file to Google Play Console! 🚀

---

## 💡 Pro Tips

1. **Keep your keystore safe** - Back it up! You can't update your app without it.
2. **Version management** - Update `versionCode` and `versionName` in `app.json` before each build
3. **Test release builds** - Always test with `--variant release` before submitting
4. **Clean builds** - Run `./gradlew clean` if you encounter issues
5. **Git ignore** - Add `android/app/build/` and keystore files to `.gitignore`

---

## 🆚 Quick Comparison

| What You've Been Doing | What Play Store Needs |
|------------------------|----------------------|
| `npx expo run:android --variant release` | ❌ Makes APK |
| `cd android && ./gradlew app:bundleRelease` | ✅ Makes AAB |

Both are release builds, but **Play Store requires AAB format!**

---

**Ready to build? Run:**
```bash
cd android && ./gradlew app:bundleRelease
```
