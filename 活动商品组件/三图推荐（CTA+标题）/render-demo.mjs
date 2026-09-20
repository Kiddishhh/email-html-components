import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderComponentDemo } from '../../scripts/render-component-demo.mjs';

renderComponentDemo({
  directory: dirname(fileURLToPath(import.meta.url)),
  buildSlug: 'roman-shade-multi-recommendation',
  componentName: '三图推荐（CTA+标题）',
  backgroundColor: '#FCF9F5'
});
