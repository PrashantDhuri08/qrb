#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const boxen = require('boxen');
const { startReceiveSession } = require('../src/receive');
const { getConfig, setConfig, printConfig } = require('../src/config');

program
  .name('qrb')
  .description('QR Bridge - Share text and files seamlessly from phone to PC')
  .version('1.0.0');

program
  .command('receive')
  .alias('r')
  .description('Start listener & generate QR code to receive content from mobile')
  .option('-p, --port <number>', 'Local server port', '4000')
  .option('-d, --dir <path>', 'Save directory for received files')
  .option('-s, --server <url>', 'QRB relay server URL')
  .option('--no-clipboard', 'Disable automatic copying of received text to clipboard')
  .action(async (options) => {
    try {
      const config = getConfig();
      if (!options.server) {
        options.server = config.relayServer;
      }
      await startReceiveSession(options);
    } catch (err) {
      console.error(chalk.red(`\n[QRB Error] ${err.message}`));
      process.exit(1);
    }
  });

program
  .command('config')
  .description('View or update QRB configuration')
  .option('--dir <path>', 'Set default download directory')
  .option('--server <url>', 'Set default relay server URL')
  .action((options) => {
    if (options.dir || options.server) {
      if (options.dir) setConfig('downloadDir', options.dir);
      if (options.server) setConfig('relayServer', options.server);
      console.log(chalk.green('✓ Configuration updated successfully.'));
    }
    printConfig();
  });

// Default action when no subcommand is specified
if (process.argv.length === 2) {
  startReceiveSession({
    port: '4000',
    server: getConfig().relayServer || 'https://qrb.vercel.app',
    noClipboard: false
  });
} else {
  program.parse(process.argv);
}
