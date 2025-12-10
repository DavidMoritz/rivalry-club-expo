#!/bin/bash

# Exit with 0 if backend changes detected, 1 if no changes
# This script determines if a backend deployment is needed

echo "🔍 Checking for backend changes..."

# Get the list of changed files between HEAD and the previous commit
# In Amplify builds, we check against the base commit
if [ -z "$CODEBUILD_RESOLVED_SOURCE_VERSION" ]; then
  echo "⚠️  Not in Amplify build environment, proceeding with deployment"
  exit 0
fi

# Get the previous commit
PREVIOUS_COMMIT=$(git rev-parse HEAD~1 2>/dev/null)

if [ -z "$PREVIOUS_COMMIT" ]; then
  echo "⚠️  No previous commit found (initial commit?), proceeding with deployment"
  exit 0
fi

echo "Comparing HEAD with $PREVIOUS_COMMIT"

# Check for changes in backend-related files
BACKEND_CHANGES=$(git diff --name-only HEAD $PREVIOUS_COMMIT | grep -E '^(amplify/|package\.json|package-lock\.json)')

if [ -n "$BACKEND_CHANGES" ]; then
  echo "✅ Backend changes detected:"
  echo "$BACKEND_CHANGES"
  exit 0
else
  echo "ℹ️  No backend changes detected. Skipping deployment."
  echo "   Changed files are frontend-only."
  exit 1
fi
