#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// This script copies the production amplify_outputs.json before building
// It ignores any --platform flags that EAS might add

const sourceFile = path.join(__dirname, '../amplify_outputs.production.json');
const destFile = path.join(__dirname, '../amplify_outputs.json');

try {
  fs.copyFileSync(sourceFile, destFile);
  console.log('✅ Copied amplify_outputs.production.json to amplify_outputs.json');
} catch (error) {
  console.error('❌ Error copying amplify_outputs:', error.message);
  process.exit(1);
}
