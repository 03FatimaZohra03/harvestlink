#!/usr/bin/env bash
set -euo pipefail

sleep 18

echo '=== HTTP CHECKS ==='
echo -n "ROOT: "
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/
echo ""

echo -n "/dashboard (no cookie): "
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/dashboard
echo ""

echo -n "/api/auth/me (no cookie): "
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/auth/me
echo ""

echo ""
echo '=== DEV LOG ERRORS ==='
cat /c/Users/fatim/OneDrive/Desktop/noob\ projects/harvestlink/.next/dev/logs/next-development.log 2>&1 | grep "ERROR" | tail -3
