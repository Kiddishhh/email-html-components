// Editor-only logic. This module is never included in generated email HTML.
export function createSaveQueue({ send, onSaved = () => {}, onStatus = () => {} }) {
  const pending = new Map();
  let running = null;
  let inFlight = null;
  let failure = null;
  const status = () => onStatus(failure ? 'error' : running || inFlight ? 'saving' : pending.size ? 'pending' : 'saved', failure);
  const keyFor = (draftId, instanceId) => `${draftId ?? ''}\u0000${instanceId}`;
  function enqueue(instanceId, group, key, value, draftId = null) {
    const token = keyFor(draftId, instanceId);
    const entry = pending.get(token) ?? { draftId, instanceId, patch: { content: {}, settings: {} } };
    const patch = entry.patch;
    patch[group] ??= {};
    patch[group][key] = value;
    pending.set(token, entry);
    status();
  }
  function overlay(draft) {
    const draftHasPending = [...pending.values(), inFlight].some(entry => entry && (entry.draftId === null || entry.draftId === draft.id));
    const components = draft.components.map(instance => {
      const belongs = entry => entry?.instanceId === instance.instanceId && (entry.draftId === null || entry.draftId === draft.id);
      const patches = [belongs(inFlight) ? inFlight.patch : null, ...[...pending.values()].filter(belongs).map(entry => entry.patch)].filter(Boolean);
      if (!patches.length) return instance;
      return patches.reduce((current, patch) => ({ ...current, content: { ...current.content, ...patch.content }, settings: { ...current.settings, ...patch.settings }, ...(patch.textStyles ? {textStyles: {...current.textStyles, ...patch.textStyles}} : {}), confirmed: false }), instance);
    });
    return { ...draft, components, confirmed: components.length > 0 && components.every(x => x.confirmed) && !draftHasPending ? draft.confirmed : false };
  }
  async function drain() {
    failure = null;
    while (pending.size) {
      const [token, entry] = pending.entries().next().value;
      const { instanceId, patch, draftId } = entry;
      pending.delete(token);
      inFlight = entry;
      status();
      try {
        const result = await send(instanceId, patch, draftId);
        inFlight = null;
        onSaved(result);
      } catch (error) {
        const newer = pending.get(token)?.patch;
        pending.set(token, { ...entry, patch: { content: { ...patch.content, ...newer?.content }, settings: { ...patch.settings, ...newer?.settings }, ...((patch.textStyles || newer?.textStyles) ? {textStyles: {...patch.textStyles, ...newer?.textStyles}} : {}) } });
        inFlight = null;
        failure = error;
        throw error;
      }
    }
  }
  function flush() {
    if (running) return running;
    running = drain().finally(() => { running = null; status(); });
    return running;
  }
  return { enqueue, flush, overlay, hasPending: () => Boolean(pending.size || inFlight), isSaving: () => Boolean(running), hasFailed: () => Boolean(failure) };
}

export function groupEditorFields(keys, group) {
  if (group === 'settings') return [{ id: 'settings', label: '样式设置', keys }];
  const groups = new Map();
  for (const key of keys) {
    const card = key.match(/^(?:saleItems|products|items)\[(\d+)\]/u);
    const id = card ? `product-${card[1]}` : /(?:\.cta\.|\.button\.)/u.test(key) ? 'cta' : 'intro';
    const label = card ? `商品 ${Number(card[1]) + 1}` : id === 'cta' ? '底部 CTA' : '顶部文案';
    if (!groups.has(id)) groups.set(id, { id, label, keys: [], ...(card ? { itemIndex: Number(card[1]) } : {}) });
    groups.get(id).keys.push(key);
  }
  return [...groups.values()];
}

export function searchCatalog(catalog, category, query = '') {
  const words = query.trim().toLocaleLowerCase().split(/\s+/u).filter(Boolean);
  return catalog.filter(item => (!category || item.category === category) && words.every(word =>
    [item.name, item.category, item.componentKey, item.variant].join(' ').toLocaleLowerCase().includes(word)));
}

function decodeAttribute(value) {
  return value.replace(/&(?:amp|quot|apos|lt|gt|#39|#\d+|#x[\da-f]+);/giu, entity => {
    const named = { '&amp;': '&', '&quot;': '"', '&apos;': "'", '&lt;': '<', '&gt;': '>', '&#39;': "'" };
    if (named[entity.toLowerCase()]) return named[entity.toLowerCase()];
    const number = entity.slice(2, -1);
    const code = number[0].toLowerCase() === 'x' ? Number.parseInt(number.slice(1), 16) : Number(number);
    return code <= 0x10ffff ? String.fromCodePoint(code) : entity;
  });
}

export function linkInventory(draft, catalog, html, editableFields) {
  const sections = [...html.matchAll(/<!-- 组件：[\s\S]*?-->([\s\S]*?)<!-- \/组件：[\s\S]*?-->/gu)];
  return sections.flatMap((section, index) => {
    const instance = draft.components[index];
    if (!instance) return [];
    const component = catalog.find(x => x.componentKey === instance.componentKey);
    const keys = editableFields(instance.componentKey).content.filter(key => {
      const definition = component?.contentSchema.properties[key];
      return definition?.type === 'url' && !definition.role?.endsWith('image-source') && definition.editable !== false;
    });
    return [...section[1].matchAll(/<a\b[^>]*\bhref="([^"]*)"[^>]*>([\s\S]*?)<\/a>/giu)].map((anchor, anchorIndex) => {
      const url = decodeAttribute(anchor[1]);
      // Inspection metadata is inserted from the source href placeholder, never inferred
      // from URL equality: different slots and fixed anchors may share the same URL.
      const sourceKey = anchor[0].match(/\bdata-freshine-editor-link-field="([^"]+)"/u)?.[1]
        ?? anchor[0].match(/\bdata-freshine-href-slot="([^"]+)"/u)?.[1];
      const fieldKeys = sourceKey && keys.includes(sourceKey) && instance.content[sourceKey] === url ? [sourceKey] : [];
      const text = decodeAttribute(anchor[2].replace(/<[^>]*>/gu, ' ').replace(/\s+/gu, ' ').trim());
      return { id: `${instance.instanceId}:${anchorIndex}`, instanceId: instance.instanceId, componentName: instance.name, componentKey: instance.componentKey, fieldKeys, editable: fieldKeys.length > 0, label: text || '图片链接', url };
    });
  });
}

export function applyUtm(value, parameters) {
  let url;
  try { url = new URL(value); } catch { return value; }
  if (url.protocol !== 'https:') return value;
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_id', 'utm_content', 'utm_term']) {
    const next = parameters[key]?.trim();
    if (next) url.searchParams.set(key, next);
  }
  return url.href;
}
