const { chromium } = require('/Users/ww/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const path = require('path');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 for(const width of [600,375]){
 const page=await browser.newPage({viewport:{width,height:1100},deviceScaleFactor:1});
 await page.goto('file://'+path.join(__dirname,'effect-preview.html'),{waitUntil:'networkidle'});
 await page.evaluate(()=>document.fonts.ready);
 await page.locator('body > table').screenshot({path:path.join(__dirname,'render-'+width+'.png')});
 console.log(JSON.stringify(await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,height:document.querySelector('body > table').getBoundingClientRect().height,names:[...document.querySelectorAll('[data-freshine-slot$=".name"]')].map(x=>({text:x.textContent,height:x.getBoundingClientRect().height})),fonts:[document.fonts.check('500 30px Lora'),document.fonts.check('500 14px Montserrat')]}))));
 await page.close();
 }await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});

