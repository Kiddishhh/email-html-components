import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderComponentDemo } from '../../scripts/render-component-demo.mjs';

renderComponentDemo({
  directory: dirname(fileURLToPath(import.meta.url)),
  buildSlug: 'coupon-scene-overlay',
  componentName: '优惠券场景叠层头图',
  backgroundColorSetting: 'color.surface'
});
