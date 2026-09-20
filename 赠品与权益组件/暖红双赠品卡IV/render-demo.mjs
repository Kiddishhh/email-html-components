import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderComponentDemo } from '../../scripts/render-component-demo.mjs';

renderComponentDemo({
  directory: dirname(fileURLToPath(import.meta.url)),
  buildSlug: 'warm-red-gift-iv',
  componentName: '暖红双赠品卡IV',
  backgroundColor: '#FAF9F7'
});
