// The scene-price six-grid uses plain rectangular badges; empty values remove the badge.
export function renderScenePriceDiscountBadges(template, content) {
  return template.replace(/<!-- FRESHINE_SCENE_PRICE_BADGE:(saleItems\[[0-5]\]\.discountLabel) -->([\s\S]*?)<!-- FRESHINE_END_SCENE_PRICE_BADGE:\1 -->/gu, (_, key, body) => {
    return String(content[key] ?? '').trim() ? body : '';
  });
}
