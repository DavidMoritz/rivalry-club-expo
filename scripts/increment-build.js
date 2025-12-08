#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const appJsonPath = path.join(__dirname, '../app.json');
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

// Get current build number or default to 1
const currentBuild = parseInt(appJson.expo.ios.buildNumber || '1', 10);
const newBuild = currentBuild + 1;

// Update build number
appJson.expo.ios.buildNumber = newBuild.toString();

// Write back to file
fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');

console.log(`✅ Build number incremented: ${currentBuild} → ${newBuild}`);
