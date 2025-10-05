#!/bin/bash

echo "🚀 Cleaning and reinstalling Expo project..."

# 1. Remove old global expo-cli
if command -v expo >/dev/null 2>&1; then
  echo "📦 Uninstalling global expo-cli..."
  npm uninstall -g expo-cli
fi

# 2. Clean node_modules + lockfile
echo "🧹 Removing node_modules and package-lock.json..."
rm -rf node_modules package-lock.json

# 3. Clear npm cache
echo "🧼 Clearing npm cache..."
npm cache clean --force

# 4. Reinstall dependencies
echo "📦 Installing dependencies..."
npm install

# 5. Start Expo with new local CLI
echo "⚡ Starting project with npx expo..."
npx expo start -c
