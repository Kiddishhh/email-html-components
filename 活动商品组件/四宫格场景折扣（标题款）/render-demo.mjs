import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderComponentDemo } from '../../scripts/render-component-demo.mjs';

renderComponentDemo({
  directory: dirname(fileURLToPath(import.meta.url)),
  buildSlug: 'scene-sale-grid4-with-title',
  componentName: '四宫格场景折扣（标题款）',
  backgroundColor: '#F8F5F1'
});
