import { textStyleCss } from '../skills/build-omnisend-campaign-draft/editor/public/text-style-contract.mjs';
// Only the six-product detail component opts into these scoped badge markers.
// Input remains plain text; the renderer owns every emitted tag and style.
const escapeText = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

export function renderDetailDiscountBadges(template, content, textStyles = {}) {
  return template.replace(/<!-- FRESHINE_DETAIL_BADGE:(saleItems\[[0-5]\]\.discountLabel) -->([\s\S]*?)<!-- FRESHINE_END_DETAIL_BADGE:\1 -->/gu, (_, key, body) => {
    const label = String(content[key] ?? '').trim();
    if (!label) return '';
    const parts = label.match(/^(.*?)\s*(\d+(?:\.\d+)?%)$/u);
    const percentOverrides = textStyleCss(textStyles?.[key] ?? {});
    const rendered = parts
      ? `${escapeText(parts[1].trim() || 'SAVE')}<br><span style="font-size:18px;font-size:min(18px,3vw);font-weight:700;line-height:22px;line-height:min(22px,3.666667vw);${percentOverrides ? percentOverrides + ';' : ''}">${escapeText(parts[2])}</span>`
      : escapeText(label);
    return body.replaceAll(`{{content.${key}}}`, rendered);
  });
}
