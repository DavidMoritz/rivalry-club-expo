#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const appJsonPath = path.join(__dirname, '../app.json');
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

// Get current iOS build number or default to 1
const currentIosBuild = Number.parseInt(appJson.expo.ios.buildNumber || '1', 10);
const newIosBuild = currentIosBuild + 1;

// Get current Android version code or default to 1
const currentAndroidVersion = Number.parseInt(appJson.expo.android.versionCode || '1', 10);
const newAndroidVersion = currentAndroidVersion + 1;

// Update iOS build number
appJson.expo.ios.buildNumber = newIosBuild.toString();

// Update Android version code
appJson.expo.android.versionCode = newAndroidVersion;

// Write back to file
fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');

console.log(`✅ iOS build number incremented: ${currentIosBuild} → ${newIosBuild}`);
console.log(`✅ Android version code incremented: ${currentAndroidVersion} → ${newAndroidVersion}`);
