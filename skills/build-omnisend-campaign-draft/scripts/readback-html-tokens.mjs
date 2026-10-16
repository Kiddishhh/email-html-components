import { decodeHtmlEntities } from './html-entities.mjs';

// A quoted attribute may contain >. Share this boundary rule between the
// visible-copy check and URL ownership checks so attributes never become copy.
export function* htmlTokens(html) {
  const tokens = /<!--[\s\S]*?-->|<\/?[a-z][\w:-]*(?:[^<>"']|"[^"]*"|'[^']*')*>|[^<]+|</giu;
  let match;
  while ((match = tokens.exec(html))) {
    yield match;
    const raw = match[0].match(/^<(script|style|title)(?=[\t\n\f\r />])/iu);
    if (raw) {
      // Hidden raw-text/RCDATA contents end at their own closing tag;
      // apparent markup inside script, style or title cannot alter the tree.
      const end = new RegExp(String.raw`</${raw[1]}(?=[\t\n\f\r />])`, 'giu');
      end.lastIndex = tokens.lastIndex;
      const closing = end.exec(html);
      if (closing && !/^<\/[a-z][\w:-]*(?:[^<>"']|"[^"]*"|'[^']*')*>/iu.test(html.slice(closing.index))) {
        throw new Error(`email content readback has unsupported ${raw[1].toLowerCase()} closing tag`);
      }
      tokens.lastIndex = closing ? closing.index : html.length;
    }
  }
}

export function branchHtml(html, outlook = false) {
  return html.replace(/<!--\[if\s+([^\]]+)\]>([\s\S]*?)<!\[endif\]-->/giu, (_, condition, body) => {
    const keep = /!mso/iu.test(condition) ? !outlook : outlook;
    return keep ? body.replace(/^<!-->/u, '').replace(/<!--$/u, '') : '';
  });
}

export function cssDeclarations(raw) {
  const style = raw.replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\/\*[\s\S]*?\*\//gu, value => value.startsWith('/*') ? '' : value);
  const declarations = [];
  let begin = 0, depth = 0, quote = '';
  for (let i = 0; i <= style.length; i++) {
    const ch = style[i];
    if (quote) { if (ch === '\\') i++; else if (ch === quote) quote = ''; continue; }
    if (ch === '"' || ch === "'") quote = ch;
    else if (ch === '(') depth++;
    else if (ch === ')') depth--;
    else if ((ch === ';' && depth === 0) || i === style.length) { declarations.push(style.slice(begin, i)); begin = i + 1; }
  }
  const effective = new Map();
  for (const declaration of declarations) {
    const match = declaration.match(/^\s*([\w-]+)\s*:([\s\S]*)$/u);
    if (!match) continue;
    const property = match[1].toLowerCase().replace(/^background$/u, 'background-image');
    const important = /!\s*important\s*$/iu.test(match[2]);
    if (!effective.get(property)?.important || important) effective.set(property, { value: match[2].replace(/!\s*important\s*$/iu, '').trim(), important });
  }
  return effective;
}

const blocks = new Set('table thead tbody tfoot tr td th caption div p h1 h2 h3 h4 h5 h6 ul ol li blockquote hr address article aside center details dialog dir dl dt dd fieldset figcaption figure footer form header hgroup legend listing main menu nav pre search section summary'.split(' '));
const voidElements = new Set('area base br col embed hr img input link meta param source track wbr v:fill'.split(' '));
const inertElements = new Set(['script', 'style', 'template', 'title']);
// HTML paragraph closing uses button scope, independently of CSS display.
// A template/table cell/button must not let a new paragraph close an outer p.
const paragraphScope = new Set('applet caption html table td th marquee object template button'.split(' '));
const paragraphClosingStarts = new Set('address article aside blockquote center details dialog dir div dl fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 header hgroup hr listing main menu nav ol p pre search section table ul li dt dd'.split(' '));
const formattingElements = new Set('a b big code em font i nobr s small strike strong tt u'.split(' '));
export const normalizeText = value => value.replace(/\s+/gu, ' ').trim();

// One tree defines visible text, link copy and image ownership. Text nodes are
// decoded once, and excluded subtrees never contribute positions or URL nodes.
export function parseReadbackHtml(html) {
  let position = 0;
  let formOpen = false;
  const root = { name: 'root', children: [], start: 0, excluded: false, visibility: 'visible' };
  const stack = [root];
  const closeFrom = index => {
    for (const element of stack.slice(index)) element.end = position;
    stack.length = index;
  };
  for (const [token] of htmlTokens(html)) {
    if (token.startsWith('<!--')) continue;
    // HTML tag names end only at ASCII whitespace, / or >. In particular an
    // NBSP is part of an unknown name, not an attribute or a title boundary.
    const tag = token.match(/^<(\/)?([^\t\n\f\r />]+)([\s\S]*?)>$/u);
    if (!tag) {
      const parent = stack.at(-1);
      if (!parent.excluded && parent.visibility === 'visible') {
        const value = decodeHtmlEntities(token);
        parent.children.push({ name: '#text', value });
        position += value.replace(/\s/gu, '').length;
      }
      continue;
    }
    const name = tag[2].toLowerCase();
    const templateScope = stack.findLastIndex(element => element.name === 'template');
    if (tag[1]) {
      if (name === 'form' && templateScope < 0) formOpen = false;
      const index = stack.findLastIndex(element => element.name === name);
      if (index > 0 && (name === 'template' || index > templateScope)) closeFrom(index);
      continue;
    }
    if (name === 'form' && templateScope < 0) {
      // A nested form start is ignored by HTML's form-pointer rules, rather
      // than closing p. Reject this unsupported structure before inheriting
      // visibility or manufacturing visible copy. Keep state beyond stack pops.
      if (formOpen) throw new Error('email content readback has unsupported nested form');
      formOpen = true;
    }
    if (paragraphClosingStarts.has(name)) {
      for (let index = stack.length - 1; index > 0; index--) {
        if (stack[index].name === 'p') {
          // HTML can reconstruct active formatting after closing p. This
          // bounded parser cannot infer its hidden state or inherited links.
          if (templateScope < 0 && stack.slice(index + 1).some(element => formattingElements.has(element.name))) {
            throw new Error('email content readback has unsupported implicit paragraph closure across formatting elements');
          }
          closeFrom(index);
          break;
        }
        if (paragraphScope.has(stack[index].name)) break;
      }
    }
    const tableScope = stack.findLastIndex(element => element.name === 'table' || element.name === 'template');
    const implied = name === 'td' || name === 'th' ? new Set(['td', 'th'])
      : name === 'tr' ? new Set(['tr'])
      : ['thead', 'tbody', 'tfoot'].includes(name) ? new Set(['thead', 'tbody', 'tfoot']) : null;
    if (implied) {
      const index = stack.findLastIndex(element => implied.has(element.name));
      if (index > tableScope) closeFrom(index);
    }
    const attrs = {};
    for (const match of tag[3].matchAll(/\s+([\w:.-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/gu)) {
      const key = match[1].toLowerCase();
      if (Object.hasOwn(attrs, key)) throw new Error(`email content readback has duplicate node attribute ${key}`);
      attrs[key] = decodeHtmlEntities(match[2] ?? match[3] ?? match[4] ?? '', { attribute: true });
    }
    const style = cssDeclarations(attrs.style ?? '');
    const display = (style.get('display')?.value ?? '').toLowerCase();
    const parent = stack.at(-1);
    const visibility = (style.get('visibility')?.value ?? '').toLowerCase();
    const element = {
      name, attrs, style, children: [], parent, start: position, end: position,
      excluded: parent.excluded || inertElements.has(name) || Object.hasOwn(attrs, 'hidden') || display === 'none',
      visibility: ['visible', 'hidden', 'collapse'].includes(visibility) ? visibility : parent.visibility,
      container: display === 'inline' ? false : /^(?:inline-block|block|table(?:-cell|-row)?)$/u.test(display) ? true : undefined,
      block: /^(?:inline|inline-block|inline-table)$/u.test(display) ? false
        : /^(?:block|table(?:-cell|-row|-row-group|-header-group|-footer-group)?|list-item|flow-root)$/u.test(display) || blocks.has(name)
    };
    parent.children.push(element);
    // In HTML, a trailing slash does not close a non-void element.
    if (!voidElements.has(name)) stack.push(element);
  }
  closeFrom(1);
  root.end = position;
  return root;
}

export function visibleText(root) {
  function copy(element) {
    if (element.excluded) return '';
    if (element.name === '#text') return element.value;
    if (['img', 'br', 'hr'].includes(element.name)) return element.visibility === 'visible' ? ' ' : '';
    const body = element.children.map(copy).join('');
    return element.block ? ` ${body} ` : body;
  }
  return normalizeText(copy(root));
}

export function normalizedVisibleText(html) {
  return visibleText(parseReadbackHtml(branchHtml(html)));
}
