#!/bin/bash

# Exit with 0 if backend changes detected, 1 if no changes
# This script determines if a backend deployment is needed

echo "🔍 Checking for backend changes..."

# If not in Amplify build environment, always deploy
if [ -z "$CODEBUILD_RESOLVED_SOURCE_VERSION" ]; then
  echo "⚠️  Not in Amplify build environment, proceeding with deployment"
  exit 0
fi

# Find the base commit to compare against
# Check last 20 commits to handle multi-commit pushes
COMMITS_TO_CHECK=20
BASE_COMMIT=$(git rev-parse HEAD~${COMMITS_TO_CHECK} 2>/dev/null)

if [ -z "$BASE_COMMIT" ]; then
  # If we don't have 20 commits, check all commits
  FIRST_COMMIT=$(git rev-list --max-parents=0 HEAD 2>/dev/null)
  if [ -z "$FIRST_COMMIT" ]; then
    echo "⚠️  Cannot determine git history, proceeding with deployment"
    exit 0
  fi
  echo "📊 Checking all commits since repository creation"
  BACKEND_CHANGES=$(git diff --name-only $FIRST_COMMIT HEAD | grep -E '^(amplify/|package\.json|package-lock\.json)')
else
  echo "📊 Checking last $COMMITS_TO_CHECK commits for backend changes"
  BACKEND_CHANGES=$(git diff --name-only $BASE_COMMIT HEAD | grep -E '^(amplify/|package\.json|package-lock\.json)')
fi

# List all changed files for debugging
echo "All changed files in range:"
if [ -z "$BASE_COMMIT" ]; then
  git diff --name-only $FIRST_COMMIT HEAD | head -20
else
  git diff --name-only $BASE_COMMIT HEAD | head -20
fi

if [ -n "$BACKEND_CHANGES" ]; then
  echo ""
  echo "✅ Backend changes detected:"
  echo "$BACKEND_CHANGES"
  exit 0
else
  echo ""
  echo "ℹ️  No backend changes detected. Skipping deployment."
  echo "   All changes are frontend-only (src/components, src/controllers, etc.)"
  exit 1
fi
