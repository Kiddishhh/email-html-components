const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium}=require('/Users/ww/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const html=fs.readFileSync(__dirname+'/email.html','utf8');
const old=fs.readFileSync('/Users/ww/.codex/attachments/5a33d18d-e92c-4fe2-9189-6cb2c900e66c/已粘贴的文本.txt','utf8');
const urls=s=>[...s.matchAll(/href="([^"]+)"/g)].map(m=>m[1]).sort();
assert.deepEqual(urls(html),urls(old));
const slots=s=>Object.fromEntries([...s.matchAll(/data-freshine-slot="([^"]+)"[^>]*>([^<]+)/g)].map(m=>[m[1],m[2]]));
for(const [k,v]of Object.entries(slots(old)))if(!['saleCollection.title','saleCollection.cta.text'].includes(k))assert.equal(slots(html)[k],v);
const stack=[];for(const m of html.replace(/<!--[\s\S]*?-->/g,'').matchAll(/<(\/?)(table|tr|td)\b[^>]*>/g)){if(m[1])assert.equal(stack.pop(),m[2]);else stack.push(m[2]);}assert.equal(stack.length,0);
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
for(const width of [600,375]){
const page=await browser.newPage({viewport:{width,height:1200}});
await page.goto('file://'+__dirname+'/effect-preview.html');await page.evaluate(()=>document.fonts.ready);
const data=await page.evaluate(async()=>{const cells=[...document.querySelectorAll('td[background]')];await Promise.all(cells.map(async c=>{const i=new Image();i.src=c.getAttribute('background');await i.decode();}));return{scrollWidth:document.documentElement.scrollWidth,height:document.body.getBoundingClientRect().height,cards:cells.map(c=>({w:c.getBoundingClientRect().width,h:c.getBoundingClientRect().height}))};});
assert.equal(data.scrollWidth,width);for(const c of data.cards){assert.ok(Math.abs(c.w-253.5*width/600)<1);assert.ok(Math.abs(c.h-317*width/600)<1);}
console.log(width,JSON.stringify(data));await page.screenshot({path:__dirname+'/render-'+width+'.png',fullPage:true});await page.close();
}await browser.close();console.log('PASS: links, preserved copy, structure, images, 600/375 layout');})();
