import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderComponentDemo } from '../../scripts/render-component-demo.mjs';

renderComponentDemo({
  directory: dirname(fileURLToPath(import.meta.url)),
  buildSlug: 'four-benefits-image-strip',
  componentName: '四项权益整图',
  backgroundColor: '#FCF9F5'
});
