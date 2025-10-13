/**
 * Why Did You Render (WDYR) setup
 * Detects unnecessary re-renders in development
 * 
 * ONLY runs in development mode - automatically disabled in production
 */
/*
import React from 'react';

if (__DEV__) {
  const whyDidYouRender = require('@welldone-software/why-did-you-render');
  
  whyDidYouRender(React, {
    trackAllPureComponents: true, // Track all pure components
    trackHooks: true, // Track hooks
    trackExtraHooks: [
      [require('react-redux/lib'), 'useSelector'], // If using Redux
    ],
    logOnDifferentValues: true, // Log when values are different
    collapseGroups: true, // Collapse groups in console
    
    // Only track specific components (optional - comment out to track all)
    // include: [/^DiscoverScreen$/, /^BookListItem$/],
    
    // Exclude certain components (optional)
    exclude: [
      /^TouchableOpacity$/,
      /^Link$/,
      /^View$/,
      /^Text$/,
    ],
  });
  
  console.log('🔍 Why Did You Render: Activated');
}
*/