#!/bin/bash

# MCP MySQL Analyzer Global Installation Script
# Bash script for Linux/Mac

echo "🚀 MCP MySQL Analyzer Global Installation"
echo "======================================="
echo "GitHub: https://github.com/MrBozkay/mcp_mysql_analyser"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ NPM not found. Please install Node.js first."
    echo "Download from: https://nodejs.org/"
    exit 1
fi

npm_version=$(npm --version)
echo "✅ NPM found: v$npm_version"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found. Please run this script from the project root directory."
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building project..."
npm run build

echo "📦 Creating package..."
npm pack

# Find the generated tarball
tarball=$(ls mrbozkay-mcp_mysql_analyser-*.tgz 2>/dev/null | head -n1)

if [ -z "$tarball" ]; then
    echo "❌ Tarball not found. Build may have failed."
    exit 1
fi

echo "🌍 Installing globally: $tarball"

# Uninstall existing version if any
npm uninstall -g @mrbozkay/mcp_mysql_analyser 2>/dev/null || true

# Install globally with force
npm install -g "./$tarball" --force

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Installation successful!"
    echo ""
    echo "🎉 MCP MySQL Analyzer is now available globally!"
    echo ""
    echo "📋 Supported Platforms:"
    echo "  • Kiro IDE"
    echo "  • Claude Desktop"
    echo "  • VSCode (with MCP extension)"
    echo "  • Cursor IDE"
    echo "  • Google Gemini"
    echo "  • Any MCP-compatible client"
    echo ""
    echo "🔧 Next steps:"
    echo "1. Set your environment variables:"
    echo "   export MYSQL_HOST=localhost"
    echo "   export MYSQL_USER=your_username"
    echo "   export MYSQL_PASSWORD=your_password"
    echo "   export MYSQL_DB=your_database"
    echo ""
    echo "2. Configure your MCP client:"
    echo "   • Kiro IDE: mcp-mysql-analyzer setup"
    echo "   • Others: See README.md for platform-specific configs"
    echo ""
    echo "3. Test the installation:"
    echo "   mcp-mysql-analyzer --help"
    echo ""
    echo "4. Restart your MCP client to load the server"
    echo ""
    echo "📖 Full documentation: https://github.com/MrBozkay/mcp_mysql_analyser#readme"
else
    echo "❌ Installation failed. Please check the error messages above."
    exit 1
fi