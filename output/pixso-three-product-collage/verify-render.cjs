const { chromium } = require('/Users/ww/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const path = require('node:path');
(async () => {
 const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 const results=[];
 for (const width of [600,375]) {
  const page=await browser.newPage({viewport:{width,height:1000},deviceScaleFactor:1});
  await page.goto('file://'+path.join(__dirname,'effect-preview.html'),{waitUntil:'networkidle'});
  await page.evaluate(()=>document.fonts.ready);
  results.push(await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,fonts:[document.fonts.check('400 30px Lora'),document.fonts.check('500 16px Montserrat')],component:document.querySelector('body > table').getBoundingClientRect().toJSON(),title:document.querySelector('h2').getBoundingClientRect().toJSON(),cta:document.links[3].getBoundingClientRect().toJSON(),images:[...document.images].map(i=>({src:i.src,width:i.naturalWidth,height:i.naturalHeight,box:i.getBoundingClientRect().toJSON(),loaded:i.complete&&i.naturalWidth>0})),links:[...document.links].map(a=>a.href)})));
  await page.locator('body > table').screenshot({path:path.join(__dirname,'render-'+width+'.png')});
  await page.close();
 }
 console.log(JSON.stringify(results,null,2));
 const [desktop,mobile]=results;
 const scale=375/600;
 for(const key of ['component','title','cta']){
  for(const dimension of ['width','height']){
   const expected=desktop[key][dimension]*scale;
   if(Math.abs(mobile[key][dimension]-expected)>0.1) throw new Error(key+' '+dimension+' does not scale proportionally');
  }
 }
 for(let i=0;i<3;i++){
  for(const dimension of ['width','height','x','y']){
   if(Math.abs(mobile.images[i].box[dimension]-desktop.images[i].box[dimension]*scale)>0.1) throw new Error('Image '+i+' '+dimension+' does not scale proportionally');
  }
 }
 if(mobile.scrollWidth!==375 || desktop.scrollWidth!==600) throw new Error('Horizontal overflow');
 console.log('Verified 375px geometry at exactly 62.5% of 600px (rounding tolerance 0.1px).');
 await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1});
