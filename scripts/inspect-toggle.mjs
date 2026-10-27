/**
 * Inspects the mobile menu toggle: bounding box, visibility, and the computed
 * style of each hamburger line. Also captures a screenshot at the same
 * emulation so the capture matches what was measured.
 *
 * Run: node scripts/inspect-toggle.mjs [url] [width]
 */
import { writeFileSync } from 'node:fs';

const url = process.argv[2] ?? 'http://localhost:5173/';
const width = Number(process.argv[3] ?? 390);
const shot = process.argv[4];

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
  height: 844,
  deviceScaleFactor: 2,
  mobile: true,
});
await send('Page.navigate', { url });
await new Promise(r => setTimeout(r, 6000));

const expression = `(() => {
  const btn = document.querySelector('button[aria-controls="mobile-menu"]');
  if (!btn) return JSON.stringify({ found: false });

  const cs = getComputedStyle(btn);
  const box = btn.getBoundingClientRect();
  const icon = btn.querySelector('span.relative');
  const lines = icon ? [...icon.children] : [];

  const lineInfo = lines.map((el, i) => {
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      i,
      cls: el.getAttribute('class'),
      top: s.top, height: s.height, width: s.width,
      background: s.backgroundColor,
      opacity: s.opacity,
      transform: s.transform,
      rect: { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) },
    };
  });

  return JSON.stringify({
    found: true,
    viewport: { w: document.documentElement.clientWidth, h: innerHeight },
    button: {
      display: cs.display, visibility: cs.visibility, opacity: cs.opacity,
      rect: { x: +box.x.toFixed(1), y: +box.y.toFixed(1), w: +box.width.toFixed(1), h: +box.height.toFixed(1) },
      label: btn.getAttribute('aria-label'),
      expanded: btn.getAttribute('aria-expanded'),
    },
    iconBox: icon ? (() => { const r = icon.getBoundingClientRect();
      return { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) }; })() : null,
    lineCount: lines.length,
    lines: lineInfo,
  }, null, 2);
})()`;

const { result } = await send('Runtime.evaluate', { expression, returnByValue: true });
console.log(result.value);

const probe = `(() => {
  const btn = document.querySelector('button[aria-controls="mobile-menu"]');
  if (!btn) return JSON.stringify({ found: false });
  const icon = btn.querySelector('span.relative');
  const lines = icon ? [...icon.children] : [];
  const box = btn.getBoundingClientRect();
  return JSON.stringify({
    label: btn.getAttribute('aria-label'),
    expanded: btn.getAttribute('aria-expanded'),
    buttonRect: { x: Math.round(box.x), w: Math.round(box.width) },
    lines: lines.map(el => {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        top: s.top,
        background: s.backgroundColor,
        opacity: s.opacity,
        transform: s.transform === 'none' ? 'none' : s.transform,
        cy: Math.round(r.y + r.height / 2),
      };
    }),
  }, null, 2);
})()`;

const closed = await send('Runtime.evaluate', { expression: probe, returnByValue: true });
console.log('--- CLOSED ---');
console.log(closed.result.value);

if (shot) {
  const closedShot = shot.replace('.png', '-closed.png');
  const { data } = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(closedShot, Buffer.from(data, 'base64'));
  console.log('screenshot ->', closedShot);
}

await send('Runtime.evaluate', {
  expression: `document.querySelector('button[aria-controls="mobile-menu"]').click()`,
});
await new Promise(r => setTimeout(r, 900));

const open = await send('Runtime.evaluate', { expression: probe, returnByValue: true });
console.log('\n--- OPEN (after click) ---');
console.log(open.result.value);

if (shot) {
  const { data } = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(shot, Buffer.from(data, 'base64'));
  console.log('\nscreenshot ->', shot);
}
ws.close();