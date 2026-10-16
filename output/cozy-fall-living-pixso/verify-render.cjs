const {chromium}=require('/Users/ww/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 const report=[];
 for(const width of [600,375]){
  const page=await browser.newPage({viewport:{width,height:700},deviceScaleFactor:1});
  await page.goto('file://'+path.join(__dirname,'effect-preview.html'),{waitUntil:'networkidle'});
  await page.evaluate(()=>document.fonts.ready);
  report.push(await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,root:document.querySelector('body > table').getBoundingClientRect().toJSON(),image:{naturalWidth:document.images[0].naturalWidth,naturalHeight:document.images[0].naturalHeight,...document.images[0].getBoundingClientRect().toJSON()},text:[...document.querySelectorAll('td')].filter(x=>x.style.fontFamily).map(x=>({text:x.innerText,width:x.clientWidth,scrollWidth:x.scrollWidth,font:getComputedStyle(x).fontSize,lineHeight:getComputedStyle(x).lineHeight})),links:[...document.links].map(x=>x.href)})));
  await page.locator('body > table').screenshot({path:path.join(__dirname,'render-'+width+'.png')});
  await page.close();
 }
 console.log(JSON.stringify(report,null,2));
 const [d,m]=report;
 for(const key of ['root','image']) for(const dimension of ['width','height','x','y']) if(Math.abs(m[key][dimension]-d[key][dimension]*0.625)>0.15)throw Error('Proportion mismatch '+key+' '+dimension);
 if(d.scrollWidth!==600||m.scrollWidth!==375)throw Error('Page overflow');
 for(const r of report)if(r.text.some(t=>t.scrollWidth>t.width+1))throw Error('Text exceeds cell');
 console.log('600px/375px proportion and overflow verified');
 await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1});

