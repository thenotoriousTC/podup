const fs = require('fs');
const path = require('path');

/**
 * Automated script to replace Pressable imports from 'react-native' 
 * with custom Pressable component that disables Android click sound.
 * 
 * This script:
 * - Recursively scans src/ for .ts/.tsx files
 * - Finds imports containing Pressable from 'react-native'
 * - Replaces with custom @/components/Pressable import
 * - Preserves other react-native imports
 * - Provides detailed summary of changes
 */

const SRC_DIR = path.join(__dirname, 'src');
let filesModified = 0;
let filesScanned = 0;
const modifiedFiles = [];

/**
 * Recursively walks through directory and processes TypeScript files
 */
function walkDir(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      filesScanned++;
      processFile(filePath);
    }
  });
}

/**
 * Processes a single file and replaces Pressable imports
 */
function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  // Skip if file already imports from custom Pressable
  if (content.includes("from '@/components/Pressable'") || 
      content.includes('from "@/components/Pressable"')) {
    return;
  }
  
  // Pattern 1: import { ..., Pressable, ... } from 'react-native';
  const multiImportRegex = /import\s*\{([^}]+)\}\s*from\s*['"]react-native['"]/g;
  
  content = content.replace(multiImportRegex, (match, imports) => {
    if (!imports.includes('Pressable')) {
      return match; // No Pressable in this import, keep as is
    }
    
    // Split imports and filter out Pressable
    const importList = imports
      .split(',')
      .map(imp => imp.trim())
      .filter(imp => imp && imp !== 'Pressable');
    
    // Build the new imports
    let newImports = '';
    
    // Add custom Pressable import at the beginning
    newImports += "import { Pressable } from '@/components/Pressable';\n";
    
    // Add remaining react-native imports if any
    if (importList.length > 0) {
      newImports += `import { ${importList.join(', ')} } from 'react-native';`;
    } else {
      // Remove trailing newline if no other imports
      newImports = newImports.trimEnd();
    }
    
    return newImports;
  });
  
  // Pattern 2: import { Pressable } from 'react-native';
  const singleImportRegex = /import\s*\{\s*Pressable\s*\}\s*from\s*['"]react-native['"];?/g;
  content = content.replace(singleImportRegex, "import { Pressable } from '@/components/Pressable';");
  
  // Only write if content changed
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    filesModified++;
    modifiedFiles.push(path.relative(__dirname, filePath));
    console.log(`✓ Modified: ${path.relative(__dirname, filePath)}`);
  }
}

/**
 * Main execution
 */
console.log('🔍 Scanning for Pressable imports from react-native...\n');
console.log(`📁 Searching in: ${SRC_DIR}\n`);

walkDir(SRC_DIR);

console.log('\n' + '='.repeat(60));
console.log('📊 SUMMARY');
console.log('='.repeat(60));
console.log(`Files scanned: ${filesScanned}`);
console.log(`Files modified: ${filesModified}`);

if (modifiedFiles.length > 0) {
  console.log('\n📝 Modified files:');
  modifiedFiles.forEach(file => {
    console.log(`  - ${file}`);
  });
  
  console.log('\n✅ SUCCESS!');
  console.log('All Pressable components now use the custom wrapper.');
  console.log('Android click sounds are disabled by default.');
  console.log('\nNext steps:');
  console.log('1. Run: npx expo start --clear');
  console.log('2. Test on your Android device');
  console.log('3. Enjoy silent Pressable interactions! 🎉');
} else {
  console.log('\n✨ No files needed modification.');
  console.log('All Pressable imports are already using the custom component.');
}

console.log('='.repeat(60) + '\n');
