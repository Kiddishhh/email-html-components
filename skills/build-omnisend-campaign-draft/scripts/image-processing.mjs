import { spawnSync } from 'node:child_process';
import { extname } from 'node:path';

// Preserve sips on existing Macs; ImageMagick 7 provides the portable fallback.
export function createImageProcessor({ backend = 'auto', run = spawnSync } = {}) {
  if (!['auto', 'sips', 'magick'].includes(backend)) throw new Error('image backend must be auto, sips, or magick');
  const choices = backend === 'auto' ? ['sips', 'magick'] : [backend];
  const selected = choices.find(command => run(command, [command === 'sips' ? '--version' : '-version'], { encoding: 'utf8' }).status === 0);
  if (!selected) throw new Error('Image processing requires macOS sips or ImageMagick 7 (magick) on PATH; install one or choose --backend sips|magick.');
  function execute(args) {
    const result = run(selected, args, { encoding: 'utf8' });
    if (result.status !== 0) throw new Error(result.stderr?.trim() || result.stdout?.trim() || `${selected} image processing failed: ${result.error?.code ?? result.status}`);
    return result.stdout ?? '';
  }
  return {
    backend: selected,
    dimensions(path) {
      const output = execute(selected === 'sips' ? ['-g', 'pixelWidth', '-g', 'pixelHeight', path] : ['identify', '-format', '%w %h', `${path}[0]`]);
      const [width, height] = selected === 'sips'
        ? [Number(output.match(/pixelWidth:\s+(\d+)/u)?.[1]), Number(output.match(/pixelHeight:\s+(\d+)/u)?.[1])]
        : output.trim().split(/\s+/u).map(Number);
      if (![width, height].every(value => Number.isInteger(value) && value > 0)) throw new Error('unable to read input image dimensions');
      return { width, height };
    },
    render({ source, cropped, output, crop, width, height }) {
      const jpeg = /\.jpe?g$/iu.test(output);
      if (selected === 'magick') {
        execute([`${source}[0]`, '-crop', `${crop.width}x${crop.height}+${crop.offsetX}+${crop.offsetY}`, '+repage', '-resize', `${width}x${height}!`, ...(jpeg ? ['-quality', '88'] : []), output]);
        return;
      }
      execute(['--cropToHeightWidth', String(crop.height), String(crop.width), '--cropOffset', String(crop.offsetY), String(crop.offsetX), source, '--out', cropped]);
      const format = jpeg ? ['--setProperty', 'format', 'jpeg', '--setProperty', 'formatOptions', '88'] : extname(output).toLowerCase() === '.png' ? ['--setProperty', 'format', 'png'] : [];
      execute([...format, '--resampleHeightWidth', String(height), String(width), cropped, '--out', output]);
    }
  };
}
