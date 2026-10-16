const { chromium } = require('/Users/ww/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const path = require('path');

(async () => {
  const root = __dirname;
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  });
  const report = [];
  for (const width of [600, 375]) {
    const page = await browser.newPage({ viewport: { width, height: 1600 }, deviceScaleFactor: 1 });
    await page.goto(`file://${path.join(root, 'effect-preview.html')}`, { waitUntil: 'networkidle' });
    const component = page.locator('body > table');
    await component.screenshot({ path: path.join(root, `render-${width}.png`) });
    report.push(await page.evaluate(() => ({
      viewport: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      names: Array.from(document.querySelectorAll('[data-freshine-slot$=".name"]'), (node) => node.textContent.trim()),
      title: document.querySelector('[data-freshine-slot="promotion.title"]').textContent.trim(),
      subtitleStyle: document.querySelector('[data-freshine-slot="promotion.subtitle"]').getAttribute('style')
    })));
    await page.close();
  }
  console.log(JSON.stringify(report));
  await browser.close();
})();
