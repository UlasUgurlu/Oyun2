/** Exercise the shipped web renderer with real inputs; QA bridge is read-only. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const evidence = path.resolve('.build/web-evidence');
fs.mkdirSync(evidence, { recursive: true });
const errors = [];
const checks = [];
let browser;
let page;
const snapshot = () => page.evaluate(() => window.__ORBIT_QA__.snapshot());
const control = name => page.getByRole('button', { name, exact: true });
const pass = message => { checks.push(message); console.log('PASS: ' + message); };

async function shot(name) {
  await page.screenshot({ path: path.join(evidence, name), animations: 'disabled' });
}

async function inside(name, width, height) {
  const box = await control(name).boundingBox();
  assert(box && box.x >= -1 && box.y >= -1 && box.x + box.width <= width + 1 && box.y + box.height <= height + 1,
    `Control outside ${width}x${height}: ${name} ${JSON.stringify(box)}`);
}

(async () => {
  browser = await chromium.launch({ headless: true, args: [
    '--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
  ] });
  page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('http://127.0.0.1:8081/?qa=1', { waitUntil: 'networkidle', timeout: 90000 });
  await control('AKIŞA BAŞLA').waitFor({ timeout: 60000 });
  await page.waitForFunction(() => window.__ORBIT_QA__ &&
    document.querySelector('[aria-label="AKIŞA BAŞLA"]').getAttribute('aria-disabled') !== 'true',
    null, { timeout: 60000 });
  await page.waitForTimeout(700);
  assert.equal(await page.locator('canvas').count(), 1, 'The normal renderer must use WebGL');
  assert.equal(await control('3B görünümü yeniden dene').count(), 0, 'Renderer fell back to SVG');
  for (const [width, height] of [[390, 844], [360, 640], [320, 568]]) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(350);
    for (const label of ['AKIŞA BAŞLA', 'Anomali', 'Denge', 'Koruma', 'Kaos', 'Nasıl oynanır?']) {
      await inside(label, width, height);
    }
    await shot(`menu-${width}x${height}.png`);
  }
  pass('3D menu and all controls fit three phone viewports');
  await page.setViewportSize({ width: 390, height: 844 });
  await control('Kaos').click();
  assert.equal((await snapshot()).core, 'volatile');
  await shot('menu-chaos.png');
  await control('Koruma').click();
  await control('Ayarlar').click();
  for (const [language, heading] of [['English', 'Flow settings'], ['Deutsch', 'Flow-Einstellungen'], ['Español', 'Ajustes del flujo'], ['Türkçe', 'Akış ayarları']]) {
    await control(language).click();
    await page.getByText(heading, { exact: true }).waitFor();
  }
  await control('Kapat').click();
  pass('Core selection and four translated settings screens');
  await control('AKIŞA BAŞLA').click();
  await page.waitForFunction(() => window.__ORBIT_QA__.snapshot().phase === 'playing');
  await page.keyboard.press('KeyX');
  assert.equal((await snapshot()).phaseUses, 1);
  const switchButton = control('Yörünge değiştir').last();
  const switchBox = await switchButton.boundingBox();
  assert(switchBox, 'Orbit control missing');
  const samples = [];
  const seen = new Set();
  const deadline = Date.now() + 150000;
  let lastSwitch = 0;
  while (Date.now() < deadline) {
    const run = await snapshot();
    assert.equal(run.phase, 'playing', `Unexpected run end at ${run.time}s`);
    if (run.anomaly !== 'none' && !seen.has(run.anomaly)) {
      seen.add(run.anomaly);
      await shot(`anomaly-${run.anomaly}.png`);
    }
    if (samples.length === 0 || run.time - samples.at(-1).time >= 1) {
      samples.push({ time: run.time, anomaly: run.anomaly, score: run.score, phaseUses: run.phaseUses,
        entities: run.entities.length, direction: run.direction });
    }
    const next = run.entities.filter(entity => entity.angle - run.angle > -.13)
      .sort((a, b) => a.angle - b.angle || (a.kind === 'gate' ? -1 : 1))[0];
    if (next && Date.now() - lastSwitch > 110) {
      const desired = next.kind === 'gate' ? 1 - (next.shiftTo ?? next.lane) : (next.shiftTo ?? next.lane);
      if (desired !== run.lane) {
        await page.mouse.click(switchBox.x + switchBox.width / 2, switchBox.y + switchBox.height / 2);
        lastSwitch = Date.now();
      }
    }
    if (run.charge >= 100 && run.novaLeft === 0) await page.keyboard.press('KeyN');
    if (run.phaseCooldown === 0 && run.phaseUses < 4) await page.keyboard.press('KeyX');
    if (run.anomaliesCleared >= 3) break;
    await page.waitForTimeout(45);
  }
  const result = await snapshot();
  assert.equal(seen.size, 3, 'All three anomaly types should have rendered');
  assert(result.anomaliesCleared >= 3, 'Anomaly loop did not finish');
  assert(result.phaseUses >= 2, 'Phase cooldown did not recharge');
  fs.writeFileSync(path.join(evidence, 'run-samples.json'), JSON.stringify(samples, null, 2));
  pass('All three anomalies, shifting gates, reusable Phase and Nova with ordinary inputs');
  await control('Oyunu duraklat').click();
  await page.getByText('Bir nefes.', { exact: true }).waitFor();
  const paused = await snapshot();
  await page.waitForTimeout(400);
  assert.equal((await snapshot()).time, paused.time);
  assert.equal((await snapshot()).phaseCooldown, paused.phaseCooldown);
  await shot('paused.png');
  await control('DEVAM ET').click();
  await page.keyboard.press('Escape');
  await control('Ana ekrana dön').click();
  await control('AKIŞA BAŞLA').waitFor();
  pass('Pause freezes the new clocks and resume/home navigation works');
  assert.deepEqual(errors, [], 'Runtime or renderer errors were logged');
  pass('No JavaScript or shader errors');
})().catch(async error => {
  console.error(error);
  if (page) await shot('failure.png').catch(() => {});
  process.exitCode = 1;
}).finally(async () => {
  fs.writeFileSync(path.join(evidence, 'report.json'), JSON.stringify({ checks, errors }, null, 2));
  if (browser) await browser.close();
});
