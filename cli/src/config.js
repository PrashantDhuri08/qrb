const fs = require('fs');
const path = require('path');
const os = require('os');
const chalk = require('chalk');

const CONFIG_DIR = path.join(os.homedir(), '.qrb');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

const DEFAULT_CONFIG = {
  downloadDir: path.join(os.homedir(), 'Downloads', 'qrb'),
  relayServer: 'https://qrb.vercel.app',
  autoClipboard: true
};

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function getConfig() {
  try {
    ensureDir(CONFIG_DIR);
    if (!fs.existsSync(CONFIG_FILE)) {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(DEFAULT_CONFIG, null, 2));
      return { ...DEFAULT_CONFIG };
    }
    const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch (err) {
    return { ...DEFAULT_CONFIG };
  }
}

function setConfig(key, value) {
  const current = getConfig();
  current[key] = value;
  ensureDir(CONFIG_DIR);
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(current, null, 2));
  return current;
}

function printConfig() {
  const cfg = getConfig();
  console.log(chalk.cyan.bold('\n📱 QRB Configuration Settings:'));
  console.log(chalk.gray('───────────────────────────────────────'));
  console.log(`${chalk.yellow('Download Path:')}   ${cfg.downloadDir}`);
  console.log(`${chalk.yellow('Relay Server:')}    ${cfg.relayServer}`);
  console.log(`${chalk.yellow('Auto Clipboard:')}  ${cfg.autoClipboard ? 'Enabled' : 'Disabled'}`);
  console.log(chalk.gray('───────────────────────────────────────\n'));
}

module.exports = {
  getConfig,
  setConfig,
  printConfig,
  DEFAULT_CONFIG
};
