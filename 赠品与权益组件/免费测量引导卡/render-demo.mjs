import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderComponentDemo } from '../../scripts/render-component-demo.mjs';

renderComponentDemo({
  directory: dirname(fileURLToPath(import.meta.url)),
  buildSlug: 'free-measurement-guidance',
  componentName: '免费测量引导卡',
  backgroundColor: '#FCF9F5'
});
