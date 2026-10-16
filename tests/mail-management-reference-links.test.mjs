import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync,readdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
const skill=resolve(import.meta.dirname,'../skills/build-omnisend-campaign-draft');
test('mail management skill and supporting Markdown resolve their local links',()=>{
 const files=[resolve(skill,'SKILL.md'),...readdirSync(resolve(skill,'references')).filter(f=>f.endsWith('.md')).map(f=>resolve(skill,'references',f))];
 for(const file of files)for(const match of readFileSync(file,'utf8').matchAll(/\[[^\]]*\]\(([^)]+)\)/gu)){
  const target=match[1].split('#')[0];if(!target||/^[a-z][\w+.-]*:/iu.test(target))continue;
  assert.ok(existsSync(resolve(dirname(file),target)),`${file}: ${target}`);
 }
});
