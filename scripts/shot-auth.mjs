/**
 * Screenshots an authenticated dashboard at mobile width: once as-is, then
 * again with the nav drawer opened.
 *
 * Run: node scripts/shot-auth.mjs <path> <email> <password> <outPrefix> [width]
 */
import { writeFileSync } from 'node:fs';

const [path, email, password, outPrefix, widthArg] = process.argv.slice(2);
const width = Number(widthArg ?? 390);

const API = 'http://localhost:8787';
const ORIGIN = 'http://localhost:5173';

const login = await fetch(`${API}/api/admin/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});
if (!login.ok) throw new Error(`login failed: ${login.status} ${await login.text()}`);
const { token } = await login.json();

const targets = await fetch('http://127.0.0.1:9222/json/list').then(r => r.json());
const page = targets.find(t => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);

let id = 0;
const pending = new Map();
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const msgId = ++id;
    pending.set(msgId, { resolve, reject });
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });

ws.addEventListener('message', ev => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
  }
});

await new Promise(r => ws.addEventListener('open', r));
await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', {
  width,
  height: 860,
  deviceScaleFactor: 2,
  mobile: true,
});

// seed the token before the app boots
await send('Page.addScriptToEvaluateOnNewDocument', {
  source: `try { localStorage.setItem('admin_token', ${JSON.stringify(token)}); } catch (e) {}`,
});

await send('Page.navigate', { url: `${ORIGIN}${path}` });
await new Promise(r => setTimeout(r, 7000));

const shot = async file => {
  const { data } = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(file, Buffer.from(data, 'base64'));
  console.log('  ->', file);
};

await shot(`${outPrefix}-closed.png`);

// open the drawer
const opened = await send('Runtime.evaluate', {
  expression: `(() => {
    const b = document.querySelector('button[aria-controls$="sidebar"], button[aria-controls="portal-drawer"]');
    if (!b) return 'NO TRIGGER';
    b.click();
    return 'clicked: ' + (b.getAttribute('aria-label') || '');
  })()`,
  returnByValue: true,
});
console.log('  drawer:', opened.result.value);
await new Promise(r => setTimeout(r, 1200));
await shot(`${outPrefix}-drawer.png`);

// report what the drawer actually contains
const audit = await send('Runtime.evaluate', {
  expression: `(() => {
    const d = document.querySelector('#admin-sidebar, #portal-drawer, [role="dialog"]');
    if (!d) return 'NO DRAWER';
    const r = d.getBoundingClientRect();
    return JSON.stringify({
      onscreen: r.left >= -1 && r.right <= ' + width + ' + 2,
      rect: { x: Math.round(r.x), w: Math.round(r.width) },
      links: d.querySelectorAll('a,button').length,
      text: (d.innerText || '').slice(0, 160).replace(/\\s+/g, ' '),
    });
  })()`,
  returnByValue: true,
});
console.log('  audit:', audit.result.value);

ws.close();