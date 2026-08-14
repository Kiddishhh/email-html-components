import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';

const compositionPath = process.argv[2];
if (!compositionPath) throw new Error('Composition path is required');
const composition = readJson(compositionPath);
const previewLocalAssets = process.argv.includes('--preview-local-assets');
const deferLocalAssets = process.argv.includes('--defer-local-assets');
if (previewLocalAssets && deferLocalAssets) throw new Error('choose either --preview-local-assets or --defer-local-assets');
const workspaceRoot = process.cwd();
const forbiddenTags = /<\/?(?:!doctype|html|head|body|link|style|script|div|iframe|font|video|audio|object|embed|form|input|button|canvas|svg)\b/i;
const forbiddenCss = /(?:box-shadow|display\s*:\s*(?:flex|grid)|position\s*:\s*(?:absolute|fixed|sticky)|@media|@import|@font-face|--[\w-]+\s*:)/i;
const allowedCssProperties = new Set(['background-color', 'background-position', 'background-repeat', 'background-size', 'border', 'border-collapse', 'border-radius', 'color', 'display', 'font-family', 'font-size', 'font-weight', 'height', 'line-height', 'margin', 'max-height', 'max-width', 'min-height', 'min-width', 'object-fit', 'outline', 'padding', 'text-align', 'text-decoration', 'vertical-align', 'width']);
const responsiveStyleComponentKey = 'product.sampleStyle1';

function readJson(path) { return JSON.parse(readFileSync(path, 'utf8')); }
function escapeText(value) { return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;'); }
function escapeAttribute(value) { return escapeText(value).replaceAll('"', '&quot;'); }
function write(path, value) { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, value, 'utf8'); }
function validUrl(value) { return /^(https:|mailto:|tel:)/.test(value); }
function validDeclaredProtocolUrl(value, protocol) {
  if (typeof protocol !== 'string' || !protocol) return false;
  try {
    const url = new URL(value);
    return url.protocol === `${protocol}:` && (protocol !== 'https' || Boolean(url.hostname));
  } catch {
    return false;
  }
}

function validateExactKeys(value, allowed, scope) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${scope} must be an object`);
  const missing = allowed.filter((key) => !(key in value));
  const unknown = Object.keys(value).filter((key) => !allowed.includes(key));
  if (missing.length) throw new Error(`${scope}: missing keys: ${missing.join(', ')}`);
  if (unknown.length) throw new Error(`${scope}: unknown keys: ${unknown.join(', ')}`);
}

function validateComposition(value) {
  const allowedKeys = ['schemaVersion', 'canvas', 'output', 'previewOutput', 'assets', 'components'];
  const unknown = Object.keys(value).filter((key) => !allowedKeys.includes(key));
  if (unknown.length) throw new Error(`unknown composition keys: ${unknown.join(', ')}`);
  if (value.schemaVersion !== 1) throw new Error('composition.schemaVersion must be 1');
  if (typeof value.output !== 'string' || !value.output) throw new Error('composition.output is required');
  if (typeof value.previewOutput !== 'string' || !value.previewOutput) throw new Error('composition.previewOutput is required');
  if (!Array.isArray(value.components) || value.components.length === 0) throw new Error('composition.components must be a non-empty array');
  validateExactKeys(value.canvas, ['backgroundColor', 'outerBackgroundColor', 'contentWidth', 'mobileTargetWidth', 'verticalPadding'], 'composition.canvas');
  for (const key of ['backgroundColor', 'outerBackgroundColor']) {
    if (!/^#[0-9A-F]{6}$/i.test(value.canvas[key])) throw new Error(`composition.canvas.${key} must be a six-digit hex color`);
  }
  for (const key of ['contentWidth', 'mobileTargetWidth']) {
    if (!Number.isInteger(value.canvas[key]) || value.canvas[key] <= 0) throw new Error(`composition.canvas.${key} must be a positive integer`);
  }
  if (value.canvas.mobileTargetWidth > value.canvas.contentWidth) throw new Error('composition.canvas.mobileTargetWidth cannot exceed contentWidth');
  if (!Number.isInteger(value.canvas.verticalPadding) || value.canvas.verticalPadding < 0) throw new Error('composition.canvas.verticalPadding must be a non-negative integer');
  if (value.assets !== undefined) {
    if (!value.assets || typeof value.assets !== 'object' || Array.isArray(value.assets)) throw new Error('composition.assets must be an object');
    for (const [id, asset] of Object.entries(value.assets)) {
      if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) throw new Error(`composition asset id ${id} is invalid`);
      validateExactKeys(asset, ['path', 'name'], `composition.assets.${id}`);
      if (typeof asset.path !== 'string' || !asset.path) throw new Error(`composition.assets.${id}.path is required`);
      if (typeof asset.name !== 'string' || !/^[^/\\]+\.(?:jpe?g|png|gif|webp)$/i.test(asset.name)) throw new Error(`composition.assets.${id}.name must be a supported image filename`);
    }
  }
}

function resolveLocalAssets(values, schema, componentKey) {
  const resolvedValues = { ...values };
  const localAssetKeys = new Set();
  const previewDirectory = dirname(resolve(workspaceRoot, previewOutput));
  for (const [key, value] of Object.entries(resolvedValues)) {
    const match = typeof value === 'string' ? value.match(/^asset:\/\/([a-z0-9][a-z0-9-]*)$/) : null;
    if (!match) continue;
    const assetId = match[1];
    const definition = schema.properties[key];
    if (!definition?.role?.endsWith('image-source')) throw new Error(`${componentKey}: asset reference is only allowed for image sources`);
    const asset = composition.assets?.[assetId];
    if (!asset) throw new Error(`${componentKey}: unknown local asset ${assetId}`);
    if (!previewLocalAssets && !deferLocalAssets) throw new Error(`local asset ${assetId} must be uploaded before final build`);
    const absolutePath = resolve(workspaceRoot, asset.path);
    const workspaceRelativePath = relative(workspaceRoot, absolutePath);
    if (workspaceRelativePath.startsWith('..') || workspaceRelativePath === '' || workspaceRelativePath.startsWith('/')) throw new Error(`${componentKey}: local asset ${assetId} must be inside the workspace`);
    const file = statSync(absolutePath);
    if (!file.isFile() || file.size > 5 * 1024 * 1024) throw new Error(`${componentKey}: local asset ${assetId} must be a file no larger than 5 MB`);
    if (previewLocalAssets) resolvedValues[key] = relative(previewDirectory, absolutePath).split('/').map(encodeURIComponent).join('/');
    localAssetKeys.add(key);
  }
  return { values: resolvedValues, localAssetKeys };
}

function validateContent(values, schema, componentKey, localAssetKeys = new Set()) {
  if (!values || typeof values !== 'object' || Array.isArray(values)) throw new Error(`${componentKey}: content must be an object`);
  const missing = Object.keys(schema.properties).filter((key) => !(key in values));
  const unknown = Object.keys(values).filter((key) => !(key in schema.properties));
  if (missing.length) throw new Error(`${componentKey}: missing content keys: ${missing.join(', ')}`);
  if (unknown.length) throw new Error(`${componentKey}: unknown content keys: ${unknown.join(', ')}`);
  for (const [key, definition] of Object.entries(schema.properties)) {
    if (typeof values[key] !== 'string') throw new Error(`${componentKey}: content.${key} must be text`);
    const allowedRegisteredLocalImage = (previewLocalAssets || deferLocalAssets) && definition.role?.endsWith('image-source') && localAssetKeys.has(key);
    if (definition.type === 'url' && !validUrl(values[key]) && !allowedRegisteredLocalImage) throw new Error(`${componentKey}: content.${key} has unsafe URL`);
    if (definition.type === 'url' && definition.protocol !== undefined && !allowedRegisteredLocalImage && !validDeclaredProtocolUrl(values[key], definition.protocol)) {
      if (definition.protocol === 'https') throw new Error(`${componentKey}: content.${key} must be an absolute https URL`);
      throw new Error(`${componentKey}: content.${key} must use the ${definition.protocol} protocol`);
    }
  }
}

function validateSettings(values, schema, componentKey) {
  if (!values || typeof values !== 'object' || Array.isArray(values)) throw new Error(`${componentKey}: settings must be an object`);
  const missing = Object.keys(schema.properties).filter((key) => !(key in values));
  const unknown = Object.keys(values).filter((key) => !(key in schema.properties));
  if (missing.length) throw new Error(`${componentKey}: missing settings keys: ${missing.join(', ')}`);
  if (unknown.length) throw new Error(`${componentKey}: unknown settings keys: ${unknown.join(', ')}`);
  for (const [key, definition] of Object.entries(schema.properties)) {
    const value = values[key];
    if (typeof value !== 'string') throw new Error(`${componentKey}: settings.${key} must be text`);
    if (/["'<> {};]/.test(value.replaceAll(' ', ''))) throw new Error(`${componentKey}: settings.${key} contains unsafe characters`);
    if (definition.pattern !== undefined) {
      if (typeof definition.pattern !== 'string' || definition.pattern.length === 0) {
        throw new Error(`${componentKey}: settings schema ${key} has invalid pattern`);
      }
      let matcher;
      try {
        matcher = new RegExp(definition.pattern);
      } catch {
        throw new Error(`${componentKey}: settings schema ${key} has invalid pattern`);
      }
      if (!matcher.test(value)) throw new Error(`${componentKey}: settings.${key} does not match pattern`);
    }
  }
}

function parseSafeCss(css, componentKey) {
  const source = css.replace(/\/\*[\s\S]*?\*\//g, '');
  if (forbiddenCss.test(source) || /@/.test(source)) throw new Error(`${componentKey}: component CSS contains unsafe rule`);
  const rules = [];
  for (const match of source.matchAll(/([a-z][\w-]*|\.[\w-]+)\s*\{([^}]*)\}/gi)) {
    const selector = match[1];
    const declarations = match[2].split(';').map((entry) => entry.trim()).filter(Boolean).map((entry) => {
      const [property, ...rest] = entry.split(':');
      const value = rest.join(':').trim();
      if (!allowedCssProperties.has(property.trim()) || !value) throw new Error(`${componentKey}: unsupported CSS declaration ${entry}`);
      return `${property.trim()}:${value}`;
    });
    rules.push({ selector, declarations: declarations.join(';') });
  }
  return rules;
}

function inlineComponentCss(html, rules) {
  return html.replace(/<([a-z][\w-]*)([^>]*?)>/gi, (tag, name, attributes) => {
    if (tag.startsWith('</')) return tag;
    const classes = attributes.match(/\bclass="([^"]*)"/i)?.[1]?.split(/\s+/) ?? [];
    const declarations = rules.filter(({ selector }) => selector === name.toLowerCase() || (selector.startsWith('.') && classes.includes(selector.slice(1)))).map(({ declarations: value }) => value);
    if (!declarations.length) return tag;
    if (/\bstyle="/i.test(attributes)) return `<${name}${attributes.replace(/\bstyle="([^"]*)"/i, (_, value) => `style="${value}${value.endsWith(';') ? '' : ';'}${declarations.join(';')}"`)}>`;
    return `<${name}${attributes} style="${declarations.join(';')}">`;
  });
}

function validateResponsiveStyle(html, componentKey) {
  const styleTags = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)];
  if (!styleTags.length) return html;
  if (componentKey !== responsiveStyleComponentKey || styleTags.length !== 1 || styleTags[0][0].match(/<style\b[^>]*>/i)?.[0] !== '<style>') {
    throw new Error(`${componentKey}: rendered unsafe HTML`);
  }

  const source = styleTags[0][1].replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').trim();
  const rulePattern = /^@media only screen and \(max-width:375px\)\s*\{([\s\S]*)\}$/i;
  const mediaBody = source.match(rulePattern)?.[1];
  if (!mediaBody) throw new Error(`${componentKey}: rendered unsafe HTML`);
  const compactMediaBody = mediaBody.replace(/\s+/g, '');
  const rules = [...compactMediaBody.matchAll(/(\.[a-z][\w-]*)\{([^{}]*)\}/gi)];
  if (rules.length !== 3 || rules.reduce((total, rule) => total + rule[0].length, 0) !== compactMediaBody.length) {
    throw new Error(`${componentKey}: rendered unsafe HTML`);
  }
  const allowedRules = new Map([
    ['.freshine-product-style1-desktop-detail', 'display:none!important'],
    ['.freshine-product-style1-mobile-detail', 'display:block!important'],
    ['.freshine-product-style1-copy', 'width:100%!important']
  ]);
  for (const [, selector, declarations] of rules) {
    const normalizedDeclarations = declarations.replace(/\s+/g, '').replace(/;$/, '');
    if (allowedRules.get(selector.toLowerCase()) !== normalizedDeclarations.toLowerCase()) {
      throw new Error(`${componentKey}: rendered unsafe HTML`);
    }
  }
  return html.replace(styleTags[0][0], '');
}

function renderComponent(instance) {
  validateExactKeys(instance, ['name', 'directory', 'componentKey', 'content', 'settings'], 'component instance');
  const base = instance.directory;
  const template = readFileSync(`${base}/component.template.v1.html`, 'utf8');
  const contentSchema = readJson(`${base}/content.schema.v1.json`);
  const settingsSchema = readJson(`${base}/settings.schema.v1.json`);
  if (contentSchema.componentKey !== instance.componentKey || settingsSchema.componentKey !== instance.componentKey) throw new Error(`${instance.name}: component contract mismatch`);
  const { values: content, localAssetKeys } = resolveLocalAssets(instance.content, contentSchema, instance.componentKey);
  validateContent(content, contentSchema, instance.componentKey, localAssetKeys);
  validateSettings(instance.settings, settingsSchema, instance.componentKey);
  let html = template.replace(/\{\{content\.([^}]+)\}\}/g, (_, key) => {
    if (!(key in content)) throw new Error(`${instance.componentKey}: unresolved content.${key}`);
    return contentSchema.properties[key].type === 'url' ? escapeAttribute(content[key]) : escapeText(content[key]);
  });
  html = html.replace(/\{\{settings\.([^}]+)\}\}/g, (_, key) => {
    if (!(key in instance.settings)) throw new Error(`${instance.componentKey}: unresolved settings.${key}`);
    return instance.settings[key];
  });
  html = inlineComponentCss(html, parseSafeCss(readFileSync(`${base}/component.styles.v1.css`, 'utf8'), instance.componentKey));
  for (const match of html.matchAll(/<a\b([^>]*)>/gi)) {
    if (!/\bhref="(?:(?:https:|mailto:|tel:)|\[\[unsubscribe_link\]\])/i.test(match[1])) throw new Error(`${instance.componentKey}: incomplete or unsafe link`);
  }
  const safeHtml = validateResponsiveStyle(html, instance.componentKey);
  if (/\{\{[^}]+\}\}/.test(safeHtml) || forbiddenTags.test(safeHtml) || forbiddenCss.test(safeHtml)) throw new Error(`${instance.componentKey}: rendered unsafe HTML`);
  return `<!-- 组件：${instance.name} -->\n${html.trim()}\n<!-- /组件：${instance.name} -->`;
}

validateComposition(composition);
const previewOutput = composition.previewOutput ?? composition.output.replace(/\.html$/i, '.local-preview.html');
const sections = composition.components.map(renderComponent).join('\n');
const { backgroundColor, outerBackgroundColor, contentWidth, verticalPadding } = composition.canvas;
const output = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${outerBackgroundColor}" style="width:100%;border-collapse:collapse;background-color:${outerBackgroundColor};"><tr><td align="center" valign="top" bgcolor="${outerBackgroundColor}" style="padding:0;background-color:${outerBackgroundColor};"><table role="presentation" width="${contentWidth}" cellpadding="0" cellspacing="0" border="0" bgcolor="${backgroundColor}" style="width:100%;max-width:${contentWidth}px;border-collapse:collapse;background-color:${backgroundColor};"><tr><td align="center" valign="top" bgcolor="${backgroundColor}" style="padding:${verticalPadding}px 0;background-color:${backgroundColor};">\n${sections}\n<p style="margin:0;padding:0;font-size:0;line-height:0;"></p>\n</td></tr></table></td></tr></table>\n`;

const outputForSafety = output.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
if (forbiddenTags.test(outputForSafety) || forbiddenCss.test(outputForSafety) || !output.trim()) throw new Error('Output failed safe-email validation');
if (!previewLocalAssets) write(composition.output, output);
const preview = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Freshine Email Local Preview</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&amp;family=Montserrat:wght@400;500;600;700&amp;display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background-color:${outerBackgroundColor};">
<table data-freshine-preview-shell="omnisend-custom-html" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;"><tr><td align="center"><table role="presentation" width="${contentWidth}" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:${contentWidth}px;border-collapse:collapse;"><tr><td align="center" style="padding:0;">
${output.trim()}
</td></tr></table></td></tr></table>
</body>
</html>
`;
write(previewOutput, preview);
console.log(JSON.stringify({ generated: previewLocalAssets ? null : composition.output, localPreview: previewOutput, components: composition.components.length, desktopWidth: contentWidth, mobileTargetWidth: composition.canvas.mobileTargetWidth, status: previewLocalAssets ? 'local-preview' : deferLocalAssets ? 'upload-source' : 'static-safe' }, null, 2));
