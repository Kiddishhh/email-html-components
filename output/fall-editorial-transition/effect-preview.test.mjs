import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const previewUrl = new URL('./effect-preview.html', import.meta.url);
const html = await readFile(previewUrl, 'utf8');

test('places one discount badge inside each product image area', () => {
  const imageStarts = [...html.matchAll(/data-role="product-image"/g)].map((match) => match.index);
  const copyStarts = [...html.matchAll(/data-role="product-copy"/g)].map((match) => match.index);
  const badgeStarts = [...html.matchAll(/data-role="discount-badge"/g)].map((match) => match.index);

  assert.equal(imageStarts.length, 2);
  assert.equal(copyStarts.length, 2);
  assert.equal(badgeStarts.length, 2);

  for (let index = 0; index < 2; index += 1) {
    const imageStart = imageStarts[index];
    const nextCopy = copyStarts.find((position) => position > imageStart);
    const nextImage = imageStarts.find((position) => position > imageStart) ?? Number.POSITIVE_INFINITY;
    const imageEnd = Math.min(nextCopy ?? Number.POSITIVE_INFINITY, nextImage);
    const badgesInImage = badgeStarts.filter((position) => position > imageStart && position < imageEnd);
    assert.equal(badgesInImage.length, 1);
  }
});

test('uses the approved warm greige information panels with no card borders', () => {
  assert.equal((html.match(/data-role="product-copy"/g) ?? []).length, 2);
  assert.equal((html.match(/data-role="product-copy"[^>]*bgcolor="#F1EBE2"/g) ?? []).length, 2);
  assert.doesNotMatch(html, /data-role="product-copy"[^>]*border-(?:top|right|bottom|left):/);
});

test('reuses the pasted discount badge style and product typography exactly', () => {
  const badges = html.match(/<table data-role="discount-badge"[\s\S]*?<\/table>/g) ?? [];
  assert.equal(badges.length, 2);
  for (const badge of badges) {
    assert.match(badge, /align="left"/);
    assert.match(badge, /border-collapse:separate;margin:0/);
    assert.doesNotMatch(badge, /width="118"/);
    assert.match(badge, /height="30"/);
    assert.match(badge, /bgcolor="#8D1B1B"/);
    assert.match(badge, /padding:0 10px/);
    assert.match(badge, /border-radius:0 0 5px 0/);
    assert.match(badge, /font-family:Montserrat,Arial,Helvetica,sans-serif/);
    assert.match(badge, /font-size:18px/);
    assert.match(badge, /font-weight:500/);
    assert.match(badge, /line-height:22px/);
    assert.match(badge, /letter-spacing:0/);
    assert.match(badge, /white-space:nowrap/);
  }

  const productNames = html.match(/<span data-role="product-name"[^>]*>/g) ?? [];
  assert.equal(productNames.length, 2);
  for (const productName of productNames) {
    assert.match(productName, /color:#101522/);
    assert.match(productName, /font-family:Montserrat,Arial,Helvetica,sans-serif/);
    assert.match(productName, /font-size:16px/);
    assert.match(productName, /font-weight:500/);
    assert.match(productName, /line-height:20px/);
  }
});

test('copies the project image-link and discount-label nesting', () => {
  const imageBlocks = html.split('data-role="product-image"').slice(1);
  assert.equal(imageBlocks.length, 2);

  for (const imageBlock of imageBlocks) {
    const visibleMarkup = imageBlock.split('data-role="product-copy"')[0];
    const linkStart = visibleMarkup.indexOf('<a ');
    const badgeStart = visibleMarkup.indexOf('<table data-role="discount-badge"');
    const linkEnd = visibleMarkup.indexOf('</a>');

    assert.ok(linkStart >= 0 && linkStart < badgeStart);
    assert.ok(linkEnd > badgeStart);
    assert.match(visibleMarkup, /<td height="30" align="center" valign="middle" bgcolor="#8D1B1B"/);
    assert.match(visibleMarkup, /<span data-role="discount-label">SAVE (?:50|40)%<\/span>/);
    assert.doesNotMatch(visibleMarkup, /height="244"/);
  }
});

test('uses only the project component palette', () => {
  const allowedColors = new Set([
    '#101522', '#241413', '#3E3834', '#7B706B', '#8D1B1B', '#A7191C',
    '#B01E20', '#E8E1D1', '#F1EBE2', '#FBF6EC', '#FFFFFF',
  ]);
  const colors = html.match(/#[0-9A-Fa-f]{6}/g) ?? [];
  const unexpectedColors = [...new Set(colors.filter((color) => !allowedColors.has(color.toUpperCase())))];
  assert.deepEqual(unexpectedColors, []);
});

test('uses the approved premium evergreen copy', () => {
  assert.match(html, />THE FRESHINE EDIT</);
  assert.match(html, />The Art of Beautiful Living</);
  assert.match(html, />Refined window treatments, thoughtfully tailored to bring softness, depth, and timeless elegance to every room\.</);
  assert.match(html, />Natural Texture, Beautifully Lit</);
  assert.match(html, />Serene Privacy, Impeccably Tailored</);
  assert.match(html, />DISCOVER THE COLLECTION</);
});

test('retains square responsive image areas and sale pricing', () => {
  assert.equal((html.match(/data-role="product-image"[^>]*width="276"[^>]*height="276"/g) ?? []).length, 2);
  assert.match(html, /\$49\.90/);
  assert.match(html, /\$99\.80/);
  assert.match(html, /\$53\.90/);
  assert.match(html, /\$89\.90/);
  assert.ok((html.match(/text-decoration:line-through/g) ?? []).length >= 2);
});

test('uses the requested Elara and Iris products with featured images and UTM links', () => {
  const elaraUrl = 'https://freshinelife.com/products/freshine-elara-linen-blend-curtains-for-elegant-and-luxurious-drapes-in-every-room?utm_source=omnisend&amp;utm_medium=email&amp;utm_id=cover-rc';
  const irisUrl = 'https://freshinelife.com/collections/best-seller/products/freshine-iris-blackout-linen-curtains-elegant-light-blocking-drapes-for-living-room-and-bedroom?utm_source=omnisend&amp;utm_medium=email&amp;utm_id=cover-rc';
  const elaraImage = 'https://cdn.shopify.com/s/files/1/0901/6888/5527/files/Elara-Linen-Blend-Curtains-for-Large-Windows-89850-2-5-main.webp?v=1772800106';
  const irisImage = 'https://cdn.shopify.com/s/files/1/0901/6888/5527/files/Iris-Blackout-Linen-Curtains-2852-19-3.webp?v=1769324278';

  assert.ok((html.match(new RegExp(elaraUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) ?? []).length >= 3);
  assert.ok((html.match(new RegExp(irisUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) ?? []).length >= 3);
  assert.ok((html.match(new RegExp(elaraImage.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) ?? []).length >= 2);
  assert.ok((html.match(new RegExp(irisImage.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) ?? []).length >= 2);
  assert.match(html, />Elara Linen Blend Curtains</);
  assert.match(html, />Iris Blackout Linen Curtains</);
});
