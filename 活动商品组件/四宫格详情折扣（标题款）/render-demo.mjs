import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderComponentDemo } from '../../scripts/render-component-demo.mjs';

renderComponentDemo({
  directory: dirname(fileURLToPath(import.meta.url)),
  buildSlug: 'sale-grid4-detail-with-title',
  componentName: '四宫格详情折扣（标题款）',
  backgroundColor: '#FBF9F6'
});
