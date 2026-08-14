const chalk = require('chalk');

async function copyToClipboard(text) {
  try {
    const clipboardy = require('clipboardy');
    await clipboardy.write(text);
    console.log(chalk.green('📋 Text automatically copied to system clipboard!'));
    return true;
  } catch (err) {
    console.log(chalk.yellow('⚠️  Could not copy directly to clipboard. Here is the received text:'));
    console.log(chalk.white.bgBlack(`\n${text}\n`));
    return false;
  }
}

module.exports = { copyToClipboard };
