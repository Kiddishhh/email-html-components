// A strict validator for our table-based email fragments, not a sanitizer.
// It never rewrites markup. Local previews may allow only explicitly resolved assets.
const tags = new Set('table thead tbody tfoot tr td th caption colgroup col a img br hr p span h1 h2 h3 h4 h5 h6 strong b em i u s small sub sup ul ol li blockquote v:rect v:fill v:textbox'.split(' '));
const voidTags = new Set(['img', 'br', 'hr', 'col', 'v:fill']);
const attributes = new Set('align alt background bgcolor border cellpadding cellspacing class color colspan fill height href inset rel role rowspan src stroke style target title type valign width xmlns:v'.split(' '));
function reject(message) { throw new Error(`Unsafe email HTML: ${message}`); }
function decode(value) {
  return value.replace(/&#(x[\da-f]+|\d+);?/giu, (_, code) => {
    const number = code[0].toLowerCase() === 'x' ? parseInt(code.slice(1), 16) : Number(code);
    return number > 0 && number <= 0x10ffff ? String.fromCodePoint(number) : '\uFFFD';
  }).replace(/&(amp|quot|apos|lt|gt|colon|Tab|NewLine);/gu, (_, key) => ({amp:'&',quot:'"',apos:"'",lt:'<',gt:'>',colon:':',Tab:'\t',NewLine:'\n'})[key]);
}
function checkUrl(raw, kind, options) {
  const value = decode(raw);
  if (/[\u0000-\u0020\u007f\\<>"']/u.test(value)) reject(`unsafe ${kind} URL`);
  if (kind === 'href' && value === '[[unsubscribe_link]]') return;
  if (kind !== 'href') {
    if (options.allowAssetReferences && /^asset:\/\/[a-z0-9][a-z0-9-]*$/u.test(value)) return;
    if (options.localImageUrls?.has(value)) return;
  }
  let url;
  try { url = new URL(value); } catch { reject(`local or relative ${kind} URL`); }
  if (/^https:\/\//iu.test(value) && url.protocol === 'https:' && url.hostname && !url.username && !url.password) return;
  if (kind === 'href' && /^(mailto:|tel:)$/u.test(url.protocol) && url.pathname) return;
  reject(`unsafe ${kind} URL protocol`);
}
function checkStyle(raw, options) {
  const value = decode(raw).replace(/\/\*[\s\S]*?\*\//gu, '');
  if (/&[a-z][a-z0-9]*;/iu.test(value)) reject('unsupported HTML entity in inline CSS');
  if (/[\\@<>]/u.test(value) || /(?:(?:expression|(?:-webkit-)?image(?:-set)?|src)\s*\(|behavior\s*:|-moz-binding\s*:|box-shadow\s*:|display\s*:\s*(?:flex|grid)|position\s*:\s*(?:absolute|fixed|sticky))/iu.test(value)) reject('unsafe inline CSS');
  // Remove every complete url() and fail closed on any malformed remainder.
  const rest = value.replace(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^\s'"()]*))\s*\)/giu, (_, double, single, bare) => {
    checkUrl(double ?? single ?? bare, 'CSS image', options); return '';
  });
  if (/url\s*\(/iu.test(rest)) reject('malformed CSS image URL');
}
function validateBranch(html, options) {
  const stack = [];
  // Quotes may contain >; a tag is consumed completely before attributes are parsed.
  const token = /<!--[\s\S]*?-->|<\/?[a-z][\w:-]*(?:[^<>"']|"[^"]*"|'[^']*')*>/giy;
  for (let index = 0; index < html.length;) {
    const next = html.indexOf('<', index);
    if (next === -1) break;
    token.lastIndex = next;
    const found = token.exec(html);
    if (!found) reject('malformed HTML tag or comment');
    index = token.lastIndex;
    const source = found[0];
    if (source.startsWith('<!--')) {
      const body = source.slice(4, -3);
      if (/^(?:>|->)/u.test(body) || /--|<!-/u.test(body)) reject('malformed HTML comment');
      continue;
    }
    const match = source.match(/^<(\/)?([\w:-]+)([\s\S]*?)>$/u);
    const [, closing, rawName] = match;
    const name = rawName.toLowerCase();
    if (!tags.has(name)) reject(`unsupported tag ${name}`);
    if (closing) {
      if (match[3].trim() || stack.pop() !== name) reject(`unbalanced closing tag ${name}`);
      continue;
    }
    let rest = match[3];
    const selfClosing = /\/\s*$/u.test(rest);
    if (selfClosing) rest = rest.replace(/\/\s*$/u, '');
    const seen = new Set();
    const attr = /\s+([a-z_:][\w:.-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/iy;
    for (let position = 0; position < rest.length;) {
      if (!rest.slice(position).trim()) break;
      attr.lastIndex = position;
      const entry = attr.exec(rest);
      if (!entry) reject(`malformed attribute on ${name}`);
      position = attr.lastIndex;
      const key = entry[1].toLowerCase();
      const value = entry[2] ?? entry[3] ?? entry[4] ?? '';
      if (seen.has(key)) reject(`duplicate attribute ${key}`);
      seen.add(key);
      if (/^on/iu.test(key) || (!attributes.has(key) && !/^(?:data|aria)-[\w.-]+$/u.test(key))) reject(`unsupported attribute ${key}`);
      if (['src', 'href', 'background'].includes(key)) checkUrl(value, key, options);
      if (key === 'style') checkStyle(value, options);
    }
    if (name === 'a' && !seen.has('href')) reject('incomplete link');
    if (name === 'img' && !seen.has('src')) reject('missing image src');
    if (selfClosing && !voidTags.has(name)) reject(`self-closing non-void tag ${name}`);
    if (!voidTags.has(name)) stack.push(name);
  }
  if (stack.length) reject(`unbalanced open tag ${stack.at(-1)}`);
}
export function assertSafeEmailHtml(html, options = {}) {
  if (typeof html !== 'string' || !html.trim()) reject('empty HTML');
  if (/\{\{(?:content|settings)\./u.test(html)) reject('unresolved component placeholder');
  // Validate both regular clients and Outlook. Conditional VML wrappers often
  // span several comments, so validate the combined Outlook branch as a whole.
  const conditional = /<!--\[if\s+([^\]]+)\]>([\s\S]*?)<!\[endif\]-->/giu;
  const regular = html.replace(conditional, (_, condition, body) => /!mso/iu.test(condition) ? body.replace(/^<!-->/u, '').replace(/<!--$/u, '') : '');
  const outlook = html.replace(conditional, (_, condition, body) => /!mso/iu.test(condition) ? '' : body);
  for (const branch of new Set([regular, outlook])) {
    if (/<!\[|<!--\[if/iu.test(branch)) reject('malformed conditional HTML');
    validateBranch(branch, options);
  }
}
