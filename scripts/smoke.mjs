// Load the unpacked extension into a dedicated-profile headless Chrome via CDP pipe
// (Extensions.loadUnpacked; Chrome 137+ ignores --load-extension on branded builds).
import { spawn } from 'node:child_process';
import fs from 'node:fs';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PROFILE = `${process.env.HOME}/.cache/chrome-aigif-ext-test`;
const EXT = process.argv[2];
const OUT = process.argv[3];
const envTxt = fs.readFileSync('/Users/hesihan/shnext/2611/aigifmaker/.claude/.env.local', 'utf8');
const KEY = (envTxt.match(/^AIGIFMAKER_API_KEY=["']?([^"'\n]+)/m) || [])[1];
if (!KEY) throw new Error('no AIGIFMAKER_API_KEY');
fs.rmSync(PROFILE, { recursive: true, force: true });
const proc = spawn(CHROME, [`--user-data-dir=${PROFILE}`, '--headless=new', '--remote-debugging-pipe', '--enable-unsafe-extension-debugging',
  '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--window-size=1280,800', '--lang=en', 'about:blank'],
  { stdio: ['ignore', 'ignore', 'pipe', 'pipe', 'pipe'] });
const w = proc.stdio[3], r = proc.stdio[4];
let buf = '', nextId = 1; const pending = new Map();
r.on('data', (d) => { buf += d.toString(); let i; while ((i = buf.indexOf('\0')) >= 0) { const m = JSON.parse(buf.slice(0, i)); buf = buf.slice(i + 1); if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result); } } });
const send = (method, params = {}, sessionId) => new Promise((res, rej) => { const id = nextId++; pending.set(id, { res, rej }); w.write(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }) + '\0'); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const ok = (name, pass, detail = '') => { results.push({ name, pass, detail }); console.log(`${pass ? 'PASS' : 'FAIL'} ${name} ${detail}`); };
try {
  const { id: extId } = await send('Extensions.loadUnpacked', { path: EXT });
  ok('loadUnpacked', !!extId, extId);
  await sleep(1500);
  const { targetInfos } = await send('Target.getTargets');
  const sw = targetInfos.find((t) => t.type === 'service_worker' && t.url.includes(extId));
  ok('service worker running', !!sw, sw && sw.url);
  const { sessionId: swS } = await send('Target.attachToTarget', { targetId: sw.targetId, flatten: true });
  const ev = async (s, expr) => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }, s); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result.value; };
  const menu = await ev(swS, `new Promise(r=>chrome.contextMenus.update('gen',{},()=>r(chrome.runtime.lastError? 'missing':'ok')))`);
  ok('context menu registered', menu === 'ok', menu);
  const openPage = async (path, width, height) => {
    const { targetId } = await send('Target.createTarget', { url: 'about:blank', background: true });
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
    await send('Page.enable', {}, sessionId);
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 2, mobile: false }, sessionId);
    await send('Page.navigate', { url: `chrome-extension://${extId}/${path}` }, sessionId);
    await sleep(1200);
    return { targetId, sessionId };
  };
  const shot = async (s, file) => { const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true }, s); fs.writeFileSync(file, Buffer.from(data, 'base64')); };
  const pop = await openPage('popup.html', 360, 600);
  await ev(pop.sessionId, `chrome.storage.local.set({apiKey:'sk-invalidsmoketest'})`);
  const wrong = await ev(pop.sessionId, `chrome.runtime.sendMessage({type:'generate',prompt:'smoke test'})`);
  ok('wrong key -> auth error', wrong && wrong.ok === false && wrong.kind === 'auth', JSON.stringify(wrong));
  for (const t of (await send('Target.getTargets')).targetInfos) if (t.type === 'page' && t.url.endsWith('options.html')) await send('Target.closeTarget', { targetId: t.targetId });
  await ev(pop.sessionId, `chrome.storage.local.set({apiKey:${JSON.stringify(KEY)}, jobs: []})`);
  const opt = await openPage('options.html', 900, 900);
  await sleep(2500);
  const keymsg = await ev(opt.sessionId, `document.getElementById('keymsg').textContent + ' | ' + document.getElementById('keymsg').className`);
  ok('real key -> credits on options page', /msg ok/.test(keymsg) && /\d/.test(keymsg), keymsg);
  await ev(opt.sessionId, `document.getElementById('keymsg').textContent=''`);
  await shot(opt.sessionId, `${OUT}/options.png`);
  await send('Page.reload', {}, pop.sessionId); await sleep(2500);
  const credTxt = await ev(pop.sessionId, `document.getElementById('credits').textContent`);
  ok('popup shows credits', /\d/.test(credTxt), credTxt);
  await shot(pop.sessionId, `${OUT}/popup.png`);
  await ev(pop.sessionId, `chrome.storage.local.remove('apiKey')`);
} catch (e) {
  ok('exception', false, e.message);
} finally {
  try { await send('Browser.close'); } catch {}
  await sleep(500);
  if (proc.exitCode === null) proc.kill();
  fs.writeFileSync(`${OUT}/smoke-results.json`, JSON.stringify(results, null, 2));
}
