#!/usr/bin/env node

const { execSync } = require('child_process');

// Get message from command line arguments
const message = process.argv.slice(2).join(' ');

if (!message) {
  console.error('❌ Error: Message is required. Usage: npm run ota "your message"');
  process.exit(1);
}

console.log(`📦 Publishing OTA update: "${message}"`);
console.log('');

try {
  // Run eas update
  execSync(`eas update --branch production --message "${message}"`, {
    stdio: 'inherit',
    encoding: 'utf-8'
  });

  console.log('');
  console.log('💾 Committing to git...');

  // Add all files including untracked
  execSync('git add -A', {
    stdio: 'inherit',
    encoding: 'utf-8'
  });

  // Run git commit
  execSync(`git commit -m "OTA ${message}"`, {
    stdio: 'inherit',
    encoding: 'utf-8'
  });

  console.log('');
  console.log('✅ OTA update published and committed!');
} catch (error) {
  console.error('❌ Error occurred during OTA update');
  process.exit(1);
}
