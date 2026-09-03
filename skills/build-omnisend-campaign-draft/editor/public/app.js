import { appendPendingEdit, consumePendingEdits, editableFieldKeys, editorFieldCopy, editorInputDisplay, normalizeHexColor, previewComponentIndex, previewStageScrollTop, previewTargetIsCurrent, structuresForCatalog, styleKeysForStructure } from './editor-ui-contract.mjs';

const state = { catalog: [], templates: [], draft: null, selectedId: null, selectedTemplateId: '', selectedStructure: '', width: 600, previewTimer: null, saveTimer: null, previewFocusTimer: null, highlightTimer: null, pending: { instanceId: null, content: {}, settings: {} } };

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
const templateSelect = $('#template-select');
const useTemplateButton = $('#use-template');
const saveTemplateButton = $('#save-template');
const deleteTemplateButton = $('#delete-template');
const templateStatus = $('#template-status');
const templateSaveDialog = $('#template-save-dialog');
const templateNameInput = $('#template-name');
const submitTemplateSave = $('#submit-template-save');
const cancelTemplateSave = $('#cancel-template-save');
const exportOmnisendHtmlButton = $('#export-omnisend-html');
const uploadOmnisendDraftButton = $('#upload-omnisend-draft');
const omnisendUploadDialog = $('#omnisend-upload-dialog');
const omnisendCampaignNameInput = $('#omnisend-campaign-name');
const omnisendSubjectInput = $('#omnisend-subject');
const omnisendPreheaderInput = $('#omnisend-preheader');
const omnisendApiKeyInput = $('#omnisend-api-key');
const showOmnisendApiKey = $('#show-omnisend-api-key');
const submitOmnisendUpload = $('#submit-omnisend-upload');
const cancelOmnisendUpload = $('#cancel-omnisend-upload');
const omnisendExportDialog = $('#omnisend-export-dialog');
const omnisendExportApiKeyInput = $('#omnisend-export-api-key');
const showOmnisendExportApiKey = $('#show-omnisend-export-api-key');
const submitOmnisendExport = $('#submit-omnisend-export');
const cancelOmnisendExport = $('#cancel-omnisend-export');
const omnisendHtmlCopyFallback = $('#omnisend-html-copy-fallback');
const omnisendHtmlCopyText = $('#omnisend-html-copy-text');
const copyOmnisendHtmlManually = $('#copy-omnisend-html-manually');
const closeOmnisendHtmlCopy = $('#close-omnisend-html-copy');
let resolveOmnisendUpload = null;
let resolveOmnisendHtmlExport = null;
let resolveTemplateName = null;

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { 'content-type': 'application/json', ...(options.headers ?? {}) }
  });
  const body = await response.json();
  if (!response.ok) {
    const error = new Error(body.error ?? '请求失败');
    error.status = response.status;
    error.code = body.code;
    error.body = body;
    throw error;
  }
  return body;
}

function selectedInstance() {
  return state.draft?.components.find(({ instanceId }) => instanceId === state.selectedId) ?? null;
}

function catalogItem(componentKey) {
  return state.catalog.find((component) => component.componentKey === componentKey);
}

function captureFieldFocus() {
  const input = document.activeElement;
  if (!(input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) || !form.contains(input) || !input.dataset.group || !input.dataset.key) return null;
  return {
    group: input.dataset.group,
    key: input.dataset.key,
    selectionStart: input.selectionStart,
    selectionEnd: input.selectionEnd
  };
}

function restoreFieldFocus(focus) {
  if (!focus) return;
  const input = [...form.querySelectorAll('input, textarea')].find((candidate) => candidate.dataset.group === focus.group && candidate.dataset.key === focus.key);
  if (!input) return;
  input.focus();
  if (typeof focus.selectionStart !== 'number' || typeof focus.selectionEnd !== 'number') return;
  try {
    input.setSelectionRange(focus.selectionStart, focus.selectionEnd);
  } catch {
    // Color and file controls do not support a text selection range.
  }
}

function setDraft(draft, { fieldFocus = null } = {}) {
  state.draft = draft;
  if (state.selectedId && !draft.components.some(({ instanceId }) => instanceId === state.selectedId)) state.selectedId = null;
  saveTemplateButton.disabled = draft.components.length === 0;
  renderStructure();
  renderInspector();
  restoreFieldFocus(fieldFocus);
}

function addOption(select, { value, label }) {
  const option = document.createElement('option');
  option.value = value;
  option.textContent = label;
  select.append(option);
}

function setTextMessage(container, message) {
  const paragraph = document.createElement('p');
  paragraph.textContent = message;
  container.replaceChildren(paragraph);
}

function selectedTemplate() {
  return state.templates.find(({ id }) => id === state.selectedTemplateId) ?? null;
}

function renderTemplateOptions() {
  templateSelect.replaceChildren();
  addOption(templateSelect, { value: '', label: state.templates.length ? '选择已保存模板' : '暂无已保存模板' });
  for (const template of state.templates) addOption(templateSelect, {
    value: template.id,
    label: `${template.name} · ${template.componentCount} 个组件`
  });
  if (!state.templates.some(({ id }) => id === state.selectedTemplateId)) state.selectedTemplateId = '';
  templateSelect.value = state.selectedTemplateId;
  useTemplateButton.disabled = !state.selectedTemplateId;
  deleteTemplateButton.disabled = !state.selectedTemplateId;
}

function setTemplates(templates, selectedTemplateId = state.selectedTemplateId) {
  state.templates = templates;
  state.selectedTemplateId = selectedTemplateId;
  renderTemplateOptions();
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

async function selectComponent(instanceId) {
  window.clearTimeout(state.saveTimer);
  await commitEdits();
  state.selectedId = instanceId;
  renderStructure();
  renderInspector();
  focusSelectedPreview();
}

function focusSelectedPreview({ behavior = 'smooth' } = {}) {
  const index = previewComponentIndex(state.draft?.components ?? [], state.selectedId);
  const frame = previewStage.querySelector('iframe');
  if (index < 0 || !frame?.contentDocument || !frame.contentWindow) return false;
  const targets = frame.contentDocument.querySelectorAll('.freshine-component');
  const target = targets[index];
  if (!target) return false;

  let style = frame.contentDocument.querySelector('#freshine-editor-selection-style');
  if (!style) {
    style = frame.contentDocument.createElement('style');
    style.id = 'freshine-editor-selection-style';
    style.textContent = '.freshine-editor-selected-component{outline:3px solid #9D1D20!important;outline-offset:-3px!important;}';
    frame.contentDocument.head.append(style);
  }
  frame.contentDocument.querySelectorAll('.freshine-editor-selected-component').forEach((element) => element.classList.remove('freshine-editor-selected-component'));
  target.classList.add('freshine-editor-selected-component');

  const alignTarget = (scrollBehavior) => {
    const frameWindow = frame.contentWindow;
    const frameDocument = frame.contentDocument;
    if (!frameDocument || !previewTargetIsCurrent({ frame, currentFrame: previewStage.querySelector('iframe'), frameWindow, target })) return false;
    const documentTop = target.getBoundingClientRect().top + frameWindow.scrollY;
    const innerMax = Math.max(0, frameDocument.documentElement.scrollHeight - frame.clientHeight);
    const innerScroll = Math.min(documentTop, innerMax);
    frameWindow.scrollTo({ top: innerScroll, behavior: 'auto' });
    previewStage.scrollTo({
      top: previewStageScrollTop({
        stageScrollTop: previewStage.scrollTop,
        stageTop: previewStage.getBoundingClientRect().top,
        frameTop: frame.getBoundingClientRect().top,
        documentTop,
        innerScroll
      }),
      behavior: scrollBehavior
    });
    return true;
  };
  alignTarget(behavior);
  window.clearTimeout(state.previewFocusTimer);
  state.previewFocusTimer = window.setTimeout(() => {
    if (state.selectedId === state.draft?.components[index]?.instanceId && target.isConnected) alignTarget('auto');
  }, 350);

  window.clearTimeout(state.highlightTimer);
  state.highlightTimer = window.setTimeout(() => target.classList.remove('freshine-editor-selected-component'), 1800);
  return true;
}

function renderStructure() {
  structureElement.replaceChildren();
  if (!state.draft?.components.length) {
    setTextMessage(structureElement, '尚未添加组件。可按任意顺序组合。');
    return;
  }
  state.draft.components.forEach((instance, index) => {
    const item = document.createElement('article');
    item.className = `structure-item${state.selectedId === instance.instanceId ? ' selected' : ''}`;
    item.draggable = true;
    const selectButton = document.createElement('button');
    selectButton.type = 'button';
    const name = document.createElement('strong');
    name.textContent = instance.name;
    const key = document.createElement('span');
    key.textContent = instance.componentKey;
    selectButton.append(name, key);
    selectButton.addEventListener('click', () => selectComponent(instance.instanceId));

    const actionButton = ({ action, title, text, onClick }) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'icon';
      button.dataset.action = action;
      button.title = title;
      button.textContent = text;
      button.addEventListener('click', onClick);
      return button;
    };
    item.append(
      selectButton,
      actionButton({ action: 'up', title: '上移', text: '↑', onClick: () => reorder(index, index - 1) }),
      actionButton({ action: 'down', title: '下移', text: '↓', onClick: () => reorder(index, index + 1) }),
      actionButton({ action: 'remove', title: '删除', text: '×', onClick: () => removeComponent(instance.instanceId) })
    );
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
  const legend = document.createElement('legend');
  legend.textContent = groupName;
  fieldset.append(legend);
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
    label.append(title, help);
    const display = editorInputDisplay(value, metadata);
    if (display.control === 'checkbox') {
      const toggle = document.createElement('label');
      toggle.className = 'toggle-control';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = display.checked;
      input.dataset.group = groupName === '内容' ? 'content' : 'settings';
      input.dataset.key = key;
      input.setAttribute('aria-label', copy.label);
      const status = document.createElement('span');
      const updateStatus = () => { status.textContent = input.checked ? '开启' : '关闭'; };
      updateStatus();
      input.addEventListener('change', () => {
        updateStatus();
        queueFieldEdit(input, input.checked);
      });
      toggle.append(input, status);
      wrapper.append(label, toggle);
    } else {
      const color = normalizeHexColor(value);
      if (color) {
      const colorControl = document.createElement('div');
      colorControl.className = 'color-control';
      const picker = document.createElement('input');
      picker.type = 'color';
      picker.value = color;
      picker.setAttribute('aria-label', `${copy.label}色块选择器`);
      const hexInput = document.createElement('input');
      hexInput.type = 'text';
      hexInput.inputMode = 'text';
      hexInput.autocapitalize = 'characters';
      hexInput.spellcheck = false;
      hexInput.maxLength = 7;
      hexInput.pattern = '#[0-9A-Fa-f]{6}';
      hexInput.value = color;
      hexInput.placeholder = '#RRGGBB';
      hexInput.dataset.group = groupName === '内容' ? 'content' : 'settings';
      hexInput.dataset.key = key;
      hexInput.addEventListener('input', () => setHexInputValidity(hexInput));
      hexInput.addEventListener('blur', () => applyHexInput(hexInput, picker));
      hexInput.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        applyHexInput(hexInput, picker);
      });
      picker.addEventListener('input', () => {
        const selectedColor = normalizeHexColor(picker.value);
        if (!selectedColor) return;
        hexInput.value = selectedColor;
        setHexInputValidity(hexInput);
        queueFieldEdit(hexInput, selectedColor);
      });
      colorControl.append(picker, hexInput);
        wrapper.append(label, colorControl);
      } else {
        const multiline = /(?:body|subtitle|description|address)/u.test(key) && String(value).length > 42;
        const input = document.createElement(multiline ? 'textarea' : 'input');
        if (!multiline) input.type = 'text';
        input.value = display.value;
        input.placeholder = display.placeholder;
        input.dataset.group = groupName === '内容' ? 'content' : 'settings';
        input.dataset.key = key;
        input.addEventListener('input', onFieldInput);
        wrapper.append(label, input);
      }
    }
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
  if (['collection.curtainPromotionCard', 'collection.curtainPromotionCardNoTitle'].includes(instance.componentKey)) {
    const importButton = document.createElement('button');
    importButton.type = 'button';
    importButton.className = 'button';
    importButton.textContent = 'shopify商品导入';
    importButton.addEventListener('click', () => importCurtainPromotionProduct(instance.instanceId));
    actions.append(importButton);
  }
  if (instance.componentKey === 'collection.saleGrid4') {
    for (let itemIndex = 0; itemIndex < 4; itemIndex += 1) {
      const importButton = document.createElement('button');
      importButton.type = 'button';
      importButton.className = 'button';
      importButton.textContent = `导入商品 ${itemIndex + 1}`;
      importButton.addEventListener('click', () => importSaleGrid4Product(instance.instanceId, itemIndex));
      actions.append(importButton);
    }
  }
  if (instance.componentKey === 'collection.saleGrid6WithTitle') {
    for (let itemIndex = 0; itemIndex < 6; itemIndex += 1) {
      const importButton = document.createElement('button');
      importButton.type = 'button';
      importButton.className = 'button';
      importButton.textContent = `导入商品 ${itemIndex + 1}`;
      importButton.addEventListener('click', () => importSaleGrid6WithTitleProduct(instance.instanceId, itemIndex));
      actions.append(importButton);
    }
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
  queueFieldEdit(event.currentTarget, event.currentTarget.value);
}

function setHexInputValidity(input) {
  const valid = Boolean(normalizeHexColor(input.value));
  input.classList.toggle('invalid', !valid);
  input.setCustomValidity(valid ? '' : '请输入完整的 #RRGGBB 色号。');
  return valid;
}

function applyHexInput(input, picker) {
  const color = normalizeHexColor(input.value);
  if (!color) {
    setHexInputValidity(input);
    return;
  }
  input.value = color;
  picker.value = color;
  setHexInputValidity(input);
  queueFieldEdit(input, color);
}

function queueFieldEdit(input, value) {
  const instance = selectedInstance();
  if (!instance) return;
  const group = input.dataset.group;
  if (instance[group][input.dataset.key] === value && state.pending.instanceId !== instance.instanceId) return;
  instance[group][input.dataset.key] = value;
  state.pending = appendPendingEdit(state.pending, { instanceId: instance.instanceId, group, key: input.dataset.key, value });
  window.clearTimeout(state.saveTimer);
  state.saveTimer = window.setTimeout(commitEdits, 320);
}

async function commitEdits() {
  window.clearTimeout(state.saveTimer);
  const { instanceId, patch, next } = consumePendingEdits(state.pending);
  state.pending = next;
  if (!instanceId) return;
  const instance = state.draft?.components.find((component) => component.instanceId === instanceId);
  if (!instance) return;
  if (!Object.keys(patch.content).length && !Object.keys(patch.settings).length) return;
  const fieldFocus = state.selectedId === instanceId ? captureFieldFocus() : null;
  try {
    const result = await api(`/api/drafts/${state.draft.id}/components/${instanceId}`, { method: 'PATCH', body: JSON.stringify(patch) });
    setDraft(result.draft, { fieldFocus });
    queuePreview();
  } catch (error) { window.alert(error.message); }
}

async function addComponent(componentKey) {
  if (!state.draft) await createDraft();
  await commitEdits();
  try {
    const result = await api(`/api/drafts/${state.draft.id}/components`, { method: 'POST', body: JSON.stringify({ componentKey }) });
    state.selectedId = result.draft.components.at(-1).instanceId;
    setDraft(result.draft);
    queuePreview();
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
  const source = window.prompt('输入 Freshine 活动页/Collection 链接，或直接输入 Shopify 后台 Collection handle');
  if (!source) return;
  const value = source.trim();
  const body = /^https:\/\//i.test(value) ? { shopifyUrl: value } : { collectionHandle: value };
  try {
    const result = await api(`/api/drafts/${state.draft.id}/components/${instanceId}/import-sale-grid`, {
      method: 'POST', body: JSON.stringify(body)
    });
    setDraft(result.draft);
    queuePreview();
  } catch (error) {
    window.alert(error.message);
  }
}

async function importCurtainPromotionProduct(instanceId) {
  const shopifyUrl = window.prompt('输入 Freshine 商品详情页链接（支持 /products/<handle> 或 /collections/<collection-handle>/products/<handle>）');
  if (!shopifyUrl) return;
  try {
    const result = await api(`/api/drafts/${state.draft.id}/components/${instanceId}/import-shopify-product`, {
      method: 'POST', body: JSON.stringify({ shopifyUrl: shopifyUrl.trim() })
    });
    setDraft(result.draft);
    queuePreview();
  } catch (error) {
    window.alert(error.message);
  }
}

async function importSaleGrid4Product(instanceId, itemIndex) {
  const shopifyUrl = window.prompt(`输入第 ${itemIndex + 1} 款 Freshine 商品详情页链接（支持 /products/<handle> 或 /collections/<collection-handle>/products/<handle>）`);
  if (!shopifyUrl) return;
  try {
    const result = await api(`/api/drafts/${state.draft.id}/components/${instanceId}/import-shopify-product/${itemIndex}`, {
      method: 'POST', body: JSON.stringify({ shopifyUrl: shopifyUrl.trim() })
    });
    setDraft(result.draft);
    queuePreview();
  } catch (error) {
    window.alert(error.message);
  }
}

async function importSaleGrid6WithTitleProduct(instanceId, itemIndex) {
  const shopifyUrl = window.prompt(`输入第 ${itemIndex + 1} 款 Freshine 商品详情页链接（支持 /products/<handle> 或 /collections/<collection-handle>/products/<handle>）`);
  if (!shopifyUrl) return;
  try {
    const result = await api(`/api/drafts/${state.draft.id}/components/${instanceId}/import-shopify-product/${itemIndex}`, {
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
  if (!state.draft?.components.length) { setTextMessage(previewStage, '从左侧添加组件后，预览会自动生成。'); return; }
  try {
    const result = await api(`/api/drafts/${state.draft.id}/preview`, { method: 'POST', body: '{}' });
    const frame = document.createElement('iframe');
    frame.src = result.previewUrl;
    frame.width = state.width;
    frame.height = 2600;
    frame.title = 'Campaign preview';
    frame.addEventListener('load', () => focusSelectedPreview({ behavior: 'auto' }), { once: true });
    previewStage.scrollTop = 0;
    previewStage.replaceChildren(frame);
  } catch (error) { setTextMessage(previewStage, `预览生成失败：${error.message}`); }
}

async function createDraft() {
  const result = await api('/api/drafts', { method: 'POST', body: JSON.stringify({ name: $('#campaign-name').value }) });
  state.selectedId = null;
  setDraft(result.draft);
  setTextMessage(previewStage, '从左侧添加组件后，预览会自动生成。');
  $('.workspace').hidden = false;
}

function finishTemplateName(value) {
  const resolveName = resolveTemplateName;
  resolveTemplateName = null;
  templateNameInput.value = '';
  if (templateSaveDialog.open) templateSaveDialog.close();
  resolveName?.(value);
}

function requestTemplateName() {
  templateNameInput.value = selectedTemplate()?.name ?? state.draft?.name ?? '';
  templateSaveDialog.showModal();
  templateNameInput.focus();
  templateNameInput.select();
  return new Promise((resolveName) => { resolveTemplateName = resolveName; });
}

async function saveCurrentTemplate() {
  if (!state.draft?.components.length) return;
  window.clearTimeout(state.saveTimer);
  await commitEdits();
  const name = (await requestTemplateName())?.trim();
  if (!name) return;
  let overwrite = false;
  while (true) {
    try {
      const result = await api('/api/templates', {
        method: 'POST', body: JSON.stringify({ name, draftId: state.draft.id, overwrite })
      });
      setTemplates(result.templates, result.template.id);
      templateStatus.textContent = overwrite ? `已更新模板：${result.template.name}` : `已保存模板：${result.template.name}`;
      return;
    } catch (error) {
      if (error.code !== 'template-name-conflict' || overwrite || !window.confirm(`模板“${name}”已存在，是否覆盖？`)) {
        if (error.code !== 'template-name-conflict') window.alert(error.message);
        return;
      }
      overwrite = true;
    }
  }
}

async function useSelectedTemplate() {
  const template = selectedTemplate();
  if (!template) return;
  if (state.draft?.components.length && !window.confirm(`将基于模板“${template.name}”新建草稿，当前草稿仍保留在本地会话中。是否继续？`)) return;
  try {
    const result = await api(`/api/templates/${template.id}/drafts`, { method: 'POST', body: '{}' });
    state.selectedId = result.draft.components[0]?.instanceId ?? null;
    $('#campaign-name').value = result.draft.name;
    setDraft(result.draft);
    $('.workspace').hidden = false;
    templateStatus.textContent = `已从模板新建草稿：${template.name}`;
    await renderPreview();
  } catch (error) { window.alert(error.message); }
}

async function deleteSelectedTemplate() {
  const template = selectedTemplate();
  if (!template || !window.confirm(`确定删除模板“${template.name}”？已由该模板创建的草稿和本地图片不会删除。`)) return;
  try {
    const result = await api(`/api/templates/${template.id}`, { method: 'DELETE' });
    setTemplates(result.templates, '');
    templateStatus.textContent = `已删除模板：${result.deleted.name}`;
  } catch (error) { window.alert(error.message); }
}

function finishOmnisendUpload(value) {
  const resolveUpload = resolveOmnisendUpload;
  resolveOmnisendUpload = null;
  omnisendCampaignNameInput.value = '';
  omnisendSubjectInput.value = '';
  omnisendPreheaderInput.value = '';
  omnisendApiKeyInput.value = '';
  showOmnisendApiKey.checked = false;
  omnisendApiKeyInput.type = 'password';
  if (omnisendUploadDialog.open) omnisendUploadDialog.close();
  resolveUpload?.(value);
}

function requestOmnisendUpload() {
  omnisendCampaignNameInput.value = state.draft.name;
  omnisendSubjectInput.value = '';
  omnisendPreheaderInput.value = '';
  omnisendApiKeyInput.value = '';
  showOmnisendApiKey.checked = false;
  omnisendApiKeyInput.type = 'password';
  omnisendUploadDialog.showModal();
  omnisendSubjectInput.focus();
  return new Promise((resolveUpload) => { resolveOmnisendUpload = resolveUpload; });
}

async function uploadOmnisendDraft() {
  if (!state.draft) return;
  window.clearTimeout(state.saveTimer);
  await commitEdits();
  const upload = await requestOmnisendUpload();
  if (!upload) return;
  try {
    const prepared = await api(`/api/drafts/${state.draft.id}/prepare-omnisend-draft`, {
      method: 'POST', body: JSON.stringify({ campaign: upload.campaign })
    });
    if (!prepared.ready) throw new Error('静态安全 HTML 准备失败');
    try {
      const uploaded = await api(`/api/drafts/${state.draft.id}/upload-omnisend-draft`, {
        method: 'POST', body: JSON.stringify({ apiKey: upload.apiKey })
      });
      window.alert(`已${uploaded.receipt.operation === 'updated' ? '更新' : '创建'} Omnisend Draft：${uploaded.receipt.campaignID}`);
    } finally {
      upload.apiKey = '';
      omnisendApiKeyInput.value = '';
    }
  } catch (error) { window.alert(error.message); }
}

function finishOmnisendHtmlExport(value) {
  const resolveExport = resolveOmnisendHtmlExport;
  resolveOmnisendHtmlExport = null;
  omnisendExportApiKeyInput.value = '';
  showOmnisendExportApiKey.checked = false;
  omnisendExportApiKeyInput.type = 'password';
  if (omnisendExportDialog.open) omnisendExportDialog.close();
  resolveExport?.(value);
}

function requestOmnisendHtmlExport() {
  omnisendExportApiKeyInput.value = '';
  showOmnisendExportApiKey.checked = false;
  omnisendExportApiKeyInput.type = 'password';
  omnisendExportDialog.showModal();
  omnisendExportApiKeyInput.focus();
  return new Promise((resolveExport) => { resolveOmnisendHtmlExport = resolveExport; });
}

function showHtmlCopyFallback(html) {
  omnisendHtmlCopyText.value = html;
  omnisendHtmlCopyFallback.showModal();
  omnisendHtmlCopyText.focus();
  omnisendHtmlCopyText.select();
}

function closeHtmlCopyFallback() {
  omnisendHtmlCopyText.value = '';
  if (omnisendHtmlCopyFallback.open) omnisendHtmlCopyFallback.close();
}

async function exportOmnisendHtml() {
  if (!state.draft) return;
  window.clearTimeout(state.saveTimer);
  await commitEdits();
  let apiKey = await requestOmnisendHtmlExport();
  if (!apiKey) return;
  let exported;
  try {
    exported = await api(`/api/drafts/${state.draft.id}/export-omnisend-html`, {
      method: 'POST', body: JSON.stringify({ apiKey })
    });
    await navigator.clipboard.writeText(exported.html);
    window.alert(`已上传 ${exported.uploadedImageIDs.length} 张本地图片，并将完整 Omnisend HTML 复制到剪切板。`);
  } catch (error) {
    if (exported?.html) {
      showHtmlCopyFallback(exported.html);
      return;
    }
    window.alert(error.message);
  } finally {
    apiKey = '';
    omnisendExportApiKeyInput.value = '';
  }
}

$('#new-campaign').addEventListener('click', createDraft);
templateSelect.addEventListener('change', () => {
  state.selectedTemplateId = templateSelect.value;
  renderTemplateOptions();
  templateStatus.textContent = selectedTemplate() ? `已选择模板：${selectedTemplate().name}` : '';
});
useTemplateButton.addEventListener('click', useSelectedTemplate);
saveTemplateButton.addEventListener('click', saveCurrentTemplate);
deleteTemplateButton.addEventListener('click', deleteSelectedTemplate);
submitTemplateSave.addEventListener('click', () => {
  const name = templateNameInput.value.trim();
  if (!name) {
    templateNameInput.setCustomValidity('请输入模板名称。');
    templateNameInput.reportValidity();
    return;
  }
  finishTemplateName(name);
});
cancelTemplateSave.addEventListener('click', () => finishTemplateName(null));
templateNameInput.addEventListener('input', () => templateNameInput.setCustomValidity(''));
templateNameInput.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter') return;
  event.preventDefault();
  submitTemplateSave.click();
});
templateSaveDialog.addEventListener('close', () => {
  if (resolveTemplateName) finishTemplateName(null);
});
exportOmnisendHtmlButton.addEventListener('click', exportOmnisendHtml);
uploadOmnisendDraftButton.addEventListener('click', uploadOmnisendDraft);
showOmnisendApiKey.addEventListener('change', () => { omnisendApiKeyInput.type = showOmnisendApiKey.checked ? 'text' : 'password'; });
submitOmnisendUpload.addEventListener('click', () => finishOmnisendUpload({
  campaign: { name: omnisendCampaignNameInput.value, subject: omnisendSubjectInput.value, preheader: omnisendPreheaderInput.value },
  apiKey: omnisendApiKeyInput.value
}));
cancelOmnisendUpload.addEventListener('click', () => finishOmnisendUpload(null));
omnisendUploadDialog.addEventListener('close', () => {
  if (resolveOmnisendUpload) finishOmnisendUpload(null);
});
showOmnisendExportApiKey.addEventListener('change', () => { omnisendExportApiKeyInput.type = showOmnisendExportApiKey.checked ? 'text' : 'password'; });
submitOmnisendExport.addEventListener('click', () => finishOmnisendHtmlExport(omnisendExportApiKeyInput.value));
cancelOmnisendExport.addEventListener('click', () => finishOmnisendHtmlExport(null));
omnisendExportDialog.addEventListener('close', () => {
  if (resolveOmnisendHtmlExport) finishOmnisendHtmlExport(null);
});
copyOmnisendHtmlManually.addEventListener('click', async () => {
  omnisendHtmlCopyText.select();
  try {
    await navigator.clipboard.writeText(omnisendHtmlCopyText.value);
    window.alert('完整 HTML 已复制到剪切板。');
  } catch {
    window.alert('请选择文本后使用系统复制快捷键。');
  }
});
closeOmnisendHtmlCopy.addEventListener('click', closeHtmlCopyFallback);
omnisendHtmlCopyFallback.addEventListener('close', () => { omnisendHtmlCopyText.value = ''; });
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

const [catalogResult, templatesResult] = await Promise.all([api('/api/catalog'), api('/api/templates')]);
state.catalog = catalogResult.components;
setTemplates(templatesResult.templates);
renderStructureOptions();
await createDraft();
