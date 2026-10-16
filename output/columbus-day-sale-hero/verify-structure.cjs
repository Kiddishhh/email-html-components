const fs = require('node:fs');
const assert = require('node:assert/strict');
for (const file of ['email.html', 'effect-preview.html']) {
  const html = fs.readFileSync(`${__dirname}/${file}`, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
  const stack = [];
  for (const match of html.matchAll(/<(\/?)(table|tr|td)\b[^>]*>/gi)) {
    const tag = match[2].toLowerCase();
    if (match[1]) assert.equal(stack.pop(), tag, `${file}: unexpected closing ${tag}`);
    else stack.push(tag);
  }
  assert.equal(stack.length, 0, `${file}: unclosed table tags`);
  console.log(`${file}: table nesting PASS`);
}
