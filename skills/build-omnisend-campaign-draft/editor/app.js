const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const DEFAULT_CANVAS = {
  backgroundColor: '#FBFAF8',
  outerBackgroundColor: '#FFFFFF',
  contentWidth: 600,
  mobileTargetWidth: 375,
  verticalPadding: 0
};
const PREVIEW_FIXTURE_ASSET_PATHS = {
  'asset://hero-logo-white': 'assets/default-logo-white.png'
};

const elements = {
  componentList: document.querySelector('[data-editor-components]'),
  componentFields: document.querySelector('[data-component-fields]'),
  componentTitle: document.querySelector('[data-component-title]'),
  componentDescription: document.querySelector('[data-component-description]'),
  confirmation: document.querySelector('[data-final-confirmation]'),
  confirmationStatus: document.querySelector('[data-confirmation-status]'),
  imagePicker: document.querySelector('[data-local-image-picker]'),
  previewFrames: document.querySelectorAll('[data-editor-preview]'),
  refreshPreview: document.querySelector('[data-refresh-preview]'),
  slug: document.querySelector('#draft-slug'),
  status: document.querySelector('[data-editor-status]'),
  uploadDraft: document.querySelector('[data-upload-draft]'),
  uploadReceipt: document.querySelector('[data-upload-receipt]')
};

const editor = {
  bootstrap: null,
  definitions: new Map(),
  selectedIndex: 0,
  saveTimer: null,
  lastPreviewHtml: null,
  previewVersion: 0,
  confirmedStaticHtmlSha256: null
};

window.editorState = {
  slug: 'campaign-draft',
  campaign: { canvas: { ...DEFAULT_CANVAS }, assets: {} },
  components: [],
  finalConfirmation: null
};
elements.confirmation.disabled = true;
elements.uploadDraft.disabled = true;

function setStatus(message, state = 'ready') {
  elements.status.textContent = message;
  elements.status.dataset.state = state;
}

function isValidSlug(value) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

function cloneValues(source) {
  return Object.fromEntries(Object.entries(source ?? {}).map(([key, value]) => [key, value]));
}

function componentDirectory(component) {
  return component.demoUrl.replace(/\/[^/]+$/, '');
}

async function seedFixtureAssets(components) {
  for (const [index, component] of components.entries()) {
    const draftComponent = window.editorState.components[index];
    for (const [key, value] of Object.entries(draftComponent.content)) {
      const assetPath = PREVIEW_FIXTURE_ASSET_PATHS[value];
      if (!assetPath) continue;
      const source = await fetch(`${componentDirectory(component)}/${assetPath}`);
      if (!source.ok) throw new Error(`无法读取本地组件资源（${source.status}）。`);
      const bytes = await source.blob();
      const response = await fetch(`/api/drafts/${encodeURIComponent(window.editorState.slug)}/assets`, {
        method: 'POST',
        headers: { 'Content-Type': bytes.type, 'X-Filename': assetPath.split('/').pop() },
        body: bytes
      });
      if (!response.ok) throw new Error((await response.json()).error ?? '本地组件资源无法保存。');
      const asset = await response.json();
      window.editorState.campaign.assets[asset.assetId] = { path: asset.localPath, name: assetPath.split('/').pop() };
      draftComponent.content[key] = `asset://${asset.assetId}`;
    }
  }
}

async function readJson(url) {
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`无法加载本地组件数据（${response.status}）`);
  return response.json();
}

async function loadComponentDefinition(component) {
  const directory = componentDirectory(component);
  const [contentSchema, settingsSchema, fixture, defaults] = await Promise.all([
    readJson(`${directory}/content.schema.v1.json`),
    readJson(`${directory}/settings.schema.v1.json`),
    readJson(`${directory}/content.fixture.v1.json`),
    readJson(`${directory}/settings.defaults.v1.json`)
  ]);
  return { contentSchema, settingsSchema, fixture, defaults, directory: directory.replace(/^\/components\//, '') };
}

async function initialise() {
  try {
    setStatus('正在读取本地 Campaign 配置…');
    editor.bootstrap = await readJson('/api/bootstrap');
    const components = editor.bootstrap.components;
    const definitions = await Promise.all(components.map(loadComponentDefinition));
    definitions.forEach((definition, index) => editor.definitions.set(components[index].componentKey, definition));

    window.editorState.components = components.map((component) => {
      const definition = editor.definitions.get(component.componentKey);
      return {
        name: component.name,
        directory: definition.directory,
        componentKey: component.componentKey,
        content: cloneValues(definition.fixture.values),
        settings: cloneValues(definition.defaults.values)
      };
    });

    await seedFixtureAssets(components);

    renderComponentList();
    renderFields();
    setStatus('本地组件已加载。更改字段后会自动保存并刷新预览。');
    queueSaveAndPreview();
  } catch (error) {
    setStatus(error.message, 'error');
  }
}

function currentComponent() {
  return window.editorState.components[editor.selectedIndex];
}

function currentDefinition() {
  return editor.definitions.get(currentComponent()?.componentKey);
}

function renderComponentList() {
  elements.componentList.replaceChildren(...window.editorState.components.map((component, index) => {
    const button = document.createElement('button');
    button.className = 'component-button';
    button.type = 'button';
    button.textContent = `${index + 1}. ${component.name}`;
    button.setAttribute('aria-current', String(index === editor.selectedIndex));
    button.addEventListener('click', () => {
      editor.selectedIndex = index;
      renderComponentList();
      renderFields();
    });
    return button;
  }));
}

function fieldControl({ group, key, value, property, collection }) {
  const label = document.createElement('label');
  const id = `field-${collection}-${key.replace(/[^a-z0-9]+/gi, '-')}`;
  label.htmlFor = id;
  label.textContent = key;

  const input = document.createElement('input');
  input.id = id;
  input.name = key;
  input.type = property.type === 'url' ? 'url' : 'text';
  input.value = value ?? '';
  input.required = Boolean(property.required);
  input.autocomplete = 'off';
  input.addEventListener('input', () => {
    currentComponent()[collection][key] = input.value;
    invalidateConfirmation();
    queueSaveAndPreview();
  });

  group.append(label, input);
  const help = document.createElement('p');
  help.className = 'schema-help';
  help.textContent = property.required ? '必填字段' : '可选字段';
  group.append(help);
}

function renderFields() {
  const component = currentComponent();
  const definition = currentDefinition();
  if (!component || !definition) return;
  elements.componentTitle.textContent = component.name;
  elements.componentDescription.textContent = `${component.componentKey} · 由本地 Schema 定义的字段`;
  const fields = [];
  for (const [key, property] of Object.entries(definition.contentSchema.properties)) {
    const group = document.createElement('div');
    group.className = 'field-group';
    fieldControl({ group, key, value: component.content[key], property, collection: 'content' });
    fields.push(group);
  }
  for (const [key, property] of Object.entries(definition.settingsSchema.properties)) {
    const group = document.createElement('div');
    group.className = 'field-group';
    fieldControl({ group, key, value: component.settings[key], property, collection: 'settings' });
    fields.push(group);
  }
  elements.componentFields.replaceChildren(...fields);
}

function invalidateConfirmation() {
  editor.previewVersion += 1;
  editor.lastPreviewHtml = null;
  editor.confirmedStaticHtmlSha256 = null;
  elements.confirmation.disabled = true;
  elements.uploadDraft.disabled = true;
  window.editorState.finalConfirmation = null;
  elements.confirmation.checked = false;
  elements.uploadReceipt.textContent = '确认前不可上传。API Key 只会在启动编辑器的终端内询问。';
  elements.confirmationStatus.textContent = '字段已更改，请在新预览生成后重新确认。';
}

function queueSaveAndPreview() {
  clearTimeout(editor.saveTimer);
  editor.saveTimer = window.setTimeout(() => saveAndPreview(), 450);
}

async function saveState() {
  if (!isValidSlug(window.editorState.slug)) throw new Error('草稿名称只能使用小写字母、数字和连字符。');
  const response = await fetch(`/api/drafts/${encodeURIComponent(window.editorState.slug)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ state: window.editorState })
  });
  if (!response.ok) throw new Error((await response.json()).error ?? '本地草稿无法保存。');
}

async function saveAndPreview() {
  const previewVersion = editor.previewVersion;
  try {
    setStatus('正在保存本地草稿并生成预览…');
    await saveState();
    const response = await fetch(`/api/drafts/${encodeURIComponent(window.editorState.slug)}/preview`, { method: 'POST' });
    if (!response.ok) throw new Error((await response.json()).error ?? '本地预览无法生成。');
    const { previewUrl } = await response.json();
    const cacheBustedPreview = `${previewUrl}?v=${Date.now()}`;
    const previewResponse = await fetch(cacheBustedPreview);
    if (!previewResponse.ok) throw new Error('无法读取生成的本地预览。');
    const previewHtml = await previewResponse.text();
    if (previewVersion !== editor.previewVersion) return;
    elements.previewFrames.forEach((frame) => { frame.src = cacheBustedPreview; });
    editor.lastPreviewHtml = previewHtml;
    elements.confirmation.disabled = false;
    elements.confirmationStatus.textContent = '本地预览已更新。勾选后，服务器会另行生成并哈希静态 HTML。';
    setStatus('本地预览已更新。');
  } catch (error) {
    if (previewVersion !== editor.previewVersion) return;
    editor.lastPreviewHtml = null;
    elements.confirmation.disabled = true;
    elements.uploadDraft.disabled = true;
    elements.confirmation.checked = false;
    setStatus(error.message, 'error');
  }
}

async function confirmStaticHtml() {
  if (!elements.confirmation.checked) {
    invalidateConfirmation();
    try { await saveState(); } catch (error) { setStatus(error.message, 'error'); }
    return;
  }
  try {
    elements.confirmation.disabled = true;
    elements.uploadDraft.disabled = true;
    setStatus('正在由服务器生成最终静态 HTML 并计算内容哈希…');
    const response = await fetch(`/api/drafts/${encodeURIComponent(window.editorState.slug)}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmed: true })
    });
    if (!response.ok) throw new Error((await response.json()).error ?? '最终静态 HTML 无法确认。');
    const { confirmedStaticHtmlSha256 } = await response.json();
    editor.confirmedStaticHtmlSha256 = confirmedStaticHtmlSha256;
    window.editorState.finalConfirmation = { status: 'confirmed', confirmedStaticHtmlSha256 };
    elements.confirmationStatus.textContent = `已确认静态 HTML：${confirmedStaticHtmlSha256}`;
    elements.uploadReceipt.textContent = '可上传 Omnisend Draft；API Key 将在启动编辑器的终端内询问。';
    elements.uploadDraft.disabled = false;
    setStatus('最终静态 HTML 已确认，可上传 Omnisend 草稿。');
  } catch (error) {
    editor.confirmedStaticHtmlSha256 = null;
    window.editorState.finalConfirmation = null;
    elements.confirmation.checked = false;
    elements.uploadDraft.disabled = true;
    setStatus(error.message, 'error');
  } finally {
    elements.confirmation.disabled = editor.lastPreviewHtml === null;
  }
}

async function uploadDraft() {
  if (!editor.confirmedStaticHtmlSha256) return;
  try {
    elements.uploadDraft.disabled = true;
    elements.uploadReceipt.textContent = '请在启动编辑器的终端中输入 Omnisend API Key…';
    setStatus('等待终端中的 API Key，并执行 Draft-only 上传与回读验证…');
    const response = await fetch(`/api/drafts/${encodeURIComponent(window.editorState.slug)}/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmedStaticHtmlSha256: editor.confirmedStaticHtmlSha256 })
    });
    if (!response.ok) throw new Error((await response.json()).error ?? 'Omnisend 草稿上传失败。');
    const receipt = await response.json();
    elements.uploadReceipt.textContent = `Draft 回执：Campaign ${receipt.campaignID} · Content ${receipt.contentID} · status ${receipt.status}`;
    setStatus('Omnisend 草稿已上传并完成 Draft 回读验证。');
  } catch (error) {
    elements.uploadReceipt.textContent = 'Draft 上传未完成；本地项目草稿已保留。';
    elements.uploadDraft.disabled = false;
    setStatus(error.message, 'error');
  }
}

async function uploadLocalImage() {
  const file = elements.imagePicker.files?.[0];
  if (!file) return;
  if (!IMAGE_TYPES.has(file.type) || file.size > MAX_IMAGE_BYTES) {
    setStatus('请选择不超过 5 MB 的 JPEG、PNG、GIF 或 WebP 图片。', 'error');
    elements.imagePicker.value = '';
    return;
  }
  const imageField = Object.entries(currentDefinition().contentSchema.properties)
    .find(([, property]) => property.role === 'image-source' || property.role === 'background-image-source');
  if (!imageField) {
    setStatus('当前组件没有可替换的图片字段。', 'error');
    elements.imagePicker.value = '';
    return;
  }
  try {
    setStatus('正在保存本地图片…');
    const response = await fetch(`/api/drafts/${encodeURIComponent(window.editorState.slug)}/assets`, {
      method: 'POST',
      headers: { 'Content-Type': file.type, 'X-Filename': file.name },
      body: file
    });
    if (!response.ok) throw new Error((await response.json()).error ?? '本地图片无法保存。');
    const asset = await response.json();
    window.editorState.campaign.assets[asset.assetId] = { path: asset.localPath, name: file.name };
    currentComponent().content[imageField[0]] = `asset://${asset.assetId}`;
    invalidateConfirmation();
    renderFields();
    queueSaveAndPreview();
  } catch (error) {
    setStatus(error.message, 'error');
  } finally {
    elements.imagePicker.value = '';
  }
}

elements.slug.addEventListener('input', () => {
  window.editorState.slug = elements.slug.value.trim();
  invalidateConfirmation();
  queueSaveAndPreview();
});
elements.refreshPreview.addEventListener('click', () => {
  invalidateConfirmation();
  saveAndPreview();
});
elements.imagePicker.addEventListener('change', uploadLocalImage);
elements.confirmation.addEventListener('change', confirmStaticHtml);
elements.uploadDraft.addEventListener('click', uploadDraft);

initialise();
