import { readFileSync } from 'node:fs';

// HTML5 named references, including legacy names without semicolons.
// Data source: Python stdlib html.entities.html5, based on the WHATWG table:
// https://html.spec.whatwg.org/multipage/named-characters.html
const named = JSON.parse(readFileSync(new URL('../references/html-named-entities.v1.json', import.meta.url), 'utf8'));
const longestName = Math.max(...Object.keys(named).map(name => name.length));
const reference = new RegExp(`&(#(?:[xX][\\da-fA-F]+|\\d+);?|[a-zA-Z][a-zA-Z0-9]{0,${longestName - 1}};?)`, 'gu');
// The numeric-reference end state remaps legacy Windows-1252 code points.
const legacy = new Map([
  [0x80,0x20ac],[0x82,0x201a],[0x83,0x0192],[0x84,0x201e],[0x85,0x2026],
  [0x86,0x2020],[0x87,0x2021],[0x88,0x02c6],[0x89,0x2030],[0x8a,0x0160],
  [0x8b,0x2039],[0x8c,0x0152],[0x8e,0x017d],[0x91,0x2018],[0x92,0x2019],
  [0x93,0x201c],[0x94,0x201d],[0x95,0x2022],[0x96,0x2013],[0x97,0x2014],
  [0x98,0x02dc],[0x99,0x2122],[0x9a,0x0161],[0x9b,0x203a],[0x9c,0x0153],
  [0x9e,0x017e],[0x9f,0x0178]
]);

export function decodeHtmlEntities(value, { attribute = false } = {}) {
  // One pass only: &amp;#38; is literal "&#38;", not a second ampersand.
  return value.replace(reference, (whole, body, offset, source) => {
    if (body.startsWith('#')) {
      const hex = /^#x/iu.test(body);
      let code = parseInt(body.slice(hex ? 2 : 1), hex ? 16 : 10);
      if (!code || code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff)) code = 0xfffd;
      return String.fromCodePoint(legacy.get(code) ?? code);
    }
    for (let length = Math.min(body.length, longestName); length > 0; length--) {
      const name = body.slice(0, length);
      if (!Object.hasOwn(named, name)) continue;
      const next = body[length] ?? source[offset + whole.length] ?? '';
      if (attribute && !name.endsWith(';') && /[=a-z0-9]/iu.test(next)) return whole;
      return named[name] + body.slice(length);
    }
    return whole;
  });
}
