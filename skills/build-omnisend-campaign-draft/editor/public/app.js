import { createTextStyleControl } from './editor-text-styles.mjs';
import { createSaveQueue, groupEditorFields, searchCatalog } from './editor-workflow.mjs';
import { setupLinkInspector } from './editor-links.mjs';
import { editableFieldKeys, editorFieldCopy, editorInputDisplay, normalizeHexColor, previewComponentIndex, previewStageScrollTop, previewTargetIsCurrent, structuresForCatalog, styleKeysForStructure } from './editor-ui-contract.mjs';

const state = { catalog: [], templates: [], draft: null, selectedId: null, selectedTemplateId: '', selectedStructure: '', width: 600, previewTimer: null, saveTimer: null, previewFocusTimer: null, highlightTimer: null, catalogLimit: 6, openGroups: new Map() };

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

async function fetchApi(path, options = {}) {
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

let mutationTail = Promise.resolve();
let editorLocked = false;
function api(path, options = {}) {
  if (!options.method || options.method === 'GET') return fetchApi(path, options);
  const request = mutationTail.then(() => fetchApi(path, options));
  mutationTail = request.catch(() => {});
  return request;
}

const saveQueue = createSaveQueue({
  send: (instanceId, patch, draftId) => api(`/api/drafts/${draftId}/components/${instanceId}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  onSaved: (result) => {
    if (result.draft.id !== state.draft?.id) return;
    const fieldFocus = captureFieldFocus();
    setDraft(result.draft, { fieldFocus });
    queuePreview();
  },
  onStatus: (status, error) => {
    $('#save-status').textContent = status === 'error' ? `保存失败，修改已保留：${error.message}` : status === 'saving' ? '正在保存…' : status === 'pending' ? '有待保存的修改…' : '已保存到当前会话';
    $('#save-status').dataset.state = status;
    $('#retry-save').hidden = status !== 'error';
    updateOutputControls();
  }
});

function updateOutputControls() {
  const waiting = editorLocked || saveQueue.hasPending() || saveQueue.isSaving();
  exportOmnisendHtmlButton.disabled = waiting || !state.draft?.confirmed;
  uploadOmnisendDraftButton.disabled = waiting || !state.draft?.confirmed;
}

async function withEditorLock(action) {
  if (editorLocked) return;
  editorLocked = true;
  $('.workspace').inert = true;
  $('#editor-operation').textContent = '正在处理操作，请稍候…';
  for (const button of [$('#new-campaign'), $('#inspect-links'), useTemplateButton, saveTemplateButton, deleteTemplateButton]) button.disabled = true;
  updateOutputControls();
  try { return await action(); }
  finally {
    editorLocked = false;
    $('.workspace').inert = false;
    $('#editor-operation').textContent = '';
    $('#new-campaign').disabled = false;
    $('#inspect-links').disabled = false;
    saveTemplateButton.disabled = !state.draft?.components.length;
    renderTemplateOptions();
    updateOutputControls();
  }
}

function selectedInstance() {
  return state.draft?.components.find(({ instanceId }) => instanceId === state.selectedId) ?? null;
}

function catalogItem(componentKey) {
  return state.catalog.find((component) => component.componentKey === componentKey);
}

function captureFieldFocus() {
  const input = document.activeElement;
  if (!(input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement || input instanceof HTMLSelectElement) || !form.contains(input) || !input.dataset.group || !input.dataset.key) return null;
  return {
    group: input.dataset.group,
    key: input.dataset.key,
    styleProperty: input.dataset.styleProperty,
    editingValue: input.dataset.styleProperty ? input.value : undefined,
    selectionStart: input.selectionStart,
    selectionEnd: input.selectionEnd
  };
}

function restoreFieldFocus(focus) {
  if (!focus) return;
  const input = [...form.querySelectorAll('input, textarea, select')].find((candidate) => candidate.dataset.group === focus.group && candidate.dataset.key === focus.key && candidate.dataset.styleProperty === focus.styleProperty);
  if (!input) return;
  if (focus.editingValue !== undefined) {
    input.value = focus.editingValue;
    input.classList.toggle('invalid', !input.validity.valid);
  }
  input.focus();
  if (typeof focus.selectionStart !== 'number' || typeof focus.selectionEnd !== 'number') return;
  try {
    input.setSelectionRange(focus.selectionStart, focus.selectionEnd);
  } catch {
    // Color and file controls do not support a text selection range.
  }
}

function setDraft(draft, { fieldFocus = null } = {}) {
  draft = saveQueue.overlay(draft);
  state.draft = draft;
  if (state.selectedId && !draft.components.some(({ instanceId }) => instanceId === state.selectedId)) state.selectedId = null;
  saveTemplateButton.disabled = draft.components.length === 0;
  renderStructure();
  renderInspector();
  restoreFieldFocus(fieldFocus);
  updateOutputControls();
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
  addOption(structureSelect, { value: '', label: '全部分类' });
  for (const category of structuresForCatalog(state.catalog)) addOption(structureSelect, { value: category, label: category });
  structureSelect.value = state.selectedStructure;
  renderStyleOptions();
}

function renderStyleOptions() {
  const previouslySelected = styleSelect.value;
  styleSelect.replaceChildren();
  addOption(styleSelect, { value: '', label: '选择样式' });
  const matches = searchCatalog(state.catalog, state.selectedStructure, $('#component-search').value);
  for (const component of matches) addOption(styleSelect, { value: component.componentKey, label: `${component.name} · ${component.variant}` });
  if (matches.some(component => component.componentKey === previouslySelected)) styleSelect.value = previouslySelected;
  styleSelect.disabled = matches.length === 0;
  addSelectedComponent.disabled = !styleSelect.value;
  renderCatalogCards(matches);
}

function renderCatalogCards(matches) {
  const cards = $('#catalog-cards');
  cards.replaceChildren();
  if (!matches.length) { setTextMessage(cards, '没有匹配组件，试试其他关键词。'); }
  for (const component of matches.slice(0, state.catalogLimit)) {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'catalog-card';
    button.dataset.componentKey = component.componentKey;
    button.classList.toggle('selected', styleSelect.value === component.componentKey);
    button.setAttribute('aria-label', `选择组件 ${component.name}`);
    const thumbnail = document.createElement('div'); thumbnail.className = 'catalog-thumbnail';
    const frame = document.createElement('iframe');
    frame.src = component.thumbnailUrl;
    frame.title = `${component.name} 默认缩略图`;
    frame.loading = 'lazy'; frame.tabIndex = -1;
    frame.setAttribute('sandbox', '');
    thumbnail.append(frame);
    const name = document.createElement('strong'); name.textContent = component.name;
    const category = document.createElement('small'); category.textContent = component.category;
    button.append(thumbnail, name, category);
    button.addEventListener('click', () => {
      styleSelect.value = component.componentKey;
      addSelectedComponent.disabled = false;
      cards.querySelectorAll('.catalog-card').forEach(card => card.classList.toggle('selected', card === button));
    });
    cards.append(button);
  }
  $('#catalog-more').hidden = matches.length <= state.catalogLimit;
  $('#catalog-more').textContent = `显示更多（${Math.min(state.catalogLimit, matches.length)} / ${matches.length}）`;
}

async function selectComponent(instanceId) {
  window.clearTimeout(state.saveTimer);
  if (!await commitEdits()) return;
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

function editableFieldset(componentKey, values, schema, groupName, groupKey, allowedKeys) {
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
    const fieldFont = catalogItem(componentKey).textFields?.[key]?.defaults.fontFamily;
    help.textContent = groupKey === 'content' && fieldFont ? copy.help.replace(/Lora|Montserrat|Noto Sans SC|Arial/gu, fieldFont) : copy.help;
    label.append(title, help);
    const display = editorInputDisplay(value, metadata);
    if (display.control === 'checkbox') {
      const toggle = document.createElement('label');
      toggle.className = 'toggle-control';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = display.checked;
      input.dataset.group = groupKey;
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
      hexInput.dataset.group = groupKey;
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
        input.dataset.group = groupKey;
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
    const instance = selectedInstance();
    const textMetadata = catalogItem(componentKey).textFields?.[key];
    if (groupKey === 'content' && textMetadata) wrapper.append(createTextStyleControl({
      instanceId: instance.instanceId, fieldKey: key, fieldLabel: copy.label, metadata: textMetadata, settings: instance.settings,
      getValue: () => state.draft.components.find(item => item.instanceId === instance.instanceId)?.textStyles?.[key] ?? {},
      onChange: value => {
        enqueueEdit(instance.instanceId, 'textStyles', key, value);
        window.clearTimeout(state.saveTimer);
        if (!saveQueue.hasFailed()) state.saveTimer = window.setTimeout(() => { void commitEdits(); }, 320);
        if (!Object.keys(value).length) renderInspector();
      }
    }));
    fieldset.append(wrapper);
  }
  return fieldset;
}

function editableFields(componentKey, values, schema, groupName, groupKey, allowedKeys) {
  if (groupKey !== 'content' || !allowedKeys.some(key => /^saleItems\[|^products\[|^items\[/u.test(key))) return editableFieldset(componentKey, values, schema, groupName, groupKey, allowedKeys);
  const container = document.createElement('div');
  container.className = 'product-field-groups';
  const instanceId = selectedInstance().instanceId;
  const expanded = state.openGroups.get(instanceId) ?? new Set(['intro', 'product-0']);
  state.openGroups.set(instanceId, expanded);
  for (const group of groupEditorFields(allowedKeys, groupKey)) {
    const details = document.createElement('details');
    details.className = 'product-field-group'; details.dataset.groupId = group.id;
    details.open = expanded.has(group.id);
    details.addEventListener('toggle', () => { if (details.open) expanded.add(group.id); else expanded.delete(group.id); });
    const summary = document.createElement('summary');
    const productName = group.itemIndex === undefined ? '' : values[`saleItems[${group.itemIndex}].name`] ?? '';
    summary.textContent = productName ? `${group.label} · ${productName}` : group.label;
    details.append(summary);
    const importButton = actions.querySelector(`[data-item-index="${group.itemIndex}"]`);
    if (importButton) details.append(importButton);
    const fields = editableFieldset(componentKey, values, schema, group.label, groupKey, group.keys);
    if (fields) details.append(fields);
    container.append(details);
  }
  return container;
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
    for (let itemIndex = 0; itemIndex < 6; itemIndex += 1) {
      const productImportButton = document.createElement('button');
      productImportButton.type = 'button';
      productImportButton.className = 'button';
      productImportButton.textContent = `导入商品 ${itemIndex + 1}`;
      productImportButton.addEventListener('click', () => importSaleGrid6Product(instance.instanceId, itemIndex));
      actions.append(productImportButton);
    }
  }
  if (['collection.curtainPromotionCard', 'collection.curtainPromotionCardNoTitle'].includes(instance.componentKey)) {
    const importButton = document.createElement('button');
    importButton.type = 'button';
    importButton.className = 'button';
    importButton.textContent = 'shopify商品导入';
    importButton.addEventListener('click', () => importCurtainPromotionProduct(instance.instanceId));
    actions.append(importButton);
  }
  if (['collection.saleGrid4', 'collection.saleGrid4WithTitle', 'collection.sceneSaleGrid4WithTitle', 'collection.productGrid4NoSidePadding', 'collection.saleGrid4DetailWithTitle', 'collection.saleGrid6DetailWithTitle', 'collection.sceneSaleGrid6PriceWithTitle'].includes(instance.componentKey)) {
    const isDetailSix = ['collection.saleGrid6DetailWithTitle', 'collection.sceneSaleGrid6PriceWithTitle'].includes(instance.componentKey);
    for (let itemIndex = 0; itemIndex < (isDetailSix ? 6 : 4); itemIndex += 1) {
      const importButton = document.createElement('button');
      importButton.type = 'button';
      importButton.className = 'button';
      importButton.textContent = `导入商品 ${itemIndex + 1}`;
      importButton.dataset.itemIndex = String(itemIndex);
      importButton.addEventListener('click', () => isDetailSix
        ? importDetailSixProduct(instance.instanceId, itemIndex)
        : importSaleGrid4Product(instance.instanceId, itemIndex));
      actions.append(importButton);
    }
  }
  if (instance.componentKey === 'collection.saleGrid6WithTitle') {
    for (let itemIndex = 0; itemIndex < 6; itemIndex += 1) {
      const importButton = document.createElement('button');
      importButton.type = 'button';
      importButton.className = 'button';
      importButton.textContent = `导入商品 ${itemIndex + 1}`;
      importButton.dataset.itemIndex = String(itemIndex);
      importButton.addEventListener('click', () => importSaleGrid6Product(instance.instanceId, itemIndex));
      actions.append(importButton);
    }
  }
  confirmState.hidden = false;
  confirmState.className = `confirm-state${instance.confirmed ? ' ready' : ''}`;
  confirmState.textContent = instance.confirmed ? '已确认' : '待确认';
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

function enqueueEdit(instanceId, group, key, value) {
  const instance = state.draft?.components.find(component => component.instanceId === instanceId);
  if (!instance) return;
  instance[group] ??= {};
  instance[group][key] = value;
  instance.confirmed = false;
  state.draft.confirmed = false;
  saveQueue.enqueue(instanceId, group, key, value, state.draft.id);
  confirmState.textContent = '待确认';
  confirmState.className = 'confirm-state';
  const confirmButton = actions.querySelector('button');
  if (confirmButton) { confirmButton.disabled = false; confirmButton.textContent = '确认此组件'; }
  renderStructure();
  updateOutputControls();
}

function queueFieldEdit(input, value) {
  const instance = selectedInstance();
  if (!instance || instance[input.dataset.group][input.dataset.key] === value) return;
  enqueueEdit(instance.instanceId, input.dataset.group, input.dataset.key, value);
  window.clearTimeout(state.saveTimer);
  if (!saveQueue.hasFailed()) state.saveTimer = window.setTimeout(() => { void commitEdits(); }, 320);
}

async function commitEdits() {
  window.clearTimeout(state.saveTimer);
  try { await saveQueue.flush(); return true; }
  catch { return false; }
}

async function addComponent(componentKey) {
  return withEditorLock(async () => {
    if (!state.draft) await createDraft();
    if (!await commitEdits()) return;
    try {
      const result = await api(`/api/drafts/${state.draft.id}/components`, { method: 'POST', body: JSON.stringify({ componentKey }) });
      state.selectedId = result.draft.components.at(-1).instanceId;
      setDraft(result.draft);
      queuePreview();
    } catch (error) { window.alert(error.message); }
  });
}

async function reorder(fromIndex, toIndex) {
  return withEditorLock(async () => {
    if (!await commitEdits()) return;
    if (!state.draft || toIndex < 0 || toIndex >= state.draft.components.length || fromIndex === toIndex) return;
    try {
      const result = await api(`/api/drafts/${state.draft.id}/reorder`, { method: 'POST', body: JSON.stringify({ fromIndex, toIndex }) });
      setDraft(result.draft); queuePreview();
    } catch (error) { window.alert(error.message); }
  });
}

async function removeComponent(instanceId) {
  return withEditorLock(async () => {
    if (!await commitEdits()) return;
    if (!state.draft) return;
    if (!window.confirm('删除此组件？')) return;
    try {
      const result = await api(`/api/drafts/${state.draft.id}/components/${instanceId}`, { method: 'DELETE' });
      setDraft(result.draft); queuePreview();
    } catch (error) { window.alert(error.message); }
  });
}

async function confirmComponent(instanceId) {
  return withEditorLock(async () => {
    if (!await commitEdits()) return;
    if (!state.draft) return;
    try {
      const result = await api(`/api/drafts/${state.draft.id}/components/${instanceId}/confirm`, { method: 'POST', body: '{}' });
      setDraft(result.draft);
    } catch (error) { window.alert(error.message); }
  });
}

async function importSaleGrid(instanceId) {
  return withEditorLock(async () => {
    if (!await commitEdits()) return;
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
  });
}

async function importCurtainPromotionProduct(instanceId) {
  return withEditorLock(async () => {
    if (!await commitEdits()) return;
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
  });
}

function importDetailSixProduct(instanceId, itemIndex) {
  const dialog = document.createElement('dialog');
  dialog.className = 'upload-dialog';
  dialog.setAttribute('aria-label', `导入商品 ${itemIndex + 1}`);
  const importForm = document.createElement('form');
  importForm.className = 'upload-dialog-form';
  const title = document.createElement('h2');
  title.textContent = `导入商品 ${itemIndex + 1}`;
  const label = document.createElement('label');
  label.textContent = 'Freshine 商品详情页链接';
  const input = document.createElement('input');
  input.type = 'text';
  input.required = true;
  input.placeholder = 'https://freshinelife.com/products/...';
  label.append(input);
  const status = document.createElement('p');
  status.className = 'key-help';
  status.setAttribute('role', 'status');
  status.textContent = '仅更新当前商品；支持 /products/ 和 /collections/.../products/ 链接。';
  const buttons = document.createElement('div');
  buttons.className = 'upload-dialog-actions';
  const cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.className = 'button';
  cancel.textContent = '取消';
  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'button';
  submit.textContent = '导入';
  let importing = false;
  cancel.addEventListener('click', () => dialog.close());
  dialog.addEventListener('cancel', (event) => { if (importing) event.preventDefault(); });
  dialog.addEventListener('close', () => dialog.remove(), { once: true });
  importForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (importing || !input.value.trim()) return;
    importing = true;
    submit.disabled = true;
    cancel.disabled = true;
    status.textContent = '正在读取 Shopify 商品…';
    try {
      if (!await commitEdits()) return;
      await withEditorLock(async () => {
        const result = await api(`/api/drafts/${state.draft.id}/components/${instanceId}/import-shopify-product/${itemIndex}`, {
          method: 'POST', body: JSON.stringify({ shopifyUrl: input.value.trim() })
        });
        setDraft(result.draft);
        queuePreview();
        dialog.close();
      });
    } catch (error) {
      status.textContent = error.message;
    } finally {
      importing = false;
      submit.disabled = false;
      cancel.disabled = false;
    }
  });
  buttons.append(cancel, submit);
  importForm.append(title, label, status, buttons);
  dialog.append(importForm);
  document.body.append(dialog);
  dialog.showModal();
  input.focus();
}

async function importSaleGrid4Product(instanceId, itemIndex) {
  return withEditorLock(async () => {
    if (!await commitEdits()) return;
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
  });
}

async function importSaleGrid6Product(instanceId, itemIndex) {
  return withEditorLock(async () => {
    if (!await commitEdits()) return;
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
  });
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
  return withEditorLock(async () => {
    if (!await commitEdits()) return;
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
  });
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
  return withEditorLock(async () => {
    if (state.draft && !await commitEdits()) return;
    const result = await api('/api/drafts', { method: 'POST', body: JSON.stringify({ name: $('#campaign-name').value }) });
    state.selectedId = null;
    setDraft(result.draft);
    setTextMessage(previewStage, '从左侧添加组件后，预览会自动生成。');
    $('.workspace').hidden = false;
  });
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
  return withEditorLock(async () => {
    if (!state.draft?.components.length) return;
    window.clearTimeout(state.saveTimer);
    if (!await commitEdits()) return;
    const name = (await requestTemplateName())?.trim();
    if (!name) return;
    let overwrite = false;
    while (true) {
      try {
        const result = await api('/api/templates', {
          method: 'POST', body: JSON.stringify({ name, draftId: state.draft.id, overwrite })
        });
        setTemplates(result.templates, result.template.id);
        templateStatus.textContent = [overwrite ? `已更新模板：${result.template.name}` : `已保存模板：${result.template.name}`, ...(result.warnings ?? []).map(w => w.message)].join(' ');
        return;
      } catch (error) {
        if (error.code !== 'template-name-conflict' || overwrite || !window.confirm(`模板“${name}”已存在，是否覆盖？`)) {
          if (error.code !== 'template-name-conflict') window.alert(error.message);
          return;
        }
        overwrite = true;
      }
    }
  });
}

async function useSelectedTemplate() {
  return withEditorLock(async () => {
    if (!await commitEdits()) return;
    const template = selectedTemplate();
    if (!template) return;
    if (state.draft?.components.length && !window.confirm(`将基于模板“${template.name}”新建草稿，当前草稿仍保留在本地会话中。是否继续？`)) return;
    try {
      const result = await api(`/api/templates/${template.id}/drafts`, { method: 'POST', body: '{}' });
      state.selectedId = result.draft.components[0]?.instanceId ?? null;
      $('#campaign-name').value = result.draft.name;
      setDraft(result.draft);
      $('.workspace').hidden = false;
      templateStatus.textContent = [`已从模板新建草稿：${template.name}`, ...(result.warnings ?? []).map(w => w.message)].join(' ');
      await renderPreview();
    } catch (error) { window.alert(error.message); }
  });
}

async function deleteSelectedTemplate() {
  return withEditorLock(async () => {
    const template = selectedTemplate();
    if (!template || !window.confirm(`确定删除模板“${template.name}”？已由该模板创建的草稿和本地图片不会删除。`)) return;
    try {
      const result = await api(`/api/templates/${template.id}`, { method: 'DELETE' });
      setTemplates(result.templates, '');
      templateStatus.textContent = [`已删除模板：${result.deleted.name}`, ...(result.warnings ?? []).map(w => w.message)].join(' ');
    } catch (error) { window.alert(error.message); }
  });
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
  return withEditorLock(async () => {
    if (!state.draft) return;
    window.clearTimeout(state.saveTimer);
    if (!await commitEdits()) return;
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
  });
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
  return withEditorLock(async () => {
    if (!state.draft) return;
    window.clearTimeout(state.saveTimer);
    if (!await commitEdits()) return;
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
  });
}

$('#new-campaign').addEventListener('click', () => { void createDraft().catch(error => window.alert(error.message)); });
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
  state.catalogLimit = 6;
  renderStyleOptions();
});
$('#component-search').addEventListener('input', () => { state.catalogLimit = 6; renderStyleOptions(); });
$('#catalog-more').addEventListener('click', () => { state.catalogLimit += 6; renderStyleOptions(); });
$('#retry-save').addEventListener('click', () => { void commitEdits(); });
window.addEventListener('beforeunload', event => { if (saveQueue.hasPending()) { event.preventDefault(); event.returnValue = ''; } });
setupLinkInspector({ api, getDraft: () => state.draft, commitEdits, enqueue: enqueueEdit, focusField: async (instanceId, key) => {
  await selectComponent(instanceId);
  const input = [...form.querySelectorAll('input, textarea, select')].find(field => field.dataset.key === key);
  if (input) { const group = input.closest('details'); if (group) group.open = true; input.focus(); input.scrollIntoView({ block: 'center' }); }
} });
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
