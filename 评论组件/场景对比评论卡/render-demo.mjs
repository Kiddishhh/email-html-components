import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderComponentDemo } from '../../scripts/render-component-demo.mjs';

renderComponentDemo({
  directory: dirname(fileURLToPath(import.meta.url)),
  buildSlug: 'scene-comparison-review',
  componentName: '场景对比评论卡',
  backgroundColor: '#F5F2ED'
});
