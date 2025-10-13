#!/usr/bin/env node

/**
 * Script to replace TouchableOpacity imports with custom component
 * that disables Android click sound.
 * 
 * Based on official Node.js filesystem patterns from Context7 documentation.
 * Uses synchronous fs operations for simplicity and reliability.
 */

const fs = require('node:fs');
const path = require('node:path');

const srcPath = path.join(__dirname, 'src');

/**
 * Recursively get all TypeScript/TSX files from a directory
 * Uses fs.readdirSync for synchronous directory reading
 */
function getAllFiles(dirPath, arrayOfFiles = []) {
  try {
    const files = fs.readdirSync(dirPath);

    files.forEach((file) => {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        // Recursively process subdirectories
        arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
      } else if (filePath.match(/\.(tsx|ts)$/)) {
        // Only include TypeScript and TSX files
        arrayOfFiles.push(filePath);
      }
    });
  } catch (error) {
    console.error(`❌ Error reading directory ${dirPath}: ${error.message}`);
  }

  return arrayOfFiles;
}

/**
 * Update a single file's TouchableOpacity imports
 * Returns true if file was modified, false otherwise
 */
function updateFile(filePath) {
  try {
    // Read file content
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Skip if file doesn't import TouchableOpacity from react-native
    if (!content.includes('TouchableOpacity') || !content.includes('react-native')) {
      return false;
    }

    // Skip if already using custom TouchableOpacity
    if (content.includes('@/components/TouchableOpacity')) {
      return false;
    }

    // Pattern 1: Multiple imports including TouchableOpacity
    // Example: import { View, TouchableOpacity, Text } from 'react-native';
    const multiImportRegex = /import\s*\{([^}]*TouchableOpacity[^}]*)\}\s*from\s*['"]react-native['"]/;
    const multiMatch = content.match(multiImportRegex);

    if (multiMatch) {
      // Extract all imports and filter out TouchableOpacity
      const imports = multiMatch[1]
        .split(',')
        .map(i => i.trim())
        .filter(i => i && i !== 'TouchableOpacity');

      if (imports.length > 0) {
        // Keep other imports, add TouchableOpacity separately
        const newImport = `import { ${imports.join(', ')} } from 'react-native';\nimport { TouchableOpacity } from '@/components/TouchableOpacity';`;
        content = content.replace(multiImportRegex, newImport);
      } else {
        // Only TouchableOpacity was imported
        const newImport = `import { TouchableOpacity } from '@/components/TouchableOpacity';`;
        content = content.replace(multiImportRegex, newImport);
      }
    }

    // Pattern 2: Single import
    // Example: import { TouchableOpacity } from 'react-native';
    const singleImportRegex = /import\s*\{\s*TouchableOpacity\s*\}\s*from\s*['"]react-native['"]/;
    if (singleImportRegex.test(content)) {
      content = content.replace(
        singleImportRegex,
        `import { TouchableOpacity } from '@/components/TouchableOpacity'`
      );
    }

    // Only write if content changed
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }

    return false;
  } catch (error) {
    throw new Error(`Failed to update file: ${error.message}`);
  }
}

/**
 * Main execution
 */
function main() {
  console.log('🔧 Updating TouchableOpacity imports to disable click sound...\n');
  console.log(`📁 Scanning directory: ${srcPath}\n`);

  // Get all TypeScript files
  const files = getAllFiles(srcPath);
  console.log(`📄 Found ${files.length} TypeScript/TSX files\n`);

  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  // Process each file
  files.forEach((file) => {
    const relativePath = path.relative(srcPath, file);
    try {
      if (updateFile(file)) {
        console.log(`✅ Updated: ${relativePath}`);
        updatedCount++;
      } else {
        skippedCount++;
      }
    } catch (error) {
      console.error(`❌ Error: ${relativePath} - ${error.message}`);
      errorCount++;
    }
  });

  // Print summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✨ Update Complete!\n');
  console.log(`📊 Summary:`);
  console.log(`   ✅ Files updated: ${updatedCount}`);
  console.log(`   ⏭️  Files skipped: ${skippedCount}`);
  if (errorCount > 0) {
    console.log(`   ❌ Errors: ${errorCount}`);
  }
  
  if (updatedCount > 0) {
    console.log('\n🎯 Next Steps:');
    console.log('   1. Review changes: git diff');
    console.log('   2. Rebuild app: npx expo start --clear');
    console.log('   3. Test on device - clicking sounds should be gone! 🔇');
  } else {
    console.log('\n💡 No files needed updating. Either:');
    console.log('   - Already using custom TouchableOpacity');
    console.log('   - No TouchableOpacity imports from react-native found');
  }
  
  console.log('');
}

// Run the script
main();
