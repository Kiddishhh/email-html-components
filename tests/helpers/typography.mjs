import assert from 'node:assert/strict';
export function assertTextRole(markup, slot, role, { rendered = false } = {}) {
  const escaped = slot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const tag = markup.match(new RegExp('<[^>]*data-freshine-slot="' + escaped + '"[^>]*>'));
  assert.ok(tag, 'missing slot ' + slot);
  const styles = Object.fromEntries((tag[0].match(/style="([^"]*)"/)?.[1] ?? '').split(';').filter(x => x.includes(':')).map(x => { const i=x.indexOf(':'); return [x.slice(0,i), x.slice(i+1)]; }));
  const [font,size,line,weight,align] = role === 'heading' ? ['Lora',30,38,'400','center'] : role === 'subtitle' ? ['Montserrat',18,27,'500','center'] : ['Montserrat',16,20,'500','left'];
  assert.ok(styles['font-family'].startsWith(font),slot);
  assert.equal(styles['font-weight'],weight,slot);
  assert.equal(styles['text-align'],align,slot);
  assert.equal(parseFloat(styles['letter-spacing']),0,slot);
  for(const [prop,value] of [['font-size',size],['line-height',line]]) {
    const expected='min('+value+'px,'+Number((value/6).toFixed(6))+'vw)';
    assert.equal(styles[prop],expected,slot+' '+prop);
  }
  if(role === 'subtitle' && rendered) assert.equal(styles.color,'#000000',slot);
}
