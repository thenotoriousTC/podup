# PowerShell script to replace TouchableOpacity imports with custom component
# This disables the clicking sound on all buttons/touchable elements

Write-Host "🔧 Updating TouchableOpacity imports to disable click sound..." -ForegroundColor Cyan
Write-Host ""

$projectRoot = $PSScriptRoot
$srcPath = Join-Path $projectRoot "src"

# Find all TypeScript/TSX files that import TouchableOpacity from react-native
$files = Get-ChildItem -Path $srcPath -Recurse -Include "*.tsx","*.ts" | 
    Where-Object { (Get-Content $_.FullName -Raw) -match "from ['`"]react-native['`"].*TouchableOpacity" }

$updatedCount = 0
$errorCount = 0

foreach ($file in $files) {
    try {
        Write-Host "📝 Processing: $($file.Name)" -ForegroundColor Yellow
        
        $content = Get-Content $file.FullName -Raw
        $originalContent = $content
        
        # Pattern 1: import { ..., TouchableOpacity, ... } from 'react-native';
        # Replace with: separate imports
        $content = $content -replace "import\s*\{\s*([^}]*?),?\s*TouchableOpacity\s*,?\s*([^}]*?)\s*\}\s*from\s*['`"]react-native['`"];", {
            param($match)
            $before = $match.Groups[1].Value.Trim()
            $after = $match.Groups[2].Value.Trim()
            
            # Clean up commas
            $before = $before -replace ',\s*$', ''
            $after = $after -replace '^\s*,', ''
            
            # Build the imports
            $rnImports = @()
            if ($before) { $rnImports += $before }
            if ($after) { $rnImports += $after }
            
            $result = ""
            if ($rnImports.Count -gt 0) {
                $result = "import { $($rnImports -join ', ') } from 'react-native';`n"
            }
            $result += "import { TouchableOpacity } from '@/components/TouchableOpacity';"
            
            return $result
        }
        
        # Pattern 2: import { TouchableOpacity } from 'react-native'; (alone)
        $content = $content -replace "import\s*\{\s*TouchableOpacity\s*\}\s*from\s*['`"]react-native['`"];", "import { TouchableOpacity } from '@/components/TouchableOpacity';"
        
        # Only write if content changed
        if ($content -ne $originalContent) {
            Set-Content -Path $file.FullName -Value $content -NoNewline
            Write-Host "  ✅ Updated successfully" -ForegroundColor Green
            $updatedCount++
        } else {
            Write-Host "  ⏭️  No changes needed" -ForegroundColor Gray
        }
        
    } catch {
        Write-Host "  ❌ Error: $_" -ForegroundColor Red
        $errorCount++
    }
    
    Write-Host ""
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✨ Update Complete!" -ForegroundColor Green
Write-Host "📊 Files updated: $updatedCount" -ForegroundColor Cyan
if ($errorCount -gt 0) {
    Write-Host "⚠️  Errors: $errorCount" -ForegroundColor Red
}
Write-Host ""
Write-Host "🎯 Next steps:" -ForegroundColor Yellow
Write-Host "  1. Rebuild your app: npx expo start --clear"
Write-Host "  2. Test on your device - the clicking sounds should be gone!"
Write-Host ""
