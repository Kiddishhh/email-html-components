import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { activityPageProductGridSources, parseActivityPageUrl, parseShopifyProductImportUrl } from '../skills/build-omnisend-campaign-draft/scripts/fetch-activity-page-sale-grid.mjs';

test('accepts a Freshine activity Page URL and extracts its Page handle', () => {
  assert.deepEqual(
    parseActivityPageUrl('https://freshinelife.com/pages/back-to-school-refresh'),
    { handle: 'back-to-school-refresh', url: 'https://freshinelife.com/pages/back-to-school-refresh' }
  );
});

test('accepts a Freshine Collection URL as a direct product and CTA source', () => {
  assert.deepEqual(
    parseShopifyProductImportUrl('https://freshinelife.com/collections/back-to-school-home'),
    { type: 'collection', handle: 'back-to-school-home', url: 'https://freshinelife.com/collections/back-to-school-home' }
  );
});

test('uses the first enabled product grid as the activity page six-grid source', async (t) => {
  const snapshotPath = await mkdtemp(join(tmpdir(), 'activity-page-grid-'));
  await mkdir(join(snapshotPath, 'templates'));
  t.after(() => rm(snapshotPath, { recursive: true, force: true }));
  const pageTemplate = {
    sections: {
      disabled: { type: 'products-grid-v2', disabled: true, settings: { collection: 'linen-curtains', items_to_show: 4 } },
      primary: { type: 'products-grid-v2', settings: { collection: 'back-to-school-home', items_to_show: 8 } },
      secondary: { type: 'products-grid-v2', settings: { collection: 'blackout-curtains', items_to_show: 4 } }
    },
    order: ['disabled', 'primary', 'secondary']
  };
  await writeFile(join(snapshotPath, 'templates', 'page.sub-activity.json'), `${JSON.stringify(pageTemplate, null, 2)}\n`);

  const result = activityPageProductGridSources({ snapshotPath, pageTemplate: 'page.sub-activity.json' });

  assert.deepEqual(result.primary, { sectionId: 'primary', handle: 'back-to-school-home', itemsToShow: 8 });
  assert.deepEqual(result.sources, [
    { sectionId: 'primary', handle: 'back-to-school-home', itemsToShow: 8 },
    { sectionId: 'secondary', handle: 'blackout-curtains', itemsToShow: 4 }
  ]);
});
