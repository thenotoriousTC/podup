# 🔇 Disable TouchableOpacity Click Sound

## Problem

Android plays a clicking sound when pressing TouchableOpacity components (buttons, icons, etc). This can be annoying for users.

## Solution

Created a custom `TouchableOpacity` wrapper component that automatically disables the Android click sound by setting `touchSoundDisabled={true}` by default.

## Files Created

1. **`src/components/TouchableOpacity.tsx`**
   - Custom wrapper component
   - Disables Android click sound by default
   - Maintains all TouchableOpacity functionality

2. **`fix-touchable-opacity.js`**
   - Node.js script to update all imports automatically
   - Replaces `react-native` imports with custom component

## How to Apply

### Automatic (Recommended)

Run the script to update all files at once:

```bash
node fix-touchable-opacity.js
```

This will:
- ✅ Find all files importing TouchableOpacity from 'react-native'
- ✅ Replace with import from '@/components/TouchableOpacity'
- ✅ Preserve all other imports
- ✅ Skip files already updated

### Manual

For individual files, change:

```typescript
// ❌ Before
import { View, TouchableOpacity, Text } from 'react-native';

// ✅ After
import { View, Text } from 'react-native';
import { TouchableOpacity } from '@/components/TouchableOpacity';
```

## Testing

1. **Run the script:**
   ```bash
   node fix-touchable-opacity.js
   ```

2. **Rebuild the app:**
   ```bash
   npx expo start --clear
   ```

3. **Test on device:**
   - Press buttons, icons, and touchable elements
   - Clicking sounds should be gone ✅
   - All functionality should work normally

## Technical Details

The custom component uses React Native's built-in `touchSoundDisabled` prop:

```typescript
<RNTouchableOpacity 
  touchSoundDisabled={true}  // Disables Android system sound
  {...props} 
/>
```

This prop:
- ✅ Only affects Android (iOS doesn't have this sound by default)
- ✅ Is an official React Native prop (documented at reactnative.dev)
- ✅ Has zero performance impact
- ✅ Can be overridden per-component if needed

## Affected Components

The script updates ~27 files including:
- SearchBar
- SeriesCard
- bookListItem
- discoveryBookListItem
- RecordingControls
- MetadataForm
- Profile screens
- Auth screens
- And more...

## Reverting Changes

If needed, you can revert by changing imports back:

```typescript
// Revert to original
import { TouchableOpacity } from 'react-native';
```

Or use git:
```bash
git checkout -- src/
```

## Benefits

✅ **Better UX** - No annoying clicking sounds
✅ **Consistent** - All buttons behave the same way
✅ **Easy to maintain** - Single component to manage
✅ **Optional** - Can still enable sound per-component if needed

## Override if Needed

If you want sound on a specific button:

```typescript
<TouchableOpacity 
  touchSoundDisabled={false}  // Enable sound for this button
  onPress={handlePress}
>
  <Text>Press me with sound!</Text>
</TouchableOpacity>
```

---

**Status:** ✅ Ready to run
**Impact:** ~27 files will be updated
**Time:** ~5 seconds to run script
