/**
 * Finds elements wider than the viewport using Chrome DevTools Protocol.
 * Run: node scripts/find-overflow.mjs [url] [width]
 */
const url = process.argv[2] ?? 'http://localhost:5173/';
const width = Number(process.argv[3] ?? 390);

const targets = await fetch('http://127.0.0.1:9222/json/list').then(r => r.json());
const page = targets.find(t => t.type === 'page');
if (!page) throw new Error('no page target');

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
  deviceScaleFactor: 1,
  mobile: true,
});
await send('Page.navigate', { url });
await new Promise(r => setTimeout(r, 6000));

const expression = `(() => {
  const vw = document.documentElement.clientWidth;
  const offenders = [];
  for (const el of document.querySelectorAll('*')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    if (r.right > vw + 1 || r.left < -1) {
      offenders.push({
        tag: el.tagName.toLowerCase(),
        cls: (el.getAttribute('class') || '').slice(0, 110),
        left: Math.round(r.left),
        right: Math.round(r.right),
        width: Math.round(r.width),
      });
    }
  }
  return JSON.stringify({
    vw,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    count: offenders.length,
    offenders: offenders.slice(0, 25),
  }, null, 2);
})()`;

const { result } = await send('Runtime.evaluate', {
  expression,
  returnByValue: true,
});

console.log(result.value);
ws.close();