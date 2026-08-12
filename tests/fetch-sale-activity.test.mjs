import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { fetchSelectedHomepageActivity } from '../skills/build-omnisend-campaign-draft/scripts/fetch-sale-activity.mjs';

const selectedCandidate = {
  slideId: 'back-to-school',
  activityName: 'Back to School Refresh',
  pageHandle: 'back-to-school-refresh',
  pageUrl: 'https://freshinelife.com/pages/back-to-school-refresh',
  homepageSectionId: 'hero',
  activity: {
    eyebrow: 'Back to School Refresh',
    title: 'UP TO 70% OFF',
    description: 'Extra $600 off for the new season'
  }
};

async function writeSnapshot(snapshotPath, heading = 'UP TO 70% OFF') {
  const homepage = {
    sections: {
      hero: {
        type: 'slideshow-v2',
        block_order: ['back-to-school'],
        blocks: {
          'back-to-school': {
            type: 'slide',
            settings: {
              subheading: 'Back to School Refresh',
              heading,
              description: 'Extra $600 off for the new season',
              link: 'shopify://pages/back-to-school-refresh'
            }
          }
        },
        settings: {}
      }
    }
  };
  const page = {
    sections: {
      products: {
        type: 'products-grid-v2',
        settings: { collection: 'back-to-school-home' }
      }
    }
  };
  await writeFile(join(snapshotPath, 'templates', 'index.json'), `${JSON.stringify(homepage, null, 2)}\n`);
  await writeFile(join(snapshotPath, 'templates', 'page.sub-activity.json'), `${JSON.stringify(page, null, 2)}\n`);
}

test('selected homepage slide is re-read with only its linked page Collection', async (t) => {
  const snapshotPath = await mkdtemp(join(tmpdir(), 'selected-homepage-activity-'));
  await mkdir(join(snapshotPath, 'templates'));
  t.after(() => rm(snapshotPath, { recursive: true, force: true }));
  await writeSnapshot(snapshotPath);

  const result = fetchSelectedHomepageActivity({
    snapshotPath,
    candidate: selectedCandidate,
    pageTemplate: 'page.sub-activity.json',
    themeId: '183971873047'
  });

  assert.deepEqual(result.activity, {
    name: 'Back to School Refresh',
    eyebrow: 'Back to School Refresh',
    title: 'UP TO 70% OFF',
    subtitle: 'Extra $600 off for the new season'
  });
  assert.deepEqual(result.recommendedCollection, {
    handle: 'back-to-school-home',
    url: 'https://freshinelife.com/collections/back-to-school-home'
  });
  assert.deepEqual({
    pageUrl: result.source.pageUrl,
    template: result.source.template,
    sectionId: result.source.sectionId,
    themeId: result.source.themeId
  }, {
    pageUrl: 'https://freshinelife.com/pages/back-to-school-refresh',
    template: 'page.sub-activity.json',
    sectionId: 'hero',
    themeId: '183971873047'
  });
});

test('selected homepage slide rejects a changed locked snapshot', async (t) => {
  const snapshotPath = await mkdtemp(join(tmpdir(), 'changed-homepage-activity-'));
  await mkdir(join(snapshotPath, 'templates'));
  t.after(() => rm(snapshotPath, { recursive: true, force: true }));
  await writeSnapshot(snapshotPath, 'Changed offer');

  assert.throws(
    () => fetchSelectedHomepageActivity({ snapshotPath, candidate: selectedCandidate, pageTemplate: 'page.sub-activity.json' }),
    /candidate no longer matches the locked homepage snapshot/
  );
});
