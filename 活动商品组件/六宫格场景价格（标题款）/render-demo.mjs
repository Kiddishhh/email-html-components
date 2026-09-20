import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderComponentDemo } from '../../scripts/render-component-demo.mjs';

renderComponentDemo({
  directory: dirname(fileURLToPath(import.meta.url)),
  buildSlug: 'scene-sale-grid6-price-with-title',
  componentName: '六宫格场景价格（标题款）',
  backgroundColor: '#FBF6EC'
});
