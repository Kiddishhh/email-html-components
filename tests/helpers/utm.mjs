import assert from 'node:assert/strict';

/** 默认投放渠道标识，见 references/shopify-data-contract.zh-CN.md 的 UTM 约定。 */
const DEFAULT_CAMPAIGN_UTM_ID = 'cover-rc';

/**
 * 断言一个活动链接带了约定的 UTM 三件套。
 *
 * 个别组件按活动改用 `cover-fs` / `cover-fc` 之类的 id，用 `id` 覆盖即可；
 * source / medium 所有组件一致，不开放覆盖。
 *
 * @param {string | URL} value 待检查的链接。
 * @param {object} [options]
 * @param {string} [options.id] `utm_id`，默认 `cover-rc`。
 * @param {string} [options.label] 失败信息里附加的定位描述。
 */
export function assertCampaignUtm(value, { id = DEFAULT_CAMPAIGN_UTM_ID, label } = {}) {
  const url = value instanceof URL ? value : new URL(value);
  const at = label === undefined ? '' : `${label} `;
  assert.equal(url.searchParams.get('utm_source'), 'omnisend', `${at}utm_source`);
  assert.equal(url.searchParams.get('utm_medium'), 'email', `${at}utm_medium`);
  assert.equal(url.searchParams.get('utm_id'), id, `${at}utm_id`);
}
