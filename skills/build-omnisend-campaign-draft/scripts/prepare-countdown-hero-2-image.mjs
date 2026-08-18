#!/usr/bin/env node

import { existsSync, mkdirSync, mkdtempSync, realpathSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, extname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const OUTPUT_WIDTH = 1200;
const OUTPUT_HEIGHT = 1200;

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

function readArguments(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (!['--input', '--output'].includes(flag) || !value) fail('usage: prepare-countdown-hero-2-image.mjs --input <path> --output <path>');
    values[flag.slice(2)] = value;
  }
  if (!values.input || !values.output) fail('usage: prepare-countdown-hero-2-image.mjs --input <path> --output <path>');
  return values;
}

function runSips(argumentsList) {
  const result = spawnSync('sips', argumentsList, { encoding: 'utf8' });
  if (result.status !== 0) fail(result.stderr.trim() || result.stdout.trim() || 'sips image processing failed');
  return result.stdout;
}

function readDimensions(path) {
  const output = runSips(['-g', 'pixelWidth', '-g', 'pixelHeight', path]);
  const width = Number(output.match(/pixelWidth:\s+(\d+)/u)?.[1]);
  const height = Number(output.match(/pixelHeight:\s+(\d+)/u)?.[1]);
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) fail('unable to read input image dimensions');
  return { width, height };
}

const { input, output } = readArguments(process.argv.slice(2));
const sourcePath = resolve(input);
const outputPath = resolve(output);

if (!existsSync(sourcePath) || !statSync(sourcePath).isFile()) fail(`input image not found: ${sourcePath}`);
if (sourcePath === outputPath || (existsSync(outputPath) && realpathSync(sourcePath) === realpathSync(outputPath))) {
  fail('output must not overwrite input');
}

const sourceSize = readDimensions(sourcePath);
const targetRatio = OUTPUT_WIDTH / OUTPUT_HEIGHT;
let cropWidth = sourceSize.width;
let cropHeight = sourceSize.height;
let offsetX = 0;
let offsetY = 0;

if (sourceSize.width / sourceSize.height > targetRatio) {
  cropWidth = Math.round(sourceSize.height * targetRatio);
  offsetX = Math.round((sourceSize.width - cropWidth) / 2);
} else {
  cropHeight = Math.round(sourceSize.width / targetRatio);
  offsetY = Math.round((sourceSize.height - cropHeight) / 2);
}

mkdirSync(dirname(outputPath), { recursive: true });
const temporaryDirectory = mkdtempSync(join(tmpdir(), 'freshine-countdown-hero-2-'));
const croppedPath = join(temporaryDirectory, 'centered-crop.png');

try {
  runSips([
    '--cropToHeightWidth', String(cropHeight), String(cropWidth),
    '--cropOffset', String(offsetY), String(offsetX),
    sourcePath,
    '--out', croppedPath
  ]);
  const extension = extname(outputPath).toLowerCase();
  const formatArguments = extension === '.jpg' || extension === '.jpeg'
    ? ['--setProperty', 'format', 'jpeg', '--setProperty', 'formatOptions', '88']
    : extension === '.png'
      ? ['--setProperty', 'format', 'png']
      : [];
  runSips([...formatArguments, '--resampleHeightWidth', String(OUTPUT_HEIGHT), String(OUTPUT_WIDTH), croppedPath, '--out', outputPath]);
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}

process.stdout.write(`${JSON.stringify({
  sourcePath,
  outputPath,
  sourceSize,
  crop: { mode: 'center', width: cropWidth, height: cropHeight, offsetX, offsetY },
  outputSize: { width: OUTPUT_WIDTH, height: OUTPUT_HEIGHT }
})}\n`);
