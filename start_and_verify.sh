#!/usr/bin/env bash
set -euo pipefail

cd /c/Users/fatim/OneDrive/Desktop/noob\ projects/harvestlink

echo '=== STARTING DEV SERVER ==='
PORT=3000 npm run dev > /tmp/hl_dev_stdout.log 2> /tmp/hl_dev_stderr.log &
DEV_PID=$!
echo "Dev PID: $DEV_PID"

# Wait for server
echo 'Waiting for server...'
for i in $(seq 1 30); do
  sleep 1
  CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
  if [ "$CODE" = "200" ] || [ "$CODE" = "308" ]; then
    echo "Server ready: HTTP $CODE"
    break
  fi
  if [ $((i % 5)) -eq 0 ]; then
    echo "Attempt $i: HTTP $CODE"
  fi
done

echo ""
echo '=== HTTP CHECKS ==='
echo -n "ROOT (/): "
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/
echo ""
echo -n "/dashboard (no cookie): "
curl -s -o /dev/null -w "%{http_code}" -D - http://localhost:3000/dashboard 2>&1 | head -1
echo ""
echo -n "/api/auth/me (no cookie): "
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/auth/me
echo ""

echo ""
echo '=== VERIFY DAY 2 ==='
node scripts/verify_day2.mjs 2>&1
VERIFY_EXIT=$?
echo "=== VERIFY_EXIT: $VERIFY_EXIT ==="
