/**
 * Minimal WhatsApp bot using Baileys.
 * Instructions in README.md (Arabic).
 * Notes:
 * - After first run you'll get QR in Replit console. Scan it with WhatsApp -> Linked Devices -> Link a device.
 * - Replit may stop; use uptime services to keep running 24/7.
 */
const { default: makeWASocket, fetchLatestBaileysVersion, useSingleFileAuthState, DisconnectReason } = require('@adiwajshing/baileys');
const { Boom } = require('@hapi/boom');
const path = require('path');

const authFile = path.join('.', 'auth_info.json');

const { state, saveState } = useSingleFileAuthState(authFile);

async function start() {
  try {
    const { version } = await fetchLatestBaileysVersion();
    const sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: true
    });

    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect } = update;
      console.log('connection.update', connection);
      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        console.log('closed with status', statusCode);
        if (statusCode !== DisconnectReason.loggedOut) {
          console.log('Reconnecting...');
          start();
        } else {
          console.log('Logged out — delete auth_info.json and scan QR again.');
        }
      } else if (connection === 'open') {
        console.log('Connected ✅');
      }
    });

    sock.ev.on('messages.upsert', async (m) => {
      try {
        // console.log(JSON.stringify(m, null, 2));
        const msg = m.messages && m.messages[0];
        if (!msg || msg.key?.fromMe) return;
        const jid = msg.key.remoteJid;
        const messageText = msg.message?.conversation || msg.message?.extendedTextMessage?.text;
        console.log('Message from', jid, ':', messageText);
        if (messageText && messageText.toLowerCase().trim() === 'ping') {
          await sock.sendMessage(jid, { text: 'pong' }, { quoted: msg });
        }
      } catch (err) {
        console.error('messages.upsert error', err);
      }
    });

    sock.ev.on('creds.update', saveState);

    console.log('Bot started — scan the QR code shown in the Replit console.');
  } catch (err) {
    console.error('Start error', err);
  }
}

start();
