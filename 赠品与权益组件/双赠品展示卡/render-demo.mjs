import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderComponentDemo } from '../../scripts/render-component-demo.mjs';

renderComponentDemo({
  directory: dirname(fileURLToPath(import.meta.url)),
  buildSlug: 'double-gift-showcase',
  componentName: '双赠品展示卡',
  backgroundColorSetting: 'color.surface'
});
