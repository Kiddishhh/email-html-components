const {chromium}=require('/Users/ww/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
for(const width of [600,375]){
const page=await browser.newPage({viewport:{width,height:1000},deviceScaleFactor:1});
await page.goto('file://'+__dirname+'/effect-preview.html');
await page.evaluate(()=>document.fonts.ready);
const result=await page.evaluate(async()=>{
const cta=document.querySelector('a[href*="/pages/"]');const rect=cta.getBoundingClientRect();
const image=new Image();image.src='https://app.omnisend.com/images/6abc6b780f4a0b5559b7979e';await image.decode();
return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,height:document.body.getBoundingClientRect().height,cta:{x:rect.x,y:rect.y,width:rect.width,height:rect.height},asset:[image.naturalWidth,image.naturalHeight],links:[...document.querySelectorAll('a')].map(a=>a.href)};
});
if(result.scrollWidth!==width)throw Error('overflow');
if(Math.abs(result.height-919*width/600)>1)throw Error('height mismatch');
if(Math.abs(result.cta.width-242*width/600)>1)throw Error('CTA width mismatch');
console.log(JSON.stringify(result));
await page.locator('body > table').screenshot({path:__dirname+'/render-'+width+'.png'});
await page.close();
}await browser.close();
})();
