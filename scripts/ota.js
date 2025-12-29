#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
let platform = null;
let messageArgs = [];

const androidVersion = '1.5.0';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--ios') {
    platform = 'ios';
  } else if (args[i] === '--android') {
    platform = 'android';
  } else {
    messageArgs.push(args[i]);
  }
}

const message = messageArgs.join(' ');

if (!message) {
  console.error('❌ Error: Message is required.');
  console.error('Usage: npm run ota [--ios|--android] "your message"');
  console.error('  --ios:     Update iOS only (runtime version from app.json)');
  console.error(`  --android: Update Android only (runtime version ${androidVersion})`);
  console.error('  (default): Update both platforms');
  process.exit(1);
}

// Read app.json for iOS version
const appJsonPath = path.join(__dirname, '../app.json');
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
const iosVersion = appJson.expo.version;

// Check if versions are in sync
const versionsInSync = androidVersion === iosVersion;

console.log(`📦 Publishing OTA update: "${message}"`);
if (platform === 'ios') {
  console.log(`   Platform: iOS only (runtime version ${iosVersion})`);
} else if (platform === 'android') {
  console.log(`   Platform: Android only (runtime version ${androidVersion})`);
} else if (versionsInSync) {
  console.log(`   Platform: Both (runtime version ${iosVersion})`);
} else {
  console.log(`   Platform: iOS (${iosVersion}) and Android (${androidVersion})`);
}
console.log('');

try {
  if (platform === 'ios') {
    // iOS only
    execSync(
      `eas update --branch production --platform ios --runtime-version ${iosVersion} --message "${message}"`,
      {
        stdio: 'inherit',
        encoding: 'utf-8'
      }
    );
  } else if (platform === 'android') {
    // Android only
    execSync(
      `eas update --branch production --platform android --runtime-version ${androidVersion} --message "${message}"`,
      {
        stdio: 'inherit',
        encoding: 'utf-8'
      }
    );
  } else if (versionsInSync) {
    // Both platforms are in sync - one update works for both
    execSync(
      `eas update --branch production --message "${message}"`,
      {
        stdio: 'inherit',
        encoding: 'utf-8'
      }
    );
  } else {
    // Both platforms - run separately with different runtime versions
    console.log('Publishing iOS update...');
    execSync(
      `eas update --branch production --platform ios --runtime-version ${iosVersion} --message "${message}"`,
      {
        stdio: 'inherit',
        encoding: 'utf-8'
      }
    );
    console.log('');
    console.log('Publishing Android update...');
    execSync(
      `eas update --branch production --platform android --runtime-version ${androidVersion} --message "${message}"`,
      {
        stdio: 'inherit',
        encoding: 'utf-8'
      }
    );
  }

  console.log('');
  console.log('💾 Committing to git...');

  // Add all files including untracked
  execSync('git add -A', {
    stdio: 'inherit',
    encoding: 'utf-8'
  });

  // Create commit message with platform info
  let commitMessage = 'OTA';
  if (platform === 'ios') {
    commitMessage += ' [iOS]';
  } else if (platform === 'android') {
    commitMessage += ' [Android]';
  }
  commitMessage += ` ${message}`;

  // Run git commit
  execSync(`git commit -m "${commitMessage}"`, {
    stdio: 'inherit',
    encoding: 'utf-8'
  });

  console.log('');
  console.log('✅ OTA update published and committed!');
} catch (error) {
  console.error('❌ Error occurred during OTA update');
  process.exit(1);
}
