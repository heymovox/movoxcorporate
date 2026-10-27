/**
 * Screenshots a page (optionally scrolled to a selector) at a given width.
 * Drives headless Chrome over CDP; needs only Node + Chrome.
 *
 * Run: node scripts/shot.mjs <url> <width> <out.png> [selector] [height]
 */
import { writeFileSync } from 'node:fs';

const [url, widthArg, out, selector, heightArg] = process.argv.slice(2);
const width = Number(widthArg ?? 390);
const height = Number(heightArg ?? 900);

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
  height,
  deviceScaleFactor: 2,
  mobile: width < 768,
});
await send('Page.navigate', { url });
await new Promise(r => setTimeout(r, 6000));

if (selector) {
  await send('Runtime.evaluate', {
    expression: `(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return 'NOT FOUND';
      const y = el.getBoundingClientRect().top + window.scrollY - 24;
      window.scrollTo({ top: y, behavior: 'instant' });
      return 'ok';
    })()`,
    returnByValue: true,
  }).then(r => console.log('scroll:', r.result.value));
  await new Promise(r => setTimeout(r, 1200));
}

const { data } = await send('Page.captureScreenshot', { format: 'png' });
writeFileSync(out, Buffer.from(data, 'base64'));
console.log('screenshot ->', out);
ws.close();