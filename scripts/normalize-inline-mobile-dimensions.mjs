import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import process from 'node:process';

const root = resolve(import.meta.dirname, '..');
const desktopWidth = 600;
const targetWidth = 375;
const registry = JSON.parse(readFileSync(resolve(root, '组件清单.json'), 'utf8'));
const responsiveProperties = new Set([
  'font-size',
  'line-height',
  'width',
  'height',
  'padding',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'margin',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'border-radius'
]);

function vw(value) {
  const scaled = Math.abs(value) * 100 / desktopWidth;
  return Number(scaled.toFixed(6)).toString();
}

function responsiveToken(raw) {
  const value = Number(raw);
  if (!Number.isFinite(value) || value === 0 || Math.abs(value) <= 1) return `${raw}px`;
  const unit = `${raw}px`;
  return value > 0 ? `min(${unit},${vw(value)}vw)` : `max(${unit},-${vw(value)}vw)`;
}

function isEligibleValue(value) {
  if (/(?:min|max|clamp|calc|var)\(|\{\{/u.test(value)) return false;
  return [...value.matchAll(/(-?\d+(?:\.\d+)?)px/gu)]
    .some((match) => Math.abs(Number(match[1])) > 1);
}

function splitDeclarations(style) {
  return style.split(';').map((declaration) => {
    const separator = declaration.indexOf(':');
    if (separator === -1) return { raw: declaration };
    return {
      property: declaration.slice(0, separator).trim(),
      value: declaration.slice(separator + 1).trim()
    };
  });
}

function normalizeStyle(style) {
  const declarations = splitDeclarations(style);
  const responsiveByProperty = new Set(
    declarations
      .filter(({ property, value }) => responsiveProperties.has(property) && /(?:min|max)\(/u.test(value ?? ''))
      .map(({ property }) => property)
  );

  return declarations.map(({ raw, property, value }) => {
    if (raw !== undefined || !responsiveProperties.has(property) || responsiveByProperty.has(property) || !isEligibleValue(value)) {
      return raw ?? `${property}:${value}`;
    }

    const responsiveValue = value.replace(/(-?\d+(?:\.\d+)?)px/gu, (_match, rawValue) => responsiveToken(rawValue));
    return `${property}:${value};${property}:${responsiveValue}`;
  }).join(';');
}

function normalizeHtml(html) {
  return html.replace(/style="([^"]*)"/gu, (_match, style) => `style="${normalizeStyle(style)}"`);
}

function componentFiles() {
  return registry.flatMap(({ componentKey, 路径 }) => {
    const template = 路径.组件模板;
    return [
      { componentKey, type: 'template', relativePath: template },
      { componentKey, type: 'demo', relativePath: `${dirname(template)}/效果演示.html` }
    ];
  });
}

function unscaledDeclarations(html) {
  const findings = [];
  for (const styleMatch of html.matchAll(/style="([^"]*)"/gu)) {
    const declarations = splitDeclarations(styleMatch[1]);
    const responsiveByProperty = new Set(
      declarations
        .filter(({ property, value }) => responsiveProperties.has(property) && /(?:min|max)\(/u.test(value ?? ''))
        .map(({ property }) => property)
    );
    for (const { property, value } of declarations) {
      if (!responsiveProperties.has(property) || responsiveByProperty.has(property) || !isEligibleValue(value)) continue;
      findings.push(`${property}:${value}`);
    }
  }
  return [...new Set(findings)];
}

const checkOnly = process.argv.includes('--check');
const changedFiles = [];
const findings = [];

for (const file of componentFiles()) {
  const absolutePath = resolve(root, file.relativePath);
  const before = readFileSync(absolutePath, 'utf8');
  const after = normalizeHtml(before);
  if (!checkOnly && after !== before) {
    writeFileSync(absolutePath, after);
    changedFiles.push(file.relativePath);
  }
  const checkedHtml = checkOnly ? before : after;
  const declarations = unscaledDeclarations(checkedHtml);
  if (declarations.length > 0) findings.push({ ...file, declarations });
}

const summary = {
  componentCount: registry.length,
  desktopWidth,
  targetWidth,
  filesChecked: componentFiles().length,
  changedFiles,
  unscaledDeclarations: findings
};

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
if (findings.length > 0) process.exitCode = 1;
