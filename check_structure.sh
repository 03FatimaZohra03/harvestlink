#!/usr/bin/env bash
set -euo pipefail

cd /c/Users/fatim/OneDrive/Desktop/noob\ projects/harvestlink

echo '=== ROOT_APP_FILES ==='
find app -type f 2>/dev/null | sort

echo ''
echo '=== SRC_APP_FILES ==='
find src/app -type f 2>/dev/null | sort

echo ''
echo '=== LAYOUT_JS ==='
cat app/layout.js 2>/dev/null | head -5

echo ''
echo '=== MIDDLEWARE ==='
ls -la middleware.ts 2>/dev/null

echo ''
echo '=== SRC_LIB ==='
ls -la src/lib/ 2>/dev/null
