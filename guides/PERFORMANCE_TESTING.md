# 🚀 Performance Testing Guide

Complete guide for testing performance in your React Native Expo app to detect:
- ❌ Unnecessary re-renders
- ❌ Memory leaks
- ❌ Infinite loops  
- ❌ Performance bottlenecks

Based on official React Native documentation (verified with Context7).

---

## 🔧 Tools Setup

### 1. Why Did You Render (Best for Re-renders)

**Installation:**
```bash
npm install --save-dev @welldone-software/why-did-you-render
```

**Already configured in:** `wdyr.ts` and `src/app/_layout.tsx`

**What it shows:**
- Which components are re-rendering
- Why they re-rendered (props/state changes)
- Whether the re-render was necessary

**Output Example:**
```
DiscoverScreen re-rendered because of:
  • hook useState changed from [state1] to [state2]
  • prop searchQuery changed from "test" to "test2"
```

---

### 2. React DevTools Profiler (Visual Performance Analysis)

**How to use:**
```bash
# Start app
npx expo start

# Press 'j' to open Chrome DevTools
# Go to "Profiler" tab
```

**Steps:**
1. Click **"Record"** button (red circle)
2. Interact with your app (navigate, scroll, etc.)
3. Click **"Stop"** button
4. Analyze the flame graph

**What it shows:**
- ⏱️ How long each component takes to render
- 🔄 How many times each component re-rendered
- 🎯 Which components are slow

**Enable Re-render Highlighting:**
```
DevTools → Settings (⚙️) → "Highlight updates when components render"
```

Components will flash when they re-render:
- **Blue** = Infrequent updates (good)
- **Yellow** = Moderate updates
- **Red** = Frequent updates (investigate!)

---

### 3. Expo Performance Monitor (Real-time FPS)

**Add to your app:**

Create `src/components/PerformanceMonitor.tsx`:

```typescript
import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';

export function PerformanceMonitor() {
  const [fps, setFps] = useState(60);
  const [lastFrameTime, setLastFrameTime] = useState(Date.now());
  const [frameCount, setFrameCount] = useState(0);

  useEffect(() => {
    if (!__DEV__) return; // Only in development

    const interval = setInterval(() => {
      const now = Date.now();
      const delta = now - lastFrameTime;
      const currentFps = Math.round(1000 / delta);
      
      setFps(currentFps);
      setLastFrameTime(now);
      setFrameCount(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [lastFrameTime]);

  if (!__DEV__) return null;

  return (
    <View style={{
      position: 'absolute',
      top: 50,
      right: 10,
      backgroundColor: fps < 50 ? 'red' : fps < 55 ? 'orange' : 'green',
      padding: 8,
      borderRadius: 4,
      zIndex: 9999,
    }}>
      <Text style={{ color: 'white', fontWeight: 'bold' }}>
        FPS: {fps}
      </Text>
    </View>
  );
}
```

**Add to _layout.tsx:**
```typescript
import { PerformanceMonitor } from '@/components/PerformanceMonitor';

// In your root component:
<>
  <PerformanceMonitor />
  {/* Your app */}
</>
```

---

### 4. Memory Leak Detection

**Install Flipper (Meta's debugging tool):**
```bash
npm install --save-dev react-native-flipper
```

**Or use Chrome DevTools:**
1. Start app with `npx expo start`
2. Press `j` to open DevTools
3. Go to **Memory** tab
4. Click **"Take heap snapshot"**
5. Interact with app
6. Take another snapshot
7. Compare to find memory leaks

**Common memory leak sources:**
- ❌ Event listeners not cleaned up
- ❌ Timers (setInterval, setTimeout) not cleared
- ❌ Subscriptions not unsubscribed
- ❌ Large data kept in state

---

### 5. React Native Performance Monitor (Built-in)

**Enable on device:**

**iOS Simulator:**
- Press `Cmd + D`
- Select "Show Performance Monitor"

**Android Emulator:**
- Press `Cmd + M` (Mac) or `Ctrl + M` (Windows)
- Select "Show Performance Monitor"

**Shows:**
- **JS frame rate** - JavaScript thread FPS
- **UI frame rate** - Native UI thread FPS
- **Views** - Number of views in hierarchy
- **RAM** - Memory usage

**Target values:**
- ✅ 60 FPS for both JS and UI threads
- ✅ Consistent memory usage (not growing)

---

## 🧪 Testing Checklist

### Daily Development Testing

```bash
# 1. Install WDYR (already done)
npm install --save-dev @welldone-software/why-did-you-render

# 2. Start app and watch console
npx expo start

# 3. Navigate through app - watch for WDYR warnings in console
```

### Before Each Release

**1. Profile with React DevTools:**
```bash
# Start app
npx expo start
# Press 'j' → Profiler tab → Record → Test app → Stop → Analyze
```

**2. Check for Memory Leaks:**
- Open app → Memory tab in Chrome DevTools
- Take snapshot → Navigate around → Take another snapshot
- Look for growing memory usage

**3. Test on Real Device (CRITICAL):**
```bash
# Android
npx expo start --android

# iOS  
npx expo start --ios
```
**Performance on real devices is different from simulators!**

**4. Test Release Build:**
```bash
# Create release build
eas build --profile preview --platform android

# Install and test - should be MUCH faster than dev
```

---

## 🎯 Common Issues & Fixes

### Issue 1: Frequent Re-renders

**WDYR shows component re-rendering too often**

**Fix with React.memo:**
```typescript
import React from 'react';

// ❌ Before - re-renders every time parent re-renders
const BookListItem = ({ item }) => {
  return <View>...</View>;
};

// ✅ After - only re-renders when item changes
const BookListItem = React.memo(({ item }) => {
  return <View>...</View>;
}, (prevProps, nextProps) => {
  // Return true if props are equal (skip re-render)
  return prevProps.item.id === nextProps.item.id;
});
```

**Fix with useCallback:**
```typescript
import { useCallback } from 'react';

// ❌ Before - creates new function every render
const handlePress = () => console.log('pressed');

// ✅ After - reuses same function
const handlePress = useCallback(() => {
  console.log('pressed');
}, []); // Dependencies array
```

**Fix with useMemo:**
```typescript
import { useMemo } from 'react';

// ❌ Before - recalculates every render
const filteredData = data.filter(item => item.active);

// ✅ After - only recalculates when data changes
const filteredData = useMemo(() => 
  data.filter(item => item.active),
  [data]
);
```

---

### Issue 2: Slow FlatList Scrolling

**Add getItemLayout:**
```typescript
<FlatList
  data={items}
  renderItem={renderItem}
  keyExtractor={item => item.id}
  // Add these for better performance:
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT, // Your item height
    offset: ITEM_HEIGHT * index,
    index,
  })}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={21}
  initialNumToRender={10}
/>
```

**Optimize renderItem:**
```typescript
// ✅ Use useCallback to prevent recreation
const renderItem = useCallback(({ item }) => (
  <BookListItem item={item} />
), []);
```

---

### Issue 3: Memory Leak from useEffect

**❌ Bad - subscription not cleaned up:**
```typescript
useEffect(() => {
  const subscription = someObservable.subscribe(data => {
    setData(data);
  });
  // Leak! Subscription continues even after unmount
}, []);
```

**✅ Good - cleanup function:**
```typescript
useEffect(() => {
  const subscription = someObservable.subscribe(data => {
    setData(data);
  });
  
  // Cleanup function
  return () => {
    subscription.unsubscribe();
  };
}, []);
```

---

### Issue 4: Timer Leaks

**❌ Bad:**
```typescript
useEffect(() => {
  setInterval(() => {
    console.log('tick');
  }, 1000);
  // Leak! Timer continues forever
}, []);
```

**✅ Good:**
```typescript
useEffect(() => {
  const timer = setInterval(() => {
    console.log('tick');
  }, 1000);
  
  return () => clearInterval(timer);
}, []);
```

---

## 📊 Performance Benchmarks

**Target Metrics:**
- ✅ **60 FPS** on both JS and UI threads
- ✅ **<100ms** component render time
- ✅ **<16ms** per frame (60 FPS)
- ✅ **Stable memory** (not growing over time)
- ✅ **<1 second** screen transition time

**Your App Specific:**
- FlatList scroll: Smooth at 60 FPS
- Discover screen: Loads in <2 seconds
- Audio playback: No stuttering
- Navigation: <300ms transition time

---

## 🚦 Testing Workflow

**Every Feature:**
1. ✅ Check WDYR console output
2. ✅ Enable re-render highlighting
3. ✅ Profile with React DevTools
4. ✅ Check Performance Monitor (60 FPS?)

**Before Commit:**
1. ✅ Test on real device
2. ✅ Check for memory leaks
3. ✅ Profile critical user flows

**Before Release:**
1. ✅ Test release build
2. ✅ Profile entire app
3. ✅ Memory leak test (30 min usage)
4. ✅ Test on low-end device

---

## 🔍 Quick Commands

```bash
# Start with performance monitoring
npx expo start

# Open DevTools
# Press 'j' in terminal

# Build release version
eas build --profile preview --platform android

# Install WDYR (already done)
npm install --save-dev @welldone-software/why-did-you-render

# Check bundle size
npx expo export --platform android
```

---

## 📚 Resources

- [React Native Performance Docs](https://reactnative.dev/docs/performance)
- [React DevTools Profiler](https://reactnative.dev/docs/react-native-devtools)
- [Optimizing FlatList](https://reactnative.dev/docs/optimizing-flatlist-configuration)
- [Why Did You Render Docs](https://github.com/welldone-software/why-did-you-render)

---

**Status:** ✅ Ready to test
**Tools installed:** WDYR configured in wdyr.ts
**Next step:** Run `npx expo start` and watch console for re-render warnings!
