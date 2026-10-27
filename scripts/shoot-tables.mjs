/**
 * Exercises each admin list with seeded rows so the tables actually render,
 * then screenshots them at desktop and mobile width.
 */
import { writeFileSync } from 'node:fs';

const ORIGIN = 'http://localhost:5173';
const API = 'http://localhost:8787';
const OUT = 'C:/Users/srina/AppData/Local/Temp/opencode';

const login = await fetch(`${API}/api/admin/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@heymovox.com', password: '1@EditorWorld' }),
});
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

const evaluate = expr =>
  send('Runtime.evaluate', { expression: expr, returnByValue: true }).then(r => r.result.value);

const audit = `(() => {
  const vw = document.documentElement.clientWidth;
  const wide = [...document.querySelectorAll('main *')].filter(el => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.right > vw + 1;
  });
  const t = document.querySelector('main table');
  const ul = document.querySelector('main ul li');
  return JSON.stringify({
    vw,
    scroll: document.documentElement.scrollWidth,
    overflow: document.documentElement.scrollWidth > vw,
    tableVisible: t ? t.getBoundingClientRect().width > 0 : false,
    tableW: t ? Math.round(t.getBoundingClientRect().width) : null,
    cardsVisible: ul ? ul.getBoundingClientRect().width > 0 : false,
    wideCount: wide.length,
  });
})()`;

const pages = process.argv.slice(2);

for (const width of [390, 1280]) {
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height: 900,
    deviceScaleFactor: 2,
    mobile: width < 768,
  });

  for (const path of pages) {
    await send('Page.navigate', { url: ORIGIN + path });
    await new Promise(r => setTimeout(r, 4500));
    const d = JSON.parse(await evaluate(audit));
    console.log(
      `@${String(width).padEnd(4)} ${path.padEnd(20)} overflow=${d.overflow ? 'YES(' + d.scroll + '>' + d.vw + ')' : 'no '} ` +
      `table=${d.tableVisible ? d.tableW + 'px' : 'hidden'} cards=${d.cardsVisible ? 'shown' : 'hidden'} wideEls=${d.wideCount}`,
    );

    if (width === 390) {
      const { data } = await send('Page.captureScreenshot', { format: 'png' });
      const name = 'cards' + path.replace(/\//g, '-');
      writeFileSync(`${OUT}/${name}.png`, Buffer.from(data, 'base64'));
    }
  }
}

ws.close();