#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const appJsonPath = path.join(__dirname, '../app.json');
const packageJsonPath = path.join(__dirname, '../package.json');

const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Get current version from app.json and parse it
const currentVersion = appJson.expo.version || '1.0.0';
const versionParts = currentVersion.split('.');
const major = Number.parseInt(versionParts[0], 10);
const minor = Number.parseInt(versionParts[1], 10);
const patch = Number.parseInt(versionParts[2], 10);

// Increment patch version
const newPatch = patch + 1;
const newVersion = `${major}.${minor}.${newPatch}`;

// Get current iOS build number or default to 1
const currentIosBuild = Number.parseInt(appJson.expo.ios.buildNumber || '1', 10);
const newIosBuild = currentIosBuild + 1;

// Get current Android version code or default to 1
const currentAndroidVersion = Number.parseInt(appJson.expo.android.versionCode || '1', 10);
const newAndroidVersion = currentAndroidVersion + 1;

// Update app.json
appJson.expo.version = newVersion;
appJson.expo.ios.buildNumber = newIosBuild.toString();
appJson.expo.android.versionCode = newAndroidVersion;

// Update package.json
packageJson.version = newVersion;

// Write back to files
fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

console.log(`✅ Version bumped: ${currentVersion} → ${newVersion}`);
console.log(`✅ iOS build number incremented: ${currentIosBuild} → ${newIosBuild}`);
console.log(`✅ Android version code incremented: ${currentAndroidVersion} → ${newAndroidVersion}`);
console.log(`✅ package.json version synced to ${newVersion}`);
