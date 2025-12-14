const { execSync } = require('child_process');

console.log('Clearing iOS Simulator app data...');

// Get all booted simulators
const simulators = execSync('xcrun simctl list devices booted --json', {
  encoding: 'utf8',
});
const devices = JSON.parse(simulators).devices;

let cleared = false;

// Find booted devices
for (const runtime in devices) {
  for (const device of devices[runtime]) {
    if (device.state === 'Booted') {
      console.log(`Found booted device: ${device.name} (${device.udid})`);

      try {
        // Delete the app from simulator
        execSync(`xcrun simctl uninstall ${device.udid} host.exp.Exponent`, {
          stdio: 'inherit',
        });
        console.log('✓ Uninstalled Expo Go');
        cleared = true;
      } catch (err) {
        console.log('Note: App may not have been installed');
      }
    }
  }
}

if (cleared) {
  console.log('\n✓ Session cleared! Now:');
  console.log('1. Reload your app (shake → Reload)');
  console.log('2. The app will reinstall fresh');
  console.log('3. You should see the sign-in screen');
} else {
  console.log('\nNo booted simulators found. Manual steps:');
  console.log('1. Long press the Expo Go app icon');
  console.log('2. Delete the app');
  console.log('3. Reload in Metro (press "i")');
}
