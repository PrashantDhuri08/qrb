const qrcode = require('qrcode-terminal');
const chalk = require('chalk');
const rawBoxen = require('boxen');
const boxen = typeof rawBoxen === 'function' ? rawBoxen : (rawBoxen && rawBoxen.default ? rawBoxen.default : null);

function renderBox(text, options = {}) {
  if (typeof boxen === 'function') {
    try {
      return boxen(text, options);
    } catch (e) {}
  }
  return `┌──────────────────────────────────────────┐\n${text}\n└──────────────────────────────────────────┘`;
}

const ora = require('ora');
const express = require('express');
const multer = require('multer');
const http = require('http');
const WebSocket = require('ws');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const { getConfig } = require('./config');
const { copyToClipboard } = require('./utils/clipboard');
const { saveReceivedFile } = require('./utils/file');

function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

function generateSessionId() {
  return crypto.randomBytes(6).toString('hex');
}

async function startReceiveSession(options = {}) {
  const config = getConfig();
  const port = parseInt(options.port || '4000', 10);
  const downloadDir = options.dir || config.downloadDir;
  const relayServer = (options.server || config.relayServer).replace(/\/$/, '');
  const autoClipboard = options.noClipboard === false ? true : config.autoClipboard;

  const sessionId = generateSessionId();
  const sessionUrl = `${relayServer}/session/${sessionId}`;
  const localIp = getLocalIpAddress();
  const localDirectUrl = `http://${localIp}:${port}/direct/${sessionId}`;

  console.clear();

  const titleBox = renderBox(
    chalk.bold.cyan('📱 QRB - QR Bridge Receiver') + '\n' +
    chalk.gray('Instant phone-to-PC transfer service'),
    { padding: 1, margin: 1, borderStyle: 'round', borderColor: 'cyan' }
  );
  console.log(titleBox);

  console.log(chalk.bold.yellow(' Scan this QR code on your phone to send text or files:'));
  console.log();

  // Render QR Code in terminal
  qrcode.generate(sessionUrl, { small: true }, (qr) => {
    console.log(qr);
  });

  console.log(chalk.cyan(' Session Details:'));
  console.log(`   ${chalk.gray('• Session ID:')}  ${chalk.bold.white(sessionId)}`);
  console.log(`   ${chalk.gray('• Web URL:')}     ${chalk.underline.blue(sessionUrl)}`);
  console.log(`   ${chalk.gray('• Local IP:')}    ${chalk.underline.blue(localDirectUrl)}`);
  console.log(`   ${chalk.gray('• Save Dir:')}    ${chalk.green(downloadDir)}`);
  console.log();

  const spinner = ora(chalk.dim('Listening for incoming transfers... (Press Ctrl+C to exit)')).start();

  // Start local Express server for direct transfers & CORS fallback
  const app = express();
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));
  
  // Enable CORS
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
  });

  const upload = multer({ limits: { fileSize: 500 * 1024 * 1024 } }); // 500MB max file

  // Endpoint to handle direct uploads
  app.post(`/direct/${sessionId}`, upload.single('file'), async (req, res) => {
    try {
      spinner.stop();
      if (req.file) {
        saveReceivedFile(req.file.originalname, req.file.buffer, downloadDir);
        res.json({ success: true, message: 'File received successfully' });
      } else if (req.body && req.body.text) {
        const text = req.body.text;
        console.log(chalk.bold.green('\n📩 Received Text Payload:'));
        console.log(chalk.white.bgDarkGray ? chalk.white(text) : text);
        if (autoClipboard) {
          await copyToClipboard(text);
        }
        res.json({ success: true, message: 'Text received successfully' });
      } else {
        res.status(400).json({ error: 'No text or file payload found' });
      }
      spinner.start(chalk.dim('Listening for incoming transfers...'));
    } catch (err) {
      console.error(chalk.red('Error handling incoming payload:'), err);
      res.status(500).json({ error: err.message });
      spinner.start(chalk.dim('Listening for incoming transfers...'));
    }
  });

  const server = http.createServer(app);
  server.listen(port, () => {
    // Local server listening
  });

  // Connect to WebSocket Relay Server if available
  let wsUrl = relayServer.replace(/^http/, 'ws') + `/api/ws?session=${sessionId}`;
  let ws;
  
  function connectWebSocket() {
    try {
      ws = new WebSocket(wsUrl);
      
      ws.on('open', () => {
        // Register session on cloud relay
        ws.send(JSON.stringify({ type: 'register', sessionId }));
      });

      ws.on('message', async (data) => {
        try {
          const payload = JSON.parse(data.toString());
          spinner.stop();

          if (payload.type === 'text') {
            console.log(chalk.bold.green('\n📩 Received Text Payload:'));
            console.log(renderBox(payload.content, { padding: 1, borderColor: 'green' }));
            if (autoClipboard) {
              await copyToClipboard(payload.content);
            }
          } else if (payload.type === 'file') {
            const fileBuffer = Buffer.from(payload.data, 'base64');
            saveReceivedFile(payload.fileName || 'shared_file', fileBuffer, downloadDir);
          }
          spinner.start(chalk.dim('Listening for incoming transfers...'));
        } catch (e) {
          console.error(chalk.red('Failed to parse incoming WS message'), e);
        }
      });

      ws.on('error', () => {
        // Fall back gracefully to local HTTP polling if WS fails
      });

      ws.on('close', () => {
        setTimeout(connectWebSocket, 5000);
      });
    } catch (e) {
      // WS initialization error ignored, Express listener handles local
    }
  }

  // HTTP Polling Fallback
  async function pollSession(targetUrl) {
    try {
      const fetch = require('node-fetch');
      const res = await fetch(`${targetUrl}/api/session/${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.payloads && data.payloads.length > 0) {
          spinner.stop();
          for (const payload of data.payloads) {
            if (payload.type === 'text') {
              console.log(chalk.bold.green('\n📩 Received Text Payload:'));
              console.log(renderBox(payload.content, { padding: 1, borderColor: 'green' }));
              if (autoClipboard) {
                await copyToClipboard(payload.content);
              }
            } else if (payload.type === 'file') {
              const fileBuffer = Buffer.from(payload.data, 'base64');
              saveReceivedFile(payload.fileName || 'shared_file', fileBuffer, downloadDir);
            }
          }
          spinner.start(chalk.dim('Listening for incoming transfers...'));
        }
      }
    } catch (e) {
      // Ignore polling connection errors
    }
  }

  const pollInterval = setInterval(() => {
    pollSession(relayServer);
    if (relayServer !== 'http://localhost:3000') {
      pollSession('http://localhost:3000');
    }
  }, 1200);

  // Handle graceful exit
  process.on('SIGINT', () => {
    clearInterval(pollInterval);
    spinner.stop();
    console.log(chalk.yellow('\nStopping QRB listener session. Goodbye! 👋'));
    if (ws) ws.close();
    server.close();
    process.exit(0);
  });
}

module.exports = { startReceiveSession };
