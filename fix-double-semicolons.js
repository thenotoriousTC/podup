#!/usr/bin/env node

/**
 * Quick fix to remove double semicolons from TouchableOpacity imports
 */

const fs = require('node:fs');
const path = require('node:path');

const srcPath = path.join(__dirname, 'src');

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);
  
  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else if (filePath.match(/\.(tsx|ts)$/)) {
      arrayOfFiles.push(filePath);
    }
  });
  
  return arrayOfFiles;
}

console.log('🔧 Fixing double semicolons...\n');

const files = getAllFiles(srcPath);
let fixedCount = 0;

files.forEach((file) => {
  let content = fs.readFileSync(file, 'utf8');
  const originalContent = content;
  
  // Fix double semicolons in TouchableOpacity imports
  content = content.replace(
    /from '@\/components\/TouchableOpacity';;/g,
    "from '@/components/TouchableOpacity';"
  );
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    const relativePath = path.relative(srcPath, file);
    console.log(`✅ Fixed: ${relativePath}`);
    fixedCount++;
  }
});

console.log(`\n✨ Done! Fixed ${fixedCount} files.\n`);
