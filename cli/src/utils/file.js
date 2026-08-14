const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

function saveReceivedFile(fileName, buffer, targetDir) {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Ensure unique filename if already exists
  let destinationPath = path.join(targetDir, fileName);
  if (fs.existsSync(destinationPath)) {
    const ext = path.extname(fileName);
    const base = path.basename(fileName, ext);
    const timestamp = Date.now().toString().slice(-4);
    destinationPath = path.join(targetDir, `${base}_${timestamp}${ext}`);
  }

  fs.writeFileSync(destinationPath, buffer);
  const sizeMb = (buffer.length / (1024 * 1024)).toFixed(2);
  
  console.log(chalk.green(`\n📁 File received & saved successfully!`));
  console.log(`   ${chalk.cyan('Path:')} ${destinationPath}`);
  console.log(`   ${chalk.cyan('Size:')} ${sizeMb} MB\n`);
  return destinationPath;
}

module.exports = { saveReceivedFile };
