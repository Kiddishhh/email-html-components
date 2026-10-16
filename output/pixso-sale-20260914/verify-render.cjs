const { chromium } = require('/Users/ww/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const root = __dirname;
  const browser = await chromium.launch({ headless: true, executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
  const report = [];
  for (const width of [600, 375]) {
    const page = await browser.newPage({ viewport: { width, height: 700 }, deviceScaleFactor: 2 });
    await page.goto(`file://${path.join(root, 'preview-online.html')}`);
    await page.locator('body > table').screenshot({ path: path.join(root, `render-online-${width}.png`) });
    report.push(await page.evaluate(() => ({
      viewport: innerWidth,
      width: document.documentElement.scrollWidth,
      height: document.body.getBoundingClientRect().height,
      images: Array.from(document.images, image => ({ alt: image.alt, loaded: image.complete && image.naturalWidth > 0, width: image.width, height: image.height })),
      links: Array.from(document.links, link => link.href)
    })));
    await page.close();
  }
  fs.writeFileSync(path.join(root, 'verification.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
  await browser.close();
})();
