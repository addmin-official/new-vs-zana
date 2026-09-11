#!/bin/bash
echo "=== PRIMARY_MODEL ==="
grep -rn "PRIMARY_MODEL" . --include="*.ts" --include="*.json" --include="*.toml" --include="*.vars" --include=".env*" 2>/dev/null | grep -v node_modules

echo ""
echo "=== VISION_MODEL ==="
grep -rn "VISION_MODEL" . --include="*.ts" --include="*.json" --include="*.toml" --include="*.vars" --include=".env*" 2>/dev/null | grep -v node_modules

echo ""
echo "=== بەهای ئێستا لە ژینگە ==="
echo "PRIMARY_MODEL=${PRIMARY_MODEL:-دیارینەکراو}"
echo "VISION_MODEL=${VISION_MODEL:-دیارینەکراو}"
