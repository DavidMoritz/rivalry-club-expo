const { execSync } = require('child_process');

const appJson = require('./app.json');

function getUpdateLabel() {
  try {
    const sha = execSync('git rev-parse --short=4 HEAD', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim().slice(0, 4);

    return `sha ${sha}`;
  } catch {
    return 'sha dev';
  }
}

module.exports = {
  ...appJson.expo,
  extra: {
    ...appJson.expo.extra,
    updateLabel: getUpdateLabel(),
  },
};
