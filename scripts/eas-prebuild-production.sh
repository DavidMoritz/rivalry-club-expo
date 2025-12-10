#!/bin/bash

# EAS Build prebuild hook for production
# Swaps amplify_outputs.json to use production backend

echo "🔄 Switching to production Amplify backend..."

if [ ! -f "amplify_outputs.production.json" ]; then
  echo "❌ Error: amplify_outputs.production.json not found!"
  exit 1
fi

# Backup sandbox config
cp amplify_outputs.json amplify_outputs.sandbox.backup.json

# Replace with production config
cp amplify_outputs.production.json amplify_outputs.json

echo "✅ Production backend configured"
echo "   User Pool: $(jq -r '.auth.user_pool_id' amplify_outputs.json)"
echo "   API: $(jq -r '.data.url' amplify_outputs.json | sed 's|https://||' | cut -d'.' -f1)"
