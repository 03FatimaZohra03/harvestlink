#!/usr/bin/env bash
set -euo pipefail

cd /c/Users/fatim/OneDrive/Desktop/noob\ projects/harvestlink

echo '=== GREP next/headers in app/dashboard/ ==='
grep -r "next/headers" app/dashboard/ 2>&1 || echo 'NO_MATCHES_FOUND'
