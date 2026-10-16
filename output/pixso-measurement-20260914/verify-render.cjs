const { chromium } = require('/Users/ww/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const path = require('path');

(async () => {
  const root = __dirname;
  const browser = await chromium.launch({ headless: true, executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
  const report = [];
  for (const width of [600, 375]) {
    const page = await browser.newPage({ viewport: { width, height: 700 }, deviceScaleFactor: 2 });
    await page.goto(`file://${path.join(root, 'preview-online.html')}`);
    await page.locator('body > table').first().screenshot({ path: path.join(root, `render-online-${width}.png`) });
    report.push(await page.evaluate(() => ({ viewport: innerWidth, width: document.documentElement.scrollWidth, height: document.body.getBoundingClientRect().height, background: document.querySelector('[background]').getAttribute('background'), link: document.links[0].href })));
    await page.close();
  }
  console.log(JSON.stringify(report));
  await browser.close();
})();
