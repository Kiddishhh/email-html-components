#!/usr/bin/env node

import { pathToFileURL } from 'node:url';

const LIGHT_BASE = '#F4F1EC';
const THEME_WEIGHT = 0.35;

function normalizeHex(value, label) {
  if (typeof value !== 'string' || !/^#[0-9A-Fa-f]{6}$/u.test(value)) {
    throw new Error(`${label} 必须是 #RRGGBB 格式的十六进制色号`);
  }
  return value.toUpperCase();
}

function hexChannels(hex) {
  return [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16)
  ];
}

function toHex(channels) {
  return `#${channels.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

function deriveLighterNavigation(theme) {
  const themeChannels = hexChannels(theme);
  const baseChannels = hexChannels(LIGHT_BASE);
  return toHex(themeChannels.map((channel, index) => (
    Math.round(channel * THEME_WEIGHT + baseChannels[index] * (1 - THEME_WEIGHT))
  )));
}

export function deriveCountdownTheme(themeValue, navigationLeftOverride) {
  const theme = normalizeHex(themeValue, '主题色');
  if (navigationLeftOverride !== undefined) {
    return {
      theme,
      navigationLeft: normalizeHex(navigationLeftOverride, '左侧导航色'),
      navigationLeftSource: 'user-override'
    };
  }

  return {
    theme,
    navigationLeft: deriveLighterNavigation(theme),
    navigationLeftSource: 'derived'
  };
}

function parseArguments(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--theme' || argument === '--navigation-left') {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) {
        throw new Error(`${argument} 缺少色号；应使用 #RRGGBB`);
      }
      options[argument === '--theme' ? 'theme' : 'navigationLeft'] = value;
      index += 1;
      continue;
    }
    throw new Error(`不支持的参数：${argument}`);
  }
  if (!options.theme) {
    throw new Error('必须提供 --theme <#RRGGBB>');
  }
  return options;
}

function runCli() {
  try {
    const options = parseArguments(process.argv.slice(2));
    process.stdout.write(`${JSON.stringify(deriveCountdownTheme(options.theme, options.navigationLeft))}\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli();
}
