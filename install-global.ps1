# MCP MySQL Analyzer Global Installation Script
# PowerShell script for Windows

Write-Host "🚀 MCP MySQL Analyzer Global Installation" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green
Write-Host "GitHub: https://github.com/MrBozkay/mcp_mysql_analyser" -ForegroundColor Cyan
Write-Host ""

# Check if npm is installed
try {
    $npmVersion = npm --version
    Write-Host "✅ NPM found: v$npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ NPM not found. Please install Node.js first." -ForegroundColor Red
    Write-Host "Download from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ package.json not found. Please run this script from the project root directory." -ForegroundColor Red
    exit 1
}

Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

Write-Host "🔨 Building project..." -ForegroundColor Yellow
npm run build

Write-Host "📦 Creating package..." -ForegroundColor Yellow
npm pack

# Find the generated tarball
$tarball = Get-ChildItem -Name "mrbozkay-mcp_mysql_analyser-*.tgz" | Select-Object -First 1

if (-not $tarball) {
    Write-Host "❌ Tarball not found. Build may have failed." -ForegroundColor Red
    exit 1
}

Write-Host "🌍 Installing globally: $tarball" -ForegroundColor Yellow

# Uninstall existing version if any
try {
    npm uninstall -g @mrbozkay/mcp_mysql_analyser 2>$null
} catch {
    # Ignore errors if package wasn't installed
}

# Install globally with force
npm install -g "./$tarball" --force

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Installation successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 MCP MySQL Analyzer is now available globally!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Supported Platforms:" -ForegroundColor Cyan
    Write-Host "  • Kiro IDE" -ForegroundColor White
    Write-Host "  • Claude Desktop" -ForegroundColor White
    Write-Host "  • VSCode (with MCP extension)" -ForegroundColor White
    Write-Host "  • Cursor IDE" -ForegroundColor White
    Write-Host "  • Google Gemini" -ForegroundColor White
    Write-Host "  • Any MCP-compatible client" -ForegroundColor White
    Write-Host ""
    Write-Host "🔧 Next steps:" -ForegroundColor Cyan
    Write-Host "1. Set your environment variables:" -ForegroundColor White
    Write-Host "   `$env:MYSQL_HOST='localhost'" -ForegroundColor Gray
    Write-Host "   `$env:MYSQL_USER='your_username'" -ForegroundColor Gray
    Write-Host "   `$env:MYSQL_PASSWORD='your_password'" -ForegroundColor Gray
    Write-Host "   `$env:MYSQL_DB='your_database'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Configure your MCP client:" -ForegroundColor White
    Write-Host "   • Kiro IDE: mcp-mysql-analyzer setup" -ForegroundColor Gray
    Write-Host "   • Others: See README.md for platform-specific configs" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Test the installation:" -ForegroundColor White
    Write-Host "   mcp-mysql-analyzer --help" -ForegroundColor Gray
    Write-Host ""
    Write-Host "4. Restart your MCP client to load the server" -ForegroundColor White
    Write-Host ""
    Write-Host "📖 Full documentation: https://github.com/MrBozkay/mcp_mysql_analyser#readme" -ForegroundColor Cyan
} else {
    Write-Host "❌ Installation failed. Please check the error messages above." -ForegroundColor Red
    exit 1
}