import { editableFieldKeys, editorFieldCopy, editorInputDisplay, structuresForCatalog, styleKeysForStructure } from './editor-ui-contract.mjs';

const state = { catalog: [], draft: null, selectedId: null, selectedStructure: '', width: 600, previewTimer: null, saveTimer: null, pending: { content: {}, settings: {} } };

const $ = (selector) => document.querySelector(selector);
const structureElement = $('#structure');
const previewStage = $('#preview-stage');
const form = $('#field-form');
const emptyInspector = $('#inspector-empty');
const actions = $('#component-actions');
const confirmState = $('#confirm-state');
const structureSelect = $('#structure-select');
const styleSelect = $('#style-select');
const addSelectedComponent = $('#add-selected-component');
const uploadOmnisendDraftButton = $('#upload-omnisend-draft');

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { 'content-type': 'application/json', ...(options.headers ?? {}) }
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error ?? '请求失败');
  return body;
}

function selectedInstance() {
  return state.draft?.components.find(({ instanceId }) => instanceId === state.selectedId) ?? null;
}

function catalogItem(componentKey) {
  return state.catalog.find((component) => component.componentKey === componentKey);
}

function setDraft(draft) {
  state.draft = draft;
  if (state.selectedId && !draft.components.some(({ instanceId }) => instanceId === state.selectedId)) state.selectedId = null;
  renderStructure();
  renderInspector();
}

function addOption(select, { value, label }) {
  const option = document.createElement('option');
  option.value = value;
  option.textContent = label;
  select.append(option);
}

function renderStructureOptions() {
  structureSelect.replaceChildren();
  addOption(structureSelect, { value: '', label: '选择结构' });
  for (const category of structuresForCatalog(state.catalog)) addOption(structureSelect, { value: category, label: category });
  structureSelect.value = state.selectedStructure;
  renderStyleOptions();
}

function renderStyleOptions() {
  styleSelect.replaceChildren();
  if (!state.selectedStructure) {
    addOption(styleSelect, { value: '', label: '先选择结构' });
    styleSelect.disabled = true;
    addSelectedComponent.disabled = true;
    return;
  }
  addOption(styleSelect, { value: '', label: '选择样式' });
  for (const componentKey of styleKeysForStructure(state.catalog, state.selectedStructure)) {
    const component = catalogItem(componentKey);
    addOption(styleSelect, { value: componentKey, label: `${component.name} · ${component.variant}` });
  }
  styleSelect.disabled = false;
  addSelectedComponent.disabled = !styleSelect.value;
}

function renderStructure() {
  structureElement.replaceChildren();
  if (!state.draft?.components.length) {
    structureElement.innerHTML = '<p>尚未添加组件。可按任意顺序组合。</p>';
    return;
  }
  state.draft.components.forEach((instance, index) => {
    const item = document.createElement('article');
    item.className = `structure-item${state.selectedId === instance.instanceId ? ' selected' : ''}`;
    item.draggable = true;
    item.innerHTML = `<button type="button"><strong>${instance.name}</strong><span>${instance.componentKey}</span></button><button class="icon" data-action="up" title="上移">↑</button><button class="icon" data-action="down" title="下移">↓</button><button class="icon" data-action="remove" title="删除">×</button>`;
    item.querySelector('button:first-child').addEventListener('click', () => { state.selectedId = instance.instanceId; renderStructure(); renderInspector(); });
    item.querySelector('[data-action="up"]').addEventListener('click', () => reorder(index, index - 1));
    item.querySelector('[data-action="down"]').addEventListener('click', () => reorder(index, index + 1));
    item.querySelector('[data-action="remove"]').addEventListener('click', () => removeComponent(instance.instanceId));
    item.addEventListener('dragstart', (event) => event.dataTransfer.setData('text/plain', String(index)));
    item.addEventListener('dragover', (event) => event.preventDefault());
    item.addEventListener('drop', (event) => { event.preventDefault(); reorder(Number(event.dataTransfer.getData('text/plain')), index); });
    structureElement.append(item);
  });
}

function editableFields(componentKey, values, schema, groupName, groupKey, allowedKeys) {
  const visibleKeys = allowedKeys.filter((key) => key in values && schema.properties?.[key]?.editable !== false);
  if (!visibleKeys.length) return null;
  const fieldset = document.createElement('fieldset');
  fieldset.innerHTML = `<legend>${groupName}</legend>`;
  for (const key of visibleKeys) {
    const value = values[key];
    const metadata = schema.properties?.[key] ?? {};
    const wrapper = document.createElement('div');
    wrapper.className = 'field';
    const label = document.createElement('label');
    const copy = editorFieldCopy(componentKey, groupKey, key);
    const title = document.createElement('span');
    title.className = 'field-title';
    title.textContent = copy.label;
    const help = document.createElement('small');
    help.className = 'field-help';
    help.textContent = copy.help;
    const multiline = /(?:body|subtitle|description|address)/u.test(key) && String(value).length > 42;
    const input = document.createElement(multiline ? 'textarea' : 'input');
    if (!multiline) input.type = /^#[0-9A-F]{6}$/iu.test(String(value)) ? 'color' : 'text';
    const display = editorInputDisplay(value);
    input.value = display.value;
    input.placeholder = display.placeholder;
    input.dataset.group = groupName === '内容' ? 'content' : 'settings';
    input.dataset.key = key;
    input.addEventListener('input', onFieldInput);
    label.append(title, help);
    wrapper.append(label, input);
    if (metadata.role?.endsWith('image-source')) {
      const uploadLabel = document.createElement('label');
      uploadLabel.className = 'local-upload';
      uploadLabel.textContent = '上传本地图片（仅用于本地预览，最大 5 MB）';
      const upload = document.createElement('input');
      upload.type = 'file';
      upload.accept = 'image/png,image/jpeg,image/webp,image/gif';
      upload.addEventListener('change', () => uploadLocalImage(selectedInstance()?.instanceId, key, upload.files?.[0]));
      uploadLabel.append(upload);
      wrapper.append(uploadLabel);
    }
    fieldset.append(wrapper);
  }
  return fieldset;
}

function renderInspector() {
  const instance = selectedInstance();
  if (!instance) { form.hidden = true; emptyInspector.hidden = false; actions.hidden = true; confirmState.hidden = true; return; }
  const component = catalogItem(instance.componentKey);
  const fields = editableFieldKeys(instance.componentKey);
  actions.hidden = false;
  actions.replaceChildren();
  const confirm = document.createElement('button');
  confirm.type = 'button';
  confirm.className = `button${instance.confirmed ? '' : ' primary'}`;
  confirm.textContent = instance.confirmed ? '已确认组件' : '确认此组件';
  confirm.disabled = instance.confirmed;
  confirm.addEventListener('click', () => confirmComponent(instance.instanceId));
  actions.append(confirm);
  if (instance.componentKey === 'collection.saleGrid6') {
    const importButton = document.createElement('button');
    importButton.type = 'button';
    importButton.className = 'button';
    importButton.textContent = 'shopify商品导入';
    importButton.addEventListener('click', () => importSaleGrid(instance.instanceId));
    actions.append(importButton);
  }
  confirmState.hidden = false;
  confirmState.className = `confirm-state${instance.confirmed ? ' ready' : ''}`;
  confirmState.textContent = instance.confirmed ? '已锁定' : '待确认';
  const contentFields = editableFields(instance.componentKey, instance.content, component.contentSchema, '内容', 'content', fields.content);
  const settingsFields = editableFields(instance.componentKey, instance.settings, component.settingsSchema, '样式设置', 'settings', fields.settings);
  form.replaceChildren(...[contentFields, settingsFields].filter(Boolean));
  form.hidden = !contentFields && !settingsFields;
  emptyInspector.hidden = Boolean(contentFields || settingsFields);
  if (!contentFields && !settingsFields) emptyInspector.textContent = '当前使用效果演示默认值；无需编辑。';
}

function onFieldInput(event) {
  const input = event.currentTarget;
  const instance = selectedInstance();
  if (!instance) return;
  const group = input.dataset.group;
  instance[group][input.dataset.key] = input.value;
  state.pending[group][input.dataset.key] = input.value;
  window.clearTimeout(state.saveTimer);
  state.saveTimer = window.setTimeout(commitEdits, 320);
}

async function commitEdits() {
  const instance = selectedInstance();
  if (!instance) return;
  const patch = state.pending;
  state.pending = { content: {}, settings: {} };
  if (!Object.keys(patch.content).length && !Object.keys(patch.settings).length) return;
  try {
    const result = await api(`/api/drafts/${state.draft.id}/components/${instance.instanceId}`, { method: 'PATCH', body: JSON.stringify(patch) });
    setDraft(result.draft);
    queuePreview();
  } catch (error) { window.alert(error.message); }
}

async function addComponent(componentKey) {
  if (!state.draft) await createDraft();
  try {
    const result = await api(`/api/drafts/${state.draft.id}/components`, { method: 'POST', body: JSON.stringify({ componentKey }) });
    setDraft(result.draft);
    state.selectedId = state.draft.components.at(-1).instanceId;
    renderStructure(); renderInspector(); queuePreview();
  } catch (error) { window.alert(error.message); }
}

async function reorder(fromIndex, toIndex) {
  if (!state.draft || toIndex < 0 || toIndex >= state.draft.components.length || fromIndex === toIndex) return;
  try {
    const result = await api(`/api/drafts/${state.draft.id}/reorder`, { method: 'POST', body: JSON.stringify({ fromIndex, toIndex }) });
    setDraft(result.draft); queuePreview();
  } catch (error) { window.alert(error.message); }
}

async function removeComponent(instanceId) {
  if (!state.draft) return;
  if (!window.confirm('删除此组件？')) return;
  try {
    const result = await api(`/api/drafts/${state.draft.id}/components/${instanceId}`, { method: 'DELETE' });
    setDraft(result.draft); queuePreview();
  } catch (error) { window.alert(error.message); }
}

async function confirmComponent(instanceId) {
  if (!state.draft) return;
  try {
    const result = await api(`/api/drafts/${state.draft.id}/components/${instanceId}/confirm`, { method: 'POST', body: '{}' });
    setDraft(result.draft);
  } catch (error) { window.alert(error.message); }
}

async function importSaleGrid(instanceId) {
  const shopifyUrl = window.prompt('输入 Freshine 活动页或 Collection 链接（例如 https://freshinelife.com/pages/back-to-school-refresh）');
  if (!shopifyUrl) return;
  try {
    const result = await api(`/api/drafts/${state.draft.id}/components/${instanceId}/import-sale-grid`, {
      method: 'POST', body: JSON.stringify({ shopifyUrl: shopifyUrl.trim() })
    });
    setDraft(result.draft);
    queuePreview();
  } catch (error) {
    window.alert(error.message);
  }
}

function dataUrlForFile(file) {
  return new Promise((resolveDataUrl, rejectDataUrl) => {
    const reader = new FileReader();
    reader.onload = () => resolveDataUrl(String(reader.result));
    reader.onerror = () => rejectDataUrl(new Error('无法读取本地图片'));
    reader.readAsDataURL(file);
  });
}

async function uploadLocalImage(instanceId, fieldKey, file) {
  if (!state.draft || !instanceId || !file) return;
  if (!/^image\/(?:png|jpeg|webp|gif)$/u.test(file.type) || file.size > 5 * 1024 * 1024) {
    window.alert('请选择不超过 5 MB 的 PNG、JPEG、WEBP 或 GIF 图片。');
    return;
  }
  try {
    const result = await api(`/api/drafts/${state.draft.id}/components/${instanceId}/upload-image`, {
      method: 'POST', body: JSON.stringify({ fieldKey, filename: file.name, dataUrl: await dataUrlForFile(file) })
    });
    setDraft(result.draft);
    queuePreview();
  } catch (error) { window.alert(error.message); }
}

function queuePreview() {
  window.clearTimeout(state.previewTimer);
  state.previewTimer = window.setTimeout(renderPreview, 280);
}

async function renderPreview() {
  if (!state.draft?.components.length) { previewStage.innerHTML = '<p>从左侧添加组件后，预览会自动生成。</p>'; return; }
  try {
    const result = await api(`/api/drafts/${state.draft.id}/preview`, { method: 'POST', body: '{}' });
    const frame = document.createElement('iframe');
    frame.src = result.previewUrl;
    frame.width = state.width;
    frame.height = 2600;
    frame.title = 'Campaign preview';
    previewStage.replaceChildren(frame);
  } catch (error) { previewStage.innerHTML = `<p>预览生成失败：${error.message}</p>`; }
}

async function createDraft() {
  const result = await api('/api/drafts', { method: 'POST', body: JSON.stringify({ name: $('#campaign-name').value }) });
  state.selectedId = null;
  setDraft(result.draft);
  previewStage.innerHTML = '<p>从左侧添加组件后，预览会自动生成。</p>';
  $('.workspace').hidden = false;
}

async function uploadOmnisendDraft() {
  if (!state.draft) return;
  window.clearTimeout(state.saveTimer);
  await commitEdits();
  const name = window.prompt('Campaign 名称', state.draft.name);
  if (name === null) return;
  const subject = window.prompt('邮件主题（Subject）');
  if (subject === null) return;
  const preheader = window.prompt('预览文案（Preheader，可留空）', '');
  if (preheader === null) return;
  try {
    const prepared = await api(`/api/drafts/${state.draft.id}/prepare-omnisend-draft`, {
      method: 'POST', body: JSON.stringify({ campaign: { name, subject, preheader } })
    });
    const confirmedHash = window.prompt(`已生成静态安全 HTML。请粘贴下方完整 SHA-256 以确认后再上传为 Draft：\n${prepared.staticHtmlSha256}`);
    if (confirmedHash === null) return;
    if (confirmedHash !== prepared.staticHtmlSha256) throw new Error('确认的 SHA-256 不匹配，已取消上传');
    window.alert('请在启动编辑器的终端中输入 Omnisend API Key。密钥不会保存到浏览器或草稿文件。');
    const uploaded = await api(`/api/drafts/${state.draft.id}/upload-omnisend-draft`, {
      method: 'POST', body: JSON.stringify({ staticHtmlSha256: confirmedHash })
    });
    window.alert(`已上传为 Omnisend Draft：${uploaded.receipt.campaignID}`);
  } catch (error) { window.alert(error.message); }
}

$('#new-campaign').addEventListener('click', createDraft);
uploadOmnisendDraftButton.addEventListener('click', uploadOmnisendDraft);
structureSelect.addEventListener('change', () => {
  state.selectedStructure = structureSelect.value;
  renderStyleOptions();
});
styleSelect.addEventListener('change', () => { addSelectedComponent.disabled = !styleSelect.value; });
addSelectedComponent.addEventListener('click', () => addComponent(styleSelect.value));
document.querySelectorAll('.device').forEach((button) => button.addEventListener('click', () => {
  state.width = Number(button.dataset.width);
  document.querySelectorAll('.device').forEach((candidate) => candidate.classList.toggle('active', candidate === button));
  renderPreview();
}));

state.catalog = (await api('/api/catalog')).components;
renderStructureOptions();
await createDraft();
