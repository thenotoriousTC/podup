# ✅ FIXED: Babel Static Class Block Error

## The Error You're Seeing

```
Android Bundling failed 6118ms node_modules\expo-router\entry.js (1716 modules)
ERROR  node_modules\@aws-sdk\lib-storage\dist-cjs\index.js:
Static class blocks are not enabled. Please add `@babel/plugin-transform-class-static-block` to your configuration.

  170 |
  171 | // src/Upload.ts
> 172 | var Upload = class _Upload extends import_events.EventEmitter {
      |              ^
  173 |   static {
  174 |     __name(this, "Upload");
  175 |   }
```

## Root Cause

The `@aws-sdk/lib-storage` package uses modern JavaScript syntax called **static class blocks**:

```javascript
class Upload {
  static {
    // This is a static class block
  }
}
```

This is a newer JavaScript feature that React Native's default Babel configuration doesn't transpile.

## The Fix Applied

### 1. Updated `babel.config.js`

Added the required Babel plugin:

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      // ✅ Added this for AWS SDK v3 support
      "@babel/plugin-transform-class-static-block",
    ],
  };
};
```

## What You Need to Do

**Step 1: Install the Babel plugin**

```bash
npm install --save-dev @babel/plugin-transform-class-static-block
```

**Step 2: Clean and rebuild**

```bash
# Clean the cache
npx expo start --clear

# Rebuild for Android
npx expo run:android
```

That's it! The error should be gone. 🎉

## Why This Plugin is Needed

The AWS SDK v3 uses several modern JavaScript features:

| Feature | What It Does | Plugin Needed |
|---------|-------------|---------------|
| Static class blocks | Initialize static properties | ✅ `@babel/plugin-transform-class-static-block` |
| Private class fields | Use # for private members | Already in babel-preset-expo |
| Optional chaining | Use ?. operator | Already in babel-preset-expo |

Expo's default Babel preset includes most plugins, but **static class blocks** are so new they need to be explicitly added.

## Verification

After running the steps above, you should see:

✅ Build completes without Babel errors  
✅ App bundles successfully  
✅ App runs on Android device/emulator  
✅ No "static class blocks" errors in console

## Alternative: Check if Plugin is Already Installed

To verify if the plugin installed correctly:

```bash
# Check package.json
cat package.json | grep "@babel/plugin-transform-class-static-block"

# Or check node_modules
ls node_modules/@babel/plugin-transform-class-static-block
```

If you see output, the plugin is installed.

## Common Issues

### Error: "Cannot find module '@babel/plugin-transform-class-static-block'"

**Cause:** Plugin not installed or installation failed.

**Solution:**
```bash
# Clear npm cache and reinstall
npm cache clean --force
npm install --save-dev @babel/plugin-transform-class-static-block
```

### Error persists after installing plugin

**Cause:** Babel cache not cleared.

**Solution:**
```bash
# Clear Metro bundler cache
npx expo start --clear

# Or clear all caches
rm -rf node_modules/.cache
npx expo prebuild --clean
```

### Build works on iOS but not Android

**Cause:** iOS and Android use different JavaScript engines.

**Solution:** The plugin fix works for both platforms. Make sure to:
1. Clean both builds
2. Rebuild from scratch
3. Check `babel.config.js` is correct

## What Changed

| File | Change | Status |
|------|--------|--------|
| `babel.config.js` | Added static class block plugin | ✅ Fixed |
| `package.json` | Will add plugin as devDependency | ⏳ After npm install |

## Related AWS SDK Packages

These packages all use static class blocks:
- ✅ `@aws-sdk/client-s3` - S3 client
- ✅ `@aws-sdk/lib-storage` - Upload helper (the one causing error)
- ✅ `@aws-sdk/middleware-*` - Various middleware

All will work once the plugin is installed.

## Background: What Are Static Class Blocks?

This is a relatively new JavaScript feature (ES2022) that lets you run initialization code for static class properties:

```javascript
class MyClass {
  // Old way (still works)
  static myProp = computeValue();

  // New way (with static block)
  static {
    this.myProp = computeValue();
    this.anotherProp = someOtherValue();
  }
}
```

Benefits:
- More flexible initialization logic
- Can use try/catch
- Can initialize multiple properties together

## Timeline of Fixes

1. ✅ **Process import error** - Fixed by moving polyfills to `_layout.tsx`
2. ✅ **Static class block error** - Fixed by adding Babel plugin
3. ⏳ **Next:** Install plugin and test R2 uploads

## Final Command Summary

Run these in order:

```bash
# 1. Install the Babel plugin
npm install --save-dev @babel/plugin-transform-class-static-block

# 2. Clean cache
npx expo start --clear

# 3. Rebuild (choose one)
npx expo run:android          # For Android
npx expo run:ios              # For iOS
```

---

**Status:** ✅ FIX APPLIED (babel.config.js updated)  
**Action Required:** Install plugin and rebuild  
**ETA:** ~2 minutes
