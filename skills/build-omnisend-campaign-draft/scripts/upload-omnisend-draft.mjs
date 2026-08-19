import { createHash } from 'node:crypto';
import { readFile as readFileFromDisk } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const API_ORIGIN = 'https://api.omnisend.com';
const API_VERSION = '2026-03-15';
const UNSUBSCRIBE_TOKEN = '[[unsubscribe_link]]';
const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function isPublicHttps(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && Boolean(url.hostname);
  } catch {
    return false;
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

function extractImage(response) {
  const image = response?.image ?? response?.data ?? response;
  const id = image?.id ?? image?.imageID;
  const url = image?.url ?? image?.imageUrl ?? image?.imageURL;
  assert(typeof id === 'string' && id, 'image upload response is missing image ID');
  assert(isPublicHttps(url), 'image upload response is missing a public HTTPS URL');
  return { id, url };
}

function cachedImage(imageCache, cacheKey) {
  const image = imageCache?.[cacheKey];
  return typeof image?.id === 'string' && image.id && isPublicHttps(image.url) ? image : null;
}

function extractTemplateID(response) {
  const id = response?.id ?? response?.templateID ?? response?.template?.id;
  assert(typeof id === 'string' && id, 'template import response is missing template ID');
  return id;
}

function extractCampaignID(response) {
  const id = response?.id ?? response?.campaignID;
  assert(typeof id === 'string' && id, 'campaign creation response is missing campaign ID');
  return id;
}

function extractContentID(response) {
  const id = response?.content?.email?.contentID ?? response?.contentID ?? response?.emailContentID;
  assert(typeof id === 'string' && id, 'campaign response is missing email content ID');
  return id;
}

function extractSenderName(response) {
  const name = response?.name ?? response?.brand?.name;
  assert(typeof name === 'string' && name.trim(), 'brand readback is missing a sender name');
  return name.trim();
}

function normalizedReadbackContent(response) {
  const serialized = JSON.stringify(response);
  assert(serialized && serialized !== '{}', 'email content readback is empty');
  return serialized;
}

function confirmedPublicUrls(html) {
  return [...new Set([...html.matchAll(/https:\/\/[^\s"')]+/gu)]
    .map(([url]) => url.replaceAll('&amp;', '&')))];
}

function assertDraftSafeRequest({ method, url, body }) {
  const parsed = new URL(url);
  assert(parsed.origin === API_ORIGIN, 'request origin is not allowlisted');
  assert(!parsed.pathname.includes('/send'), 'send endpoint is forbidden');
  assert(!parsed.pathname.includes('/schedule'), 'schedule endpoint is forbidden');
  assert(!parsed.pathname.includes('/publish'), 'publish endpoint is forbidden');
  const allowed = [
    ['POST', '/api/images/upload'],
    ['POST', '/api/email-templates/import'],
    ['POST', '/api/campaigns'],
    ['GET', '/api/brands/current']
  ].some(([allowedMethod, allowedPath]) => method === allowedMethod && parsed.pathname === allowedPath)
    || (method === 'GET' && parsed.pathname === '/api/campaigns' && parsed.searchParams.get('status') === 'draft' && parsed.searchParams.get('limit') === '100')
    || (method === 'GET' && /^\/api\/campaigns\/[^/]+$/u.test(parsed.pathname))
    || (method === 'GET' && /^\/api\/email-content\/[^/]+$/u.test(parsed.pathname))
    || (method === 'PUT' && /^\/api\/email-content\/[^/]+$/u.test(parsed.pathname));
  assert(allowed, `request endpoint is not allowlisted: ${method} ${parsed.pathname}`);
  const serialized = typeof body === 'string' ? body : JSON.stringify(body ?? {});
  assert(!serialized.includes('scheduled'), 'scheduled strategy is forbidden');
}

function preflight(projectState, html) {
  assert(projectState?.finalConfirmation?.status === 'confirmed', 'final confirmation is required before Omnisend upload');
  const expectedHash = projectState.finalConfirmation.confirmedStaticHtmlSha256
    ?? projectState.finalConfirmation.staticHtmlSha256
    ?? projectState.finalConfirmation.htmlSha256;
  assert(typeof expectedHash === 'string' && /^[a-f0-9]{64}$/iu.test(expectedHash), 'confirmed static HTML SHA-256 is required');
  assert(sha256(html) === expectedHash, 'static HTML does not match the confirmed content hash');
  assert(html.includes(UNSUBSCRIBE_TOKEN), 'static HTML is missing the unsubscribe token');
  const campaignID = projectState?.finalConfirmation?.campaignID;
  const contentID = projectState?.finalConfirmation?.contentID;
  assert(!contentID || campaignID, 'existing draft contentID requires a campaignID');
}

function campaignCandidates(response) {
  const list = Array.isArray(response) ? response
    : Array.isArray(response?.items) ? response.items
      : Array.isArray(response?.campaigns) ? response.campaigns
        : Array.isArray(response?.data) ? response.data
          : [];
  return list.filter((campaign) => campaign && typeof campaign === 'object');
}

function mostRecentlyUpdatedMatchingDraft(response, name) {
  const candidates = campaignCandidates(response)
    .filter((campaign) => campaign.status === 'draft' && campaign.name === name && typeof campaign.id === 'string' && campaign.id)
    .sort((left, right) => {
      const rightUpdated = Date.parse(right.updatedAt ?? right.updated_at ?? right.lastUpdatedAt ?? right.createdAt ?? 0) || 0;
      const leftUpdated = Date.parse(left.updatedAt ?? left.updated_at ?? left.lastUpdatedAt ?? left.createdAt ?? 0) || 0;
      return rightUpdated - leftUpdated || String(right.id).localeCompare(String(left.id));
    });
  return candidates[0] ?? null;
}

function validateReferencedAssetMetadata(projectState, html) {
  validateAssetMetadata(projectState.assets ?? {}, html);
}

function validateAssetMetadata(assets, html) {
  for (const key of new Set(assetReferences(html))) {
    const asset = assets[key];
    assert(asset?.localPath && asset?.name && asset?.mimeType, `local asset ${key} is missing upload metadata`);
    assert(IMAGE_MIME_TYPES.has(asset.mimeType), `local asset ${key} must be JPEG, PNG, GIF, or WebP`);
  }
}

function confirmedHtmlContent(response) {
  assert(response?.generalSettings && typeof response.generalSettings === 'object', 'existing email content is missing generalSettings');
  assert(Array.isArray(response?.sections), 'existing email content is missing sections');
  const body = structuredClone({ generalSettings: response.generalSettings, sections: response.sections });
  const htmlBlocks = [];
  const blockTypeCounts = new Map();
  const tokenFields = [];
  const visit = (value, path) => {
    if (!value || typeof value !== 'object') return;
    if (typeof value.htmlCode === 'string') htmlBlocks.push({ owner: value, key: 'htmlCode' });
    if (value.type === 'htmlCode' && value.htmlCode && typeof value.htmlCode === 'object' && typeof value.htmlCode.body === 'string') {
      htmlBlocks.push({ owner: value.htmlCode, key: 'body' });
    }
    if (/\.blocks\[\d+\]$/u.test(path) && typeof value.type === 'string') {
      blockTypeCounts.set(value.type, (blockTypeCounts.get(value.type) ?? 0) + 1);
    }
    for (const [key, nested] of Object.entries(value)) {
      const nestedPath = Array.isArray(value) ? `${path}[${key}]` : `${path}.${key}`;
      if (typeof nested === 'string' && nested.includes(UNSUBSCRIBE_TOKEN)) tokenFields.push(nestedPath);
      else visit(nested, nestedPath);
    }
  };
  visit(body.sections, 'sections');
  const unsubscribeBlocks = htmlBlocks.filter(({ owner, key }) => owner[key].includes(UNSUBSCRIBE_TOKEN));
  const blockTypes = [...blockTypeCounts.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([type, count]) => `${type}:${count}`).join('|') || 'none';
  const tokenFieldSummary = tokenFields.slice(0, 3).join('|') || 'none';
  assert(
    unsubscribeBlocks.length === 1,
    `existing email content must contain exactly one HTML block with the unsubscribe token (htmlBlocks=${htmlBlocks.length}, unsubscribeBlocks=${unsubscribeBlocks.length}, blockTypes=${blockTypes}, tokenFields=${tokenFieldSummary})`
  );
  return { body, target: unsubscribeBlocks[0] };
}

function replaceConfirmedHtmlBlock(response, html) {
  const { body, target } = confirmedHtmlContent(response);
  target.owner[target.key] = html;
  return body;
}

function readbackContainsUrl(readbackContent, url) {
  return readbackContent.includes(url) || readbackContent.includes(url.replaceAll('&', '&amp;'));
}

function attributeValues(html, name) {
  return [...html.matchAll(new RegExp(`${escapeRegExp(name)}="([^"]+)"`, 'gu'))].map(([, value]) => value);
}

function omnisendImageUrls(html) {
  return new Set(html.match(/https:\/\/app\.omnisend\.com\/images\/[A-Za-z0-9._-]+/gu) ?? []);
}

function decodeCommonHtmlEntities(value) {
  return value
    .replaceAll('&nbsp;', ' ')
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');
}

function normalizedVisibleText(html) {
  return decodeCommonHtmlEntities(html.replace(/<!--[\s\S]*?-->/gu, ' ').replace(/<[^>]+>/gu, ' ')).replace(/\s+/gu, ' ').trim();
}

function verifyReadbackSemantics(expectedHtml, remoteHtml) {
  assert(!remoteHtml.includes('asset://'), 'email content readback still contains local asset references');
  assert(!/(?:file:|src\s*=\s*["'](?:\.\.?\/))/iu.test(remoteHtml), 'email content readback contains a local or relative asset path');
  for (const url of confirmedPublicUrls(expectedHtml)) {
    assert(readbackContainsUrl(remoteHtml, url), `email content readback is missing URL ${url}`);
  }
  const expectedVisibleText = normalizedVisibleText(expectedHtml);
  const remoteVisibleText = normalizedVisibleText(remoteHtml);
  assert(
    remoteVisibleText === expectedVisibleText,
    `email content readback visible text or component order does not match (expected=${sha256(expectedVisibleText)}, actual=${sha256(remoteVisibleText)})`
  );
  const expectedAlts = attributeValues(expectedHtml, 'alt').map(decodeCommonHtmlEntities);
  const remoteAlts = new Set(attributeValues(remoteHtml, 'alt').map(decodeCommonHtmlEntities));
  const missingAlts = expectedAlts.filter((alt) => !remoteAlts.has(alt));
  assert(missingAlts.length === 0, `email content readback is missing image alt text: ${missingAlts.slice(0, 3).join(', ')}`);
  const expectedKnownImages = omnisendImageUrls(expectedHtml);
  const remoteImages = omnisendImageUrls(remoteHtml);
  const replacementImages = [...remoteImages].filter((url) => !expectedKnownImages.has(url));
  const expectedAssetCount = new Set(assetReferences(expectedHtml)).size;
  assert(
    replacementImages.length >= expectedAssetCount,
    `email content readback has too few uploaded image replacements (expected=${expectedAssetCount}, actual=${replacementImages.length})`
  );
  return { verifiedAssetCount: expectedAssetCount, verifiedAltCount: expectedAlts.length, visibleTextSha256: sha256(remoteVisibleText) };
}

function assetReferences(html) {
  return [...html.matchAll(/asset:\/\/([A-Za-z0-9._-]+)/gu)].map(([, key]) => key);
}

function redactSecret(value, secret) {
  return typeof value === 'string' && secret ? value.split(secret).join('[REDACTED]') : value;
}

function apiFailureDetail(response) {
  const value = JSON.stringify(response?.json ?? {});
  return value.length > 1000 ? `${value.slice(0, 1000)}…` : value;
}

function assertResponseStatus(response, expectedStatus, label) {
  assert(response.status === expectedStatus, `${label} failed with status ${response.status}: ${apiFailureDetail(response)}`);
}

function assertImageExportRequest({ method, url }) {
  const parsed = new URL(url);
  assert(parsed.origin === API_ORIGIN, 'request origin is not allowlisted');
  assert(method === 'POST' && parsed.pathname === '/api/images/upload', `request endpoint is not allowlisted: ${method} ${parsed.pathname}`);
}

async function uploadAndReplaceLocalAssets({ html, assets, readFile, request, imageCache = {} }) {
  validateAssetMetadata(assets, html);
  let finalHtml = html;
  const uploadedImageIDs = [];
  const reusedImageIDs = [];
  for (const key of new Set(assetReferences(html))) {
    const asset = assets[key];
    const bytes = await readFile(asset.localPath);
    assert(bytes.byteLength <= MAX_IMAGE_BYTES, `local asset ${key} exceeds Omnisend's 5 MB limit`);
    const cacheKey = sha256(bytes);
    let image = cachedImage(imageCache, cacheKey);
    if (image) {
      reusedImageIDs.push(image.id);
    } else {
      const form = new FormData();
      form.append('file', new Blob([bytes], { type: asset.mimeType }), asset.name);
      form.append('name', asset.name);
      const upload = await request({ method: 'POST', url: `${API_ORIGIN}/api/images/upload`, body: form });
      assertResponseStatus(upload, 201, 'image upload');
      image = extractImage(upload.json);
      imageCache[cacheKey] = image;
      uploadedImageIDs.push(image.id);
    }
    finalHtml = finalHtml.replace(new RegExp(`asset://${escapeRegExp(key)}`, 'gu'), image.url);
  }
  return { finalHtml, uploadedImageIDs, reusedImageIDs };
}

function assertExportSafeHtml(html) {
  assert(typeof html === 'string' && html, 'static HTML is required');
  assert(!html.includes('asset://'), 'final HTML still contains local assets');
  assert(!/(?:file:|(?:src|background)\s*=\s*["'](?:\.\.?\/|\/))/iu.test(html), 'final HTML contains a local or relative asset path');
  assert(!/url\(\s*["']?(?:\.\.?\/|file:)/iu.test(html), 'final HTML contains a local or relative CSS asset path');
  assert(!/\{\{(?:content|settings)\./u.test(html), 'final HTML contains unresolved component placeholders');
}

export function createOmnisendHtmlExportTransaction({ html, assets, readFile, transport, imageCache = {} }) {
  assert(typeof html === 'string' && html, 'static HTML is required');
  assert(assets && typeof assets === 'object' && !Array.isArray(assets), 'assets are required');
  assert(typeof readFile === 'function', 'readFile is required');
  assert(typeof transport === 'function', 'transport is required');
  assert(imageCache && typeof imageCache === 'object' && !Array.isArray(imageCache), 'image cache must be an object');

  async function request(apiKey, requestData) {
    assertImageExportRequest(requestData);
    const response = await transport({
      ...requestData,
      headers: {
        Accept: 'application/json',
        Authorization: `Omnisend-API-Key ${apiKey}`,
        'Omnisend-Version': API_VERSION,
        ...(requestData.headers ?? {})
      }
    });
    assert(Number.isInteger(response?.status), 'API response has no status');
    return response;
  }

  return {
    async run(apiKey) {
      try {
        assert(typeof apiKey === 'string' && apiKey.trim(), 'a non-empty runtime API key is required');
        const { finalHtml, uploadedImageIDs, reusedImageIDs } = await uploadAndReplaceLocalAssets({
          html,
          assets,
          readFile,
          request: (requestData) => request(apiKey, requestData),
          imageCache
        });
        assertExportSafeHtml(finalHtml);
        return { html: finalHtml, htmlSha256: sha256(finalHtml), uploadedImageIDs, reusedImageIDs };
      } catch (error) {
        throw new Error(redactSecret(error instanceof Error ? error.message : String(error), apiKey));
      } finally {
        apiKey = '';
      }
    }
  };
}

export function createDraftUploadTransaction({ projectState, html, readFile, transport, now = () => new Date().toISOString() }) {
  assert(typeof html === 'string' && html, 'static HTML is required');
  assert(typeof readFile === 'function', 'readFile is required');
  assert(typeof transport === 'function', 'transport is required');

  async function request(apiKey, requestData) {
    assertDraftSafeRequest(requestData);
    const response = await transport({
      ...requestData,
      headers: {
        Accept: 'application/json',
        Authorization: `Omnisend-API-Key ${apiKey}`,
        'Omnisend-Version': API_VERSION,
        ...(requestData.headers ?? {})
      }
    });
    assert(Number.isInteger(response?.status), 'API response has no status');
    return response;
  }

  return {
    preflight: () => preflight(projectState, html),
    async verifyExisting(apiKey) {
      try {
        assert(typeof apiKey === 'string' && apiKey.trim(), 'a non-empty runtime API key is required');
        preflight(projectState, html);
        const campaignID = projectState?.finalConfirmation?.campaignID;
        const contentID = projectState?.finalConfirmation?.contentID;
        assert(campaignID, 'verify-existing requires a confirmed campaignID');
        const campaignReadback = await request(apiKey, { method: 'GET', url: `${API_ORIGIN}/api/campaigns/${campaignID}` });
        assertResponseStatus(campaignReadback, 200, 'campaign readback');
        assert(campaignReadback.json?.status === 'draft', 'campaign readback is not draft');
        const resolvedContentID = extractContentID(campaignReadback.json);
        assert(!contentID || resolvedContentID === contentID, 'campaign readback content ID does not match');
        const contentReadback = await request(apiKey, { method: 'GET', url: `${API_ORIGIN}/api/email-content/${resolvedContentID}` });
        assertResponseStatus(contentReadback, 200, 'email content readback');
        const { target } = confirmedHtmlContent(contentReadback.json);
        const remoteHtml = target.owner[target.key];
        assert(remoteHtml.includes(UNSUBSCRIBE_TOKEN), 'email content readback is missing the unsubscribe token');
        const semanticVerification = verifyReadbackSemantics(html, remoteHtml);
        return {
          operation: 'verified-existing-update',
          campaignID,
          contentID: resolvedContentID,
          verifiedAt: now(),
          status: 'draft',
          remoteHtmlSha256: sha256(remoteHtml),
          readbackContentSha256: sha256(normalizedReadbackContent(contentReadback.json)),
          componentOrder: Object.keys(projectState.components ?? {}),
          ...semanticVerification,
          readbackVerified: true
        };
      } catch (error) {
        throw new Error(redactSecret(error instanceof Error ? error.message : String(error), apiKey));
      }
    },
    async run(apiKey) {
      try {
        assert(typeof apiKey === 'string' && apiKey.trim(), 'a non-empty runtime API key is required');
        preflight(projectState, html);
        validateReferencedAssetMetadata(projectState, html);
        let existingCampaignID;
        let existingContentID;
        let existingContent;
        const campaignList = await request(apiKey, { method: 'GET', url: `${API_ORIGIN}/api/campaigns?status=draft&limit=100` });
        assertResponseStatus(campaignList, 200, 'draft campaign search');
        const match = mostRecentlyUpdatedMatchingDraft(campaignList.json, projectState.campaign?.name);
        if (match) existingCampaignID = match.id;
        if (existingCampaignID) {
          const existingCampaign = await request(apiKey, { method: 'GET', url: `${API_ORIGIN}/api/campaigns/${existingCampaignID}` });
          assertResponseStatus(existingCampaign, 200, 'existing campaign readback');
          assert(existingCampaign.json?.status === 'draft', 'existing campaign is not draft');
          const resolvedContentID = extractContentID(existingCampaign.json);
          assert(!existingContentID || resolvedContentID === existingContentID, 'existing campaign content ID does not match the confirmed project state');
          existingContentID = resolvedContentID;
          const existingContentReadback = await request(apiKey, { method: 'GET', url: `${API_ORIGIN}/api/email-content/${existingContentID}` });
          assertResponseStatus(existingContentReadback, 200, 'existing email content readback');
          replaceConfirmedHtmlBlock(existingContentReadback.json, html);
          existingContent = existingContentReadback.json;
        }
        const { finalHtml, uploadedImageIDs } = await uploadAndReplaceLocalAssets({
          html,
          assets: projectState.assets ?? {},
          readFile,
          request: (requestData) => request(apiKey, requestData)
        });
        assert(!finalHtml.includes('asset://'), 'final HTML still contains local assets');
        assert(!/(?:file:|src\s*=\s*["'](?:\.\.?\/))/iu.test(finalHtml), 'final HTML contains a local or relative asset path');
        assert(finalHtml.includes(UNSUBSCRIBE_TOKEN), 'final HTML is missing the unsubscribe token after upload');

        if (existingCampaignID) {
          const updateBody = replaceConfirmedHtmlBlock(existingContent, finalHtml);
          const update = await request(apiKey, {
            method: 'PUT',
            url: `${API_ORIGIN}/api/email-content/${existingContentID}`,
            headers: { 'Content-Type': 'application/json' },
            body: updateBody
          });
          assertResponseStatus(update, 200, 'email content update');
          const campaignReadback = await request(apiKey, { method: 'GET', url: `${API_ORIGIN}/api/campaigns/${existingCampaignID}` });
          assertResponseStatus(campaignReadback, 200, 'campaign readback');
          assert(campaignReadback.json?.status === 'draft', 'campaign readback is not draft');
          assert(extractContentID(campaignReadback.json) === existingContentID, 'campaign readback content ID does not match');
          const contentReadback = await request(apiKey, { method: 'GET', url: `${API_ORIGIN}/api/email-content/${existingContentID}` });
          assertResponseStatus(contentReadback, 200, 'email content readback');
          const readbackContent = normalizedReadbackContent(contentReadback.json);
          assert(readbackContent.includes(UNSUBSCRIBE_TOKEN), 'email content readback is missing the unsubscribe token');
          for (const url of confirmedPublicUrls(finalHtml)) {
            assert(readbackContainsUrl(readbackContent, url), `email content readback is missing URL ${url}`);
          }
          return {
            operation: 'updated',
            campaignID: existingCampaignID,
            contentID: existingContentID,
            uploadedImageIDs,
            uploadedAt: now(),
            status: 'draft',
            htmlSha256: sha256(finalHtml),
            readbackContentSha256: sha256(readbackContent),
            componentOrder: Object.keys(projectState.components ?? {}),
            readbackVerified: true
          };
        }

        const brand = await request(apiKey, { method: 'GET', url: `${API_ORIGIN}/api/brands/current` });
        assertResponseStatus(brand, 200, 'brand readback');
        const senderName = projectState.campaign?.senderName?.trim() || extractSenderName(brand.json);

        const template = await request(apiKey, {
          method: 'POST',
          url: `${API_ORIGIN}/api/email-templates/import`,
          headers: { 'Content-Type': 'application/json' },
          body: { name: `${projectState.campaign?.name ?? 'Campaign'} — ${now()}`, html: finalHtml }
        });
        assertResponseStatus(template, 201, 'template import');
        const templateID = extractTemplateID(template.json);
        const campaign = await request(apiKey, {
          method: 'POST',
          url: `${API_ORIGIN}/api/campaigns`,
          headers: { 'Content-Type': 'application/json' },
          body: {
            name: projectState.campaign?.name,
            type: 'regular',
            channel: 'email',
            language: 'en_US',
            content: { email: { subject: projectState.campaign?.subject, senderName, preheader: projectState.campaign?.preheader, templateID } },
            audience: { includedSegmentIDs: [] },
            sendingSettings: { strategy: 'immediate' }
          }
        });
        assertResponseStatus(campaign, 201, 'campaign creation');
        const campaignID = extractCampaignID(campaign.json);
        const contentID = extractContentID(campaign.json);
        assert(campaign.json.status === 'draft', 'campaign creation did not return draft status');

        const campaignReadback = await request(apiKey, { method: 'GET', url: `${API_ORIGIN}/api/campaigns/${campaignID}` });
        assertResponseStatus(campaignReadback, 200, 'campaign readback');
        assert(campaignReadback.json?.status === 'draft', 'campaign readback is not draft');
        assert(extractContentID(campaignReadback.json) === contentID, 'campaign readback content ID does not match');
        const contentReadback = await request(apiKey, { method: 'GET', url: `${API_ORIGIN}/api/email-content/${contentID}` });
        assertResponseStatus(contentReadback, 200, 'email content readback');
        const readbackContent = normalizedReadbackContent(contentReadback.json);
        assert(readbackContent.includes(UNSUBSCRIBE_TOKEN), 'email content readback is missing the unsubscribe token');
        for (const url of confirmedPublicUrls(finalHtml)) {
          assert(readbackContainsUrl(readbackContent, url), `email content readback is missing URL ${url}`);
        }
        return {
          operation: 'created',
          campaignID,
          contentID,
          templateID,
          uploadedImageIDs,
          uploadedAt: now(),
          status: 'draft',
          htmlSha256: sha256(finalHtml),
          readbackContentSha256: sha256(readbackContent),
          componentOrder: Object.keys(projectState.components ?? {}),
          readbackVerified: true
        };
      } catch (error) {
        throw new Error(redactSecret(error instanceof Error ? error.message : String(error), apiKey));
      }
    }
  };
}

export function parseCliArgs(argv) {
  const values = {};
  let verifyExisting = false;
  for (let index = 0; index < argv.length; index += 1) {
    const option = argv[index];
    if (option === '--verify-existing') {
      assert(!verifyExisting, 'duplicate option: --verify-existing');
      verifyExisting = true;
      continue;
    }
    assert(option === '--project' || option === '--html', `unsupported option: ${option}`);
    assert(!values[option], `duplicate option: ${option}`);
    const value = argv[index + 1];
    assert(typeof value === 'string' && value && !value.startsWith('--'), `missing value for ${option}`);
    values[option] = value;
    index += 1;
  }
  assert(values['--project'] && values['--html'], 'usage: upload-omnisend-draft.mjs --project <project-state.v1.json> --html <campaign.static-safe.html> [--verify-existing]');
  return { projectPath: resolve(values['--project']), htmlPath: resolve(values['--html']), verifyExisting };
}

async function promptHiddenSecret(input = process.stdin, output = process.stderr) {
  assert(input.isTTY, 'Omnisend API key must be entered through an interactive terminal');
  output.write('Omnisend API Key: ');
  input.setEncoding('utf8');
  input.setRawMode(true);
  input.resume();
  return new Promise((resolvePromise, reject) => {
    let value = '';
    const cleanup = () => {
      input.off('data', onData);
      input.setRawMode(false);
      input.pause();
      output.write('\n');
    };
    const onData = (chunk) => {
      for (const character of chunk) {
        if (character === '\u0003') {
          cleanup();
          reject(new Error('API key entry cancelled'));
          return;
        }
        if (character === '\r' || character === '\n') {
          cleanup();
          resolvePromise(value);
          return;
        }
        if (character === '\u007f' || character === '\b') value = value.slice(0, -1);
        else value += character;
      }
    };
    input.on('data', onData);
  });
}

function createFetchTransport() {
  return async ({ method, url, headers, body }) => {
    const requestHeaders = { ...headers };
    let requestBody = body;
    if (body && !(body instanceof FormData)) requestBody = JSON.stringify(body);
    if (body && !(body instanceof FormData)) requestHeaders['Content-Type'] = requestHeaders['Content-Type'] ?? 'application/json';
    const response = await fetch(url, { method, headers: requestHeaders, body: requestBody });
    const text = await response.text();
    let json;
    try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
    return { status: response.status, json };
  };
}

export async function runOmnisendHtmlExportWithApiKey({ html, assets, apiKey, imageCache = {} }) {
  assert(typeof apiKey === 'string' && apiKey.trim(), 'a non-empty runtime API key is required');
  const transaction = createOmnisendHtmlExportTransaction({
    html,
    assets,
    imageCache,
    readFile: (path) => readFileFromDisk(path),
    transport: createFetchTransport()
  });
  try {
    return await transaction.run(apiKey);
  } finally {
    apiKey = '';
  }
}

export async function runDraftUploadWithApiKey({ projectPath, htmlPath, apiKey, verifyExisting = false }) {
  assert(typeof apiKey === 'string' && apiKey.trim(), 'a non-empty runtime API key is required');
  const [projectSource, html] = await Promise.all([readFileFromDisk(projectPath, 'utf8'), readFileFromDisk(htmlPath, 'utf8')]);
  const projectState = JSON.parse(projectSource);
  const transaction = createDraftUploadTransaction({
    projectState,
    html,
    readFile: (path) => readFileFromDisk(resolve(dirname(projectPath), path)),
    transport: createFetchTransport()
  });
  transaction.preflight();
  try {
    return verifyExisting ? await transaction.verifyExisting(apiKey) : await transaction.run(apiKey);
  } finally {
    apiKey = '';
  }
}

export async function runCli(argv = process.argv.slice(2)) {
  const { projectPath, htmlPath, verifyExisting } = parseCliArgs(argv);
  let apiKey = await promptHiddenSecret();
  try {
    const receipt = await runDraftUploadWithApiKey({ projectPath, htmlPath, apiKey, verifyExisting });
    process.stdout.write(`${JSON.stringify(receipt)}\n`);
  } finally {
    apiKey = '';
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runCli().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
