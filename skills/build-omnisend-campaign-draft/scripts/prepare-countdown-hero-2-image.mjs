#!/usr/bin/env node

import { existsSync, mkdirSync, mkdtempSync, realpathSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { createImageProcessor } from './image-processing.mjs';

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
    if (!['--input', '--output', '--backend'].includes(flag) || !value) fail('usage: prepare-countdown-hero-2-image.mjs --input <path> --output <path>');
    values[flag.slice(2)] = value;
  }
  if (!values.input || !values.output) fail('usage: prepare-countdown-hero-2-image.mjs --input <path> --output <path>');
  return values;
}

const { input, output, backend } = readArguments(process.argv.slice(2));
const sourcePath = resolve(input);
const outputPath = resolve(output);

if (!existsSync(sourcePath) || !statSync(sourcePath).isFile()) fail(`input image not found: ${sourcePath}`);
if (sourcePath === outputPath || (existsSync(outputPath) && realpathSync(sourcePath) === realpathSync(outputPath))) {
  fail('output must not overwrite input');
}

let processor;
let sourceSize;
try {
  processor = createImageProcessor({ backend });
  sourceSize = processor.dimensions(sourcePath);
} catch (error) { fail(error.message); }
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
  processor.render({source: sourcePath, cropped: croppedPath, output: outputPath, crop: {width: cropWidth, height: cropHeight, offsetX, offsetY}, width: OUTPUT_WIDTH, height: OUTPUT_HEIGHT});
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}

if (!process.exitCode) process.stdout.write(`${JSON.stringify({
  backend: processor.backend,
  sourcePath,
  outputPath,
  sourceSize,
  crop: { mode: 'center', width: cropWidth, height: cropHeight, offsetX, offsetY },
  outputSize: { width: OUTPUT_WIDTH, height: OUTPUT_HEIGHT }
})}\n`);
