const { chromium } = require('/Users/ww/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const path = require('path');

(async () => {
  const root = __dirname;
  const browser = await chromium.launch({ headless: true, executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
  const report = [];
  for (const width of [600, 375]) {
    const page = await browser.newPage({ viewport: { width, height: 1200 }, deviceScaleFactor: 2 });
    await page.goto(`file://${path.join(root, 'email-omnisend.html')}`);
    const component = page.locator('body > table');
    await component.screenshot({ path: path.join(root, `render-${width}.png`) });
    report.push(await page.evaluate(() => ({
      viewport: innerWidth,
      width: document.documentElement.scrollWidth,
      links: Array.from(document.links, link => link.href),
      captionStyles: Array.from(document.querySelectorAll('[data-freshine-slot$=".cta.text"]')).slice(0, 4).map(node => ({ text: node.textContent, style: node.getAttribute('style') })),
      collectionCta: document.querySelector('[data-freshine-slot="saleCollection.cta.text"]').parentElement.getAttribute('style')
    })));
    await page.close();
  }
  console.log(JSON.stringify(report));
  await browser.close();
})();
