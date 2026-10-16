import test from 'node:test';
import assert from 'node:assert/strict';
import { createImageProcessor } from '../skills/build-omnisend-campaign-draft/scripts/image-processing.mjs';
test('ImageMagick fallback reads dimensions and uses the same explicit center crop and 1200px output',()=>{
 const calls=[];const processor=createImageProcessor({run:(command,args)=>{
  calls.push({command,args});
  if(command==='sips')return {error:{code:'ENOENT'},status:null};
  if(args[0]==='identify')return {status:0,stdout:'1800 1200'};
  return {status:0,stdout:'ImageMagick 7'};
 }});
 assert.equal(processor.backend,'magick');assert.deepEqual(processor.dimensions('/images/source.png'),{width:1800,height:1200});
 processor.render({source:'/images/source.png',cropped:'/tmp/crop.png',output:'/images/out.jpg',crop:{width:1200,height:1200,offsetX:300,offsetY:0},width:1200,height:1200});
 assert.deepEqual(calls.at(-1),{command:'magick',args:['/images/source.png[0]','-crop','1200x1200+300+0','+repage','-resize','1200x1200!','-quality','88','/images/out.jpg']});
});
test('backend failure is reported and never retried through another engine',()=>{
 const calls=[];const processor=createImageProcessor({backend:'magick',run:(cmd,args)=>{calls.push(args);return args[0]==='-version'?{status:0,stdout:'ok'}:{status:1,stderr:'bad image'};}});
 assert.throws(()=>processor.dimensions('broken.png'),/bad image/);assert.equal(calls.length,2);
});
test('missing image tools have an actionable error instead of a null stderr TypeError',()=>{
 assert.throws(()=>createImageProcessor({run:()=>({error:{code:'ENOENT'},status:null})}),/sips.*ImageMagick/);
});
