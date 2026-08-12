import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { discoverHomepageActivities } from '../skills/build-omnisend-campaign-draft/scripts/list-sale-activities.mjs';

async function writeHomepageTemplate(themeRoot) {
  const sections = {
    hero: {
      type: 'slideshow-v2',
      block_order: ['summer', 'back-to-school', 'disabled-slide'],
      blocks: {
        summer: {
          type: 'slide',
          settings: {
            subheading: 'Summer Sale',
            heading: 'UP TO 70% OFF',
            description: 'Extra savings on selected styles',
            link: 'shopify://pages/freshine-sale'
          }
        },
        'back-to-school': {
          type: 'slide',
          settings: {
            subheading: 'Back to School Refresh',
            heading: 'UP TO 70% OFF',
            description: 'Extra $600 off for the new season',
            link: 'shopify://pages/back-to-school-refresh'
          }
        },
        'disabled-slide': {
          type: 'slide',
          disabled: true,
          settings: {
            subheading: 'Disabled',
            heading: 'Do not use',
            link: 'shopify://pages/disabled'
          }
        }
      },
      settings: {}
    },
    disabledHero: {
      type: 'slideshow-v2',
      disabled: true,
      blocks: {},
      settings: {}
    }
  };
  await writeFile(join(themeRoot, 'templates', 'index.json'), `${JSON.stringify({ sections }, null, 2)}\n`);
}

test('homepage activity discovery returns enabled readable slides in homepage order', async (t) => {
  const themeRoot = await mkdtemp(join(tmpdir(), 'homepage-activities-'));
  await mkdir(join(themeRoot, 'templates'));
  t.after(() => rm(themeRoot, { recursive: true, force: true }));
  await writeHomepageTemplate(themeRoot);

  assert.deepEqual(discoverHomepageActivities({ themeRoot }), [
    {
      slideId: 'summer',
      activityName: 'Summer Sale',
      pageHandle: 'freshine-sale',
      pageUrl: 'https://freshinelife.com/pages/freshine-sale',
      homepageSectionId: 'hero',
      activity: {
        eyebrow: 'Summer Sale',
        title: 'UP TO 70% OFF',
        description: 'Extra savings on selected styles'
      }
    },
    {
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
    }
  ]);
});
