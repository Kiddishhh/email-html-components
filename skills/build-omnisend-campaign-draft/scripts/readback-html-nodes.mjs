import { branchHtml, parseReadbackHtml, visibleText, normalizeText as text } from './readback-html-tokens.mjs';

function cssImages(effective) {
  const urls = [];
  for (const [property, { value }] of effective) {
    for (const match of value.matchAll(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\burl\(\s*(?:"([^"]*)"|'([^']*)'|([^\s'"()]*))\s*\)/giu)) {
      // Consume whole CSS strings before looking for actual url() functions.
      const url = match[1] ?? match[2] ?? match[3];
      if (url !== undefined) urls.push({ role: `css:${property}`, url });
    }
  }
  return urls.sort((a, b) => a.role.localeCompare(b.role));
}

const contentContainers = new Set('root table thead tbody tfoot tr td th div p h1 h2 h3 h4 h5 h6 ul ol li blockquote v:rect'.split(' '));

// Collapse unary layout wrappers, but retain branching cells (including empty
// cells) so equal copy in adjacent cards does not erase their distinct owners.
function contentOwners(root) {
  const containers = new Map();
  function flatten(element) {
    if (element.excluded) return [];
    if (element.name === '#text') return [{ kind: 'text', value: element.value }];
    if (element.name === 'img' || element.name === 'v:fill') {
      if (element.visibility !== 'visible') return [];
      const node = { kind: 'image' };
      containers.set(element, node);
      return [node];
    }
    if (element.name === 'br') return [{ kind: 'text', value: ' ' }];
    const children = [];
    for (const child of element.children.flatMap(flatten)) {
      if (child.kind === 'text' && !child.boundary && children.at(-1)?.kind === 'text' && !children.at(-1).boundary) children.at(-1).value += child.value;
      else children.push(child);
    }
    if (!(element.container ?? contentContainers.has(element.name))) return children;
    const meaningful = children.filter(child => child.kind !== 'text' || text(child.value));
    const node = meaningful.length === 1 ? meaningful[0] : { kind: 'block', children: meaningful };
    node.boundary = true;
    containers.set(element, node);
    return [node];
  }
  const [tree] = flatten(root);
  const locations = new Map();
  function locate(node, path) {
    locations.set(node, { path });
    (node.children ?? []).forEach((child, index) => locate(child, [...path, index]));
  }
  locate(tree, []);
  return element => {
    let container = element;
    while (!containers.has(container)) container = container.parent;
    const location = locations.get(containers.get(container));
    const images = [];
    const visit = current => {
      if (current.excluded) return;
      if (current.name === 'img' || current.name === 'v:fill') {
        if (current.visibility === 'visible') images.push(locations.get(containers.get(current)).path);
      }
      else current.children?.forEach(visit);
    };
    visit(element);
    return { path: location.path, range: [element.start, element.end], images };
  };
}

function nodes(html) {
  const root = parseReadbackHtml(html);
  const ownerOf = contentOwners(root);
  const result = [];
  const visibleDescendant = element => !element.excluded && (element.name === '#text'
    ? Boolean(text(element.value))
    : element.visibility === 'visible' || element.children.some(visibleDescendant));
  function visit(element, link = '', shape = '') {
    if (element.excluded || element.name === '#text') return;
    const { name, attrs = {}, style = new Map() } = element;
    const visible = element.visibility === 'visible';
    const clickable = visible || element.children.some(visibleDescendant);
    if (name === 'a') {
      link = attrs.href ?? '';
      if (clickable) result.push({ role: 'link', url: link, copy: visibleText(element) });
    }
    if (name === 'v:rect') shape = attrs.href ?? '';
    if (clickable && name !== 'a' && attrs.href !== undefined) result.push({ role: `${name}:link`, url: attrs.href });
    if (visible) {
      const add = record => result.push({ ...record, owner: ownerOf(element) });
      if (name === 'img' || name === 'v:fill') add({ role: name, url: attrs.src ?? '', ...(name === 'img' ? { alt: attrs.alt ?? '', link } : { link: shape }) });
      if (attrs.background !== undefined) add({ role: 'background', url: attrs.background });
      for (const image of cssImages(style)) add(image);
    }
    element.children.forEach(child => visit(child, link, shape));
  }
  visit(root);
  return { records: result, copy: visibleText(root) };
}

export function verifyReadbackNodes(expectedHtml, remoteHtml) {
  const assetUrls = new Map();
  let altCount = 0;
  const knownImages = new Set();
  for (const outlook of [false, true]) {
    const beforeBranch = nodes(branchHtml(expectedHtml, outlook));
    const afterBranch = nodes(branchHtml(remoteHtml, outlook));
    if (beforeBranch.copy !== afterBranch.copy) throw new Error(`email content readback visible text or component order does not match (${outlook ? 'Outlook' : 'regular'})`);
    const expected = beforeBranch.records;
    const remote = afterBranch.records;
    for (const node of expected) if (node.url.startsWith('https://app.omnisend.com/images/')) knownImages.add(node.url);
    const branch = outlook ? 'Outlook' : 'regular';
    if (expected.length !== remote.length) throw new Error(`email content readback URL node count does not match (${branch})`);
    altCount = Math.max(altCount, expected.filter(node => node.role === 'img' && node.alt).length);
    for (let index = 0; index < expected.length; index++) {
      const before = expected[index], after = remote[index];
      // Read-only recovery has no uploaded URL map. Bind each unresolved asset
      // to its actual node, require an Omnisend image URL and consistent reuse.
      if (before.url.startsWith('asset://')) {
        if (!/^https:\/\/app\.omnisend\.com\/images\/[A-Za-z0-9._-]+$/u.test(after.url)) throw new Error(`email content readback missing URL replacement at ${branch} node ${index + 1}`);
        const prior = assetUrls.get(before.url);
        if (prior && prior !== after.url) throw new Error('email content readback asset URL replacements are inconsistent');
        assetUrls.set(before.url, after.url);
        before.url = after.url;
      }
      if (before.alt !== after.alt) throw new Error(`email content readback image alt text does not match node ${index + 1}`);
      if (JSON.stringify(before) !== JSON.stringify(after)) throw new Error(`email content readback missing URL or mismatched node association (${branch} node ${index + 1})`);
    }
  }
  const newImages = new Set([...assetUrls.values()].filter(url => !knownImages.has(url)));
  if (newImages.size < assetUrls.size) throw new Error('email content readback has too few distinct uploaded image replacements');
  return { verifiedAltCount: altCount, verifiedAssetCount: assetUrls.size };
}
