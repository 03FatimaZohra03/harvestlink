#!/usr/bin/env bash
set -euo pipefail

sleep 20

echo '=== POLLING ==='
echo -n "ROOT (/): "
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/
echo ""

echo -n "/dashboard (no cookie): "
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/dashboard
echo ""

echo -n "/api/auth/me (no cookie): "
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/auth/me
echo ""
