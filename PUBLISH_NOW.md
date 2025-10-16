# 🚀 Publish Insaty to Google Play Store - Quick Start

## ✅ What's Already Done
- ✅ App rebranded to "insaty"
- ✅ Package name: `com.insaty.app`
- ✅ EAS configured for AAB builds
- ✅ Environment variables set
- ✅ Production build profile ready

---

## 🎯 Start Here - 3 Main Steps

### Step 1: Build the App (15-20 mins)

```bash
# Make sure EAS CLI is installed
npm install -g eas-cli

# Login to Expo
eas login

# Build production AAB
eas build --platform android --profile production
```

**Wait for build to complete** - you'll get a download link.

---

### Step 2: Prepare Store Assets (While Build Runs)

#### Required Assets:
1. **Screenshots** (minimum 2)
   - Take screenshots of your app
   - Show: Discover, Player, Recording, Profile
   - Size: 1080 x 1920 px recommended

2. **Feature Graphic** (1024 x 500 px)
   - Create a banner for your app
   - Use Canva or Figma
   - Include app name and key visual

3. **Privacy Policy**
   - Edit `PRIVACY_POLICY_TEMPLATE.md`
   - Fill in your details
   - Host on GitHub Pages or your website
   - Get the URL

4. **App Description**
   - Short: 80 characters
   - Full: Explain features (see PLAY_STORE_ASSETS_GUIDE.md)

---

### Step 3: Upload to Play Store

1. **Create App in Play Console**
   - Go to https://play.google.com/console
   - Click "Create App"
   - Name: "insaty"
   - Fill in basic details

2. **Upload Your AAB**
   - Go to Testing → Internal testing (or Production)
   - Create new release
   - Upload the .aab file from Step 1
   - Add release notes

3. **Complete Store Listing**
   - Add screenshots
   - Add feature graphic
   - Add descriptions
   - Add privacy policy URL
   - Select category
   - Set target audience

4. **Complete Required Sections**
   - Content rating questionnaire
   - Data safety declaration
   - App access (login required?)
   - Ads declaration

5. **Submit for Review**
   - Review everything
   - Click "Submit for review"
   - Wait 1-7 days for approval

---

## 📱 Test Your Build First

```bash
# After build completes, test it:
eas build:run -p android
```

Install on a physical Android device and verify:
- [ ] App opens correctly
- [ ] Login/signup works
- [ ] Audio playback works
- [ ] Recording works
- [ ] Upload works
- [ ] Discover feed loads
- [ ] Profile works
- [ ] No crashes

---

## 🔍 Detailed Documentation

For detailed guides, see:
- **PLAY_STORE_DEPLOYMENT.md** - Complete deployment guide
- **PRE_BUILD_CHECKLIST.md** - Pre-flight checks
- **PLAY_STORE_ASSETS_GUIDE.md** - Asset creation guide
- **PRIVACY_POLICY_TEMPLATE.md** - Privacy policy template

---

## ⚡ Quick Commands Reference

```bash
# Build production
eas build --platform android --profile production

# Check build status
eas build:list

# Download and install
eas build:run -p android

# Build and auto-submit (after first time)
eas build --platform android --auto-submit

# Manage credentials
eas credentials

# Set version manually
eas build:version:set
```

---

## 🆘 Troubleshooting

### Build fails?
- Check build logs: `eas build:view [BUILD_ID]`
- Verify you're logged in: `eas whoami`
- Check eas.json is valid JSON

### Can't login to EAS?
- Create account at https://expo.dev
- Run `eas login` again

### Play Console issues?
- Make sure you have a Google Play Developer account ($25 one-time fee)
- Verify payment method is set up

### App rejected?
- Read rejection reasons carefully
- Common issues: Privacy policy, content rating, data safety
- Fix and resubmit

---

## 📧 Support

- **Expo/EAS Issues:** https://expo.dev/support
- **Play Console Help:** https://support.google.com/googleplay/android-developer

---

## 🎉 Ready? Let's Go!

**Run this now:**
```bash
eas build --platform android --profile production
```

Then follow Steps 2 and 3 above while you wait! 🚀

---

**Good luck with your launch! 🎊**
