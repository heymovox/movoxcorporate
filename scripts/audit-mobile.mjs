/**
 * Audits admin/portal pages at a mobile width: reports any element wider
 * than the viewport, plus per-page table/card counts.
 *
 * Run: node scripts/audit-mobile.mjs [width]
 */
const widthArg = process.argv[2] ?? 390;
const width = Number(widthArg);

const ORIGIN = 'http://localhost:5173';
const API = 'http://localhost:8787';

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
await send('Emulation.setDeviceMetricsOverride', {
  width,
  height: 844,
  deviceScaleFactor: 1,
  mobile: true,
});
await send('Page.addScriptToEvaluateOnNewDocument', {
  source: `try { localStorage.setItem('admin_token', ${JSON.stringify(token)}); } catch (e) {}`,
});

const paths = [
  '/admin', '/admin/enquiries', '/admin/projects', '/admin/agreements',
  '/admin/invoices', '/admin/works', '/admin/blogs', '/admin/policies',
  '/admin/team', '/admin/users', '/admin/settings',
];

const evaluate = expr =>
  send('Runtime.evaluate', { expression: expr, returnByValue: true }).then(r => r.result.value);

const probe = `(() => {
  const vw = document.documentElement.clientWidth;
  const docScroll = document.documentElement.scrollWidth;
  const wide = [];
  for (const el of document.querySelectorAll('main *')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0) continue;
    if (r.right > vw + 1) {
      wide.push({
        tag: el.tagName.toLowerCase(),
        cls: (el.getAttribute('class') || '').slice(0, 80),
        over: Math.round(r.right - vw),
      });
    }
  }
  const tables = [...document.querySelectorAll('main table')];
  return JSON.stringify({
    vw,
    docScroll,
    overflow: docScroll > vw,
    tables: tables.length,
    tableWidths: tables.map(t => Math.round(t.getBoundingClientRect().width)),
    tableScrollW: tables.map(t => t.scrollWidth),
    wideCount: wide.length,
    wide: wide.slice(0, 6),
  });
})()`;

for (const path of paths) {
  await send('Page.navigate', { url: ORIGIN + path });
  await new Promise(r => setTimeout(r, 4500));
  const raw = await evaluate(probe);
  const d = JSON.parse(raw);
  const flag = d.overflow ? 'OVERFLOW' : 'ok      ';
  console.log(
    `${flag} ${path.padEnd(22)} vw=${d.vw} scroll=${d.docScroll} tables=${d.tables} ` +
    `tableW=[${d.tableWidths}] scrollW=[${d.tableScrollW}] wideEls=${d.wideCount}`,
  );
  for (const w of d.wide) {
    console.log(`          +${w.over}px  <${w.tag}> ${w.cls}`);
  }
}

ws.close();