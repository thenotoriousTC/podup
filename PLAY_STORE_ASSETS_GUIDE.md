# Play Store Assets Guide for Insaty

## 📱 Required Assets Checklist

### 1. App Icon ✅
- **Status:** Already configured
- **File:** `./assets/adaptive-icon.png`
- **Size:** 512 x 512 px
- **Format:** PNG (with transparency)
- **Note:** This is your app's identity on the Play Store

### 2. Feature Graphic
- **Size:** 1024 x 500 px
- **Format:** PNG or JPEG
- **Required:** Yes
- **Description:** Banner shown at top of your store listing
- **Design Tips:**
  - Include app name "insaty"
  - Show key feature or branding
  - Keep text readable at small sizes
  - No borders or transparent areas

### 3. Screenshots (REQUIRED)
- **Minimum:** 2 screenshots
- **Maximum:** 8 screenshots
- **Format:** PNG or JPEG
- **Aspect Ratio:** 16:9 or 9:16
- **Dimensions:**
  - Minimum: 320px on shortest side
  - Maximum: 3840px on longest side
- **Recommended:** 1080 x 1920 px (portrait) or 1920 x 1080 px (landscape)

**Screenshot Ideas for Insaty:**
1. Discover screen (podcast feed)
2. Player interface (playing a podcast)
3. Recording interface
4. User profile/library
5. Upload/create content flow
6. Search functionality
7. Series/episode management
8. Playback controls/features

**Tips:**
- Show real content, not lorem ipsum
- Use high-quality, clear images
- Demonstrate key features
- Keep UI clean for screenshots
- Add localized captions if needed

### 4. Promo Video (Optional but Recommended)
- **Length:** 30 seconds - 2 minutes
- **Format:** YouTube video
- **Description:** Quick demo of your app's features
- **Note:** Can significantly increase conversions

---

## 📝 Text Content Required

### 1. App Title
**Current:** insaty
- **Max Length:** 50 characters
- **Rules:** 
  - Unique on Play Store
  - No misleading words
  - No excessive keywords

### 2. Short Description
- **Max Length:** 80 characters
- **Purpose:** Shown in search results
- **Example:** "Create, share, and discover podcasts. Record, upload, and listen on the go."

### 3. Full Description
- **Max Length:** 4000 characters
- **Purpose:** Main store listing description
- **Structure:**
  ```
  [Hook - What makes your app special]
  
  KEY FEATURES:
  • Feature 1
  • Feature 2
  • Feature 3
  
  [Detailed explanation of features]
  
  [Call to action]
  ```

**Suggested Description for Insaty:**
```
Insaty - Your Complete Podcast Platform

Create, share, and discover amazing podcasts all in one place. Whether you're a podcast creator or a passionate listener, Insaty makes it easy to express yourself through audio content.

🎙️ FOR CREATORS:
• Record directly in the app with professional quality
• Upload existing audio files
• Create podcast series and episodes
• Organize your content effortlessly
• Manage episode metadata
• Build your audience

🎧 FOR LISTENERS:
• Discover trending podcasts
• Browse by categories
• Smart playback controls
• Offline listening support
• Build your personal library
• Follow your favorite creators

⚡ POWERFUL FEATURES:
• Intuitive player with seek, skip, and speed controls
• Background audio playback
• Series and standalone episode support
• User profiles and following system
• Beautiful, modern interface
• Fast and reliable

Whether you're recording your first podcast or you're a seasoned creator, Insaty provides all the tools you need. For listeners, discover a world of content from creators worldwide.

Join the Insaty community today and start your podcasting journey!

📧 Support: [Your support email]
🌐 Website: [Your website]
🔒 Privacy: [Privacy policy URL]
```

---

## 🔒 Legal Requirements

### 1. Privacy Policy (REQUIRED)
- **Format:** Web URL
- **Required:** Yes (all Play Store apps need this)
- **Must Include:**
  - What data you collect
  - How data is used
  - How data is stored
  - Third-party services (Supabase, Cloudflare R2)
  - User rights
  - Contact information

**Quick Privacy Policy Setup:**
- Use a generator: https://www.privacypolicygenerator.info/
- Or use: https://app-privacy-policy-generator.firebaseapp.com/
- Host on your website or use GitHub Pages

**Data to Declare for Insaty:**
- User account data (email, profile)
- Audio content (podcasts, recordings)
- Usage analytics (if you collect any)
- Supabase backend usage
- Cloudflare R2 storage

### 2. Terms of Service (Recommended)
- User responsibilities
- Content guidelines
- Account termination policy
- Liability disclaimers

---

## 🎨 Design Requirements

### Color Palette
Document your app's colors for consistency:
- Primary Color: 
- Secondary Color:
- Background:
- Text:

### Typography
- App fonts used
- Ensure readable in screenshots

---

## 📊 Data Safety Section

You'll need to declare:

### Location Data
- [ ] Does not collect
- [ ] Collects (specify approximate/precise)

### Personal Info
- [x] User name
- [x] Email address
- [ ] Phone number
- [x] User profile data

### Audio Files
- [x] Voice or sound recordings
- [x] Music files

### Photos and Videos
- [x] Photos
- [ ] Videos

### App Activity
- [ ] App interactions
- [ ] In-app search history
- [ ] Other user-generated content

### Data Usage Declaration
For each data type, declare:
- **Is it required or optional?**
- **What's it used for?** (App functionality, Analytics, etc.)
- **Is it shared with third parties?**
- **Is data encrypted in transit?** (Yes - Supabase uses HTTPS)
- **Can users request deletion?** (You should allow this)

---

## ✅ Content Rating Questionnaire

Be prepared to answer questions about:
- Violence
- Sexual content
- Language
- Controlled substances
- Gambling
- User interaction features
- Sharing of user information

**For Insaty (likely ratings):**
- User-generated content: Yes (podcasts)
- Users can interact: Yes (following, profiles)
- Unrestricted internet access: Yes
- Content is moderated: Declare your policy

---

## 📋 Pre-Submission Checklist

Before submitting to Play Store:
- [ ] App icon (512x512) ready
- [ ] Feature graphic (1024x500) created
- [ ] At least 2 screenshots captured
- [ ] Short description written (80 chars)
- [ ] Full description written (up to 4000 chars)
- [ ] Privacy policy URL ready
- [ ] Content rating completed
- [ ] Data safety section filled
- [ ] App category selected
- [ ] Target audience defined
- [ ] Store listing tested in preview

---

## 🎯 How to Create Assets

### Taking Screenshots:
1. Run app on Android device or emulator
2. Navigate to key screens
3. Take screenshots (Power + Volume Down on physical device)
4. Optional: Add frames using tools like:
   - https://www.figma.com/
   - https://www.canva.com/
   - https://mockuphone.com/

### Creating Feature Graphic:
Tools:
- Canva (templates available)
- Figma (free design tool)
- Adobe Photoshop/Illustrator
- Online editors like Pixlr

Template:
- Use your brand colors
- Include app icon
- Add tagline or key feature
- Keep it simple and clean

---

## 📥 Asset Organization

Create this folder structure:
```
play-store-assets/
├── icon/
│   └── icon-512x512.png
├── feature-graphic/
│   └── feature-graphic-1024x500.png
├── screenshots/
│   ├── 01-discover.png
│   ├── 02-player.png
│   ├── 03-recording.png
│   ├── 04-profile.png
│   └── 05-library.png
└── descriptions/
    ├── short-description.txt
    └── full-description.txt
```

---

## 🔗 Useful Tools

**Screenshot Tools:**
- https://screenshots.pro/ - Add device frames
- https://mockuphone.com/ - Device mockups
- https://www.apkmirror.com/ - Reference other apps

**Design Tools:**
- Canva - Easy graphic design
- Figma - Professional design
- GIMP - Free Photoshop alternative

**Privacy Policy Generators:**
- https://www.privacypolicygenerator.info/
- https://app-privacy-policy-generator.firebaseapp.com/

**Compliance Checkers:**
- Google Play Console built-in checker
- Pre-launch reports in Play Console

---

## ⏭️ Next Steps

1. **Create your assets** using this guide
2. **Write your descriptions** 
3. **Set up privacy policy**
4. **Complete the build** (if not done)
5. **Fill out Play Console** listing
6. **Submit for review**

---

**Tip:** Look at successful podcast apps on Play Store for inspiration on screenshots and descriptions!
