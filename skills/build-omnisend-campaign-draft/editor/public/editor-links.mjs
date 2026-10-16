import { applyUtm } from './editor-workflow.mjs';

export function setupLinkInspector({ api, getDraft, commitEdits, enqueue, focusField }) {
  const $ = selector => document.querySelector(selector);
  const dialog = $('#links-dialog');
  const rowsElement = $('#links-rows');
  const status = $('#links-status');
  const diffElement = $('#utm-diff');
  const applyButton = $('#apply-utm');
  const parameters = new Map();
  const selected = new Set();
  let rows = [];
  let changes = [];
  let draftId = null;
  let busy = false;
  function invalidate() {
    changes = [];
    diffElement.hidden = true;
    diffElement.replaceChildren();
    applyButton.disabled = true;
  }
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_id', 'utm_content', 'utm_term']) {
    const label = document.createElement('label');
    label.textContent = key;
    const input = document.createElement('input');
    input.name = key;
    input.placeholder = '留空保留原值';
    input.addEventListener('input', invalidate);
    parameters.set(key, input);
    label.append(input);
    $('#utm-fields').append(label);
  }
  const eligible = row => row.editable && /^https:\/\//iu.test(row.url);
  function renderRows() {
    rowsElement.replaceChildren();
    for (const row of rows) {
      const tr = document.createElement('tr');
      const selectCell = document.createElement('td');
      const check = document.createElement('input');
      check.type = 'checkbox';
      check.disabled = !eligible(row) || busy;
      check.checked = selected.has(row.id);
      check.setAttribute('aria-label', `选择 ${row.componentName} ${row.label}`);
      check.addEventListener('change', () => { if (check.checked) selected.add(row.id); else selected.delete(row.id); invalidate(); });
      selectCell.append(check);
      const nameCell = document.createElement('td');
      const name = document.createElement('strong');
      name.textContent = row.componentName;
      const label = document.createElement('div');
      label.textContent = row.label;
      const fields = document.createElement('small');
      fields.textContent = row.editable ? row.fieldKeys.join(' / ') : '固定链接 · 只读';
      nameCell.append(name, label, fields);
      const urlCell = document.createElement('td');
      const url = document.createElement('div');
      url.className = 'link-url';
      url.textContent = row.url;
      const utm = document.createElement('small');
      try {
        const parsed = new URL(row.url);
        utm.textContent = [...parsed.searchParams].filter(([key]) => key.startsWith('utm_')).map(([key, value]) => `${key}=${value}`).join(' · ') || (parsed.protocol === 'https:' ? '未设置 UTM' : '特殊链接，不应用 UTM');
      } catch { utm.textContent = '平台链接令牌'; }
      urlCell.append(url, utm);
      const actionCell = document.createElement('td');
      const locate = document.createElement('button');
      locate.className = 'button';
      locate.textContent = row.editable ? '定位字段' : '定位组件';
      locate.disabled = busy;
      locate.addEventListener('click', async () => {
        dialog.close();
        await focusField(row.instanceId, row.fieldKeys[0]);
      });
      actionCell.append(locate);
      tr.append(selectCell, nameCell, urlCell, actionCell);
      rowsElement.append(tr);
    }
  }
  async function loadRows() {
    const result = await api(`/api/drafts/${draftId}/links`);
    rows = result.links;
    selected.clear();
    invalidate();
    renderRows();
    status.textContent = `${rows.length} 个实际链接；${rows.filter(eligible).length} 个可应用 UTM。未渲染的导航不列入清单。`;
  }
  $('#inspect-links').addEventListener('click', async () => {
    if (!getDraft()?.components.length || !await commitEdits()) return;
    draftId = getDraft().id;
    rows = []; selected.clear(); invalidate(); renderRows();
    status.textContent = '正在读取实际邮件链接…';
    dialog.showModal();
    try { await loadRows(); } catch (error) { status.textContent = `读取失败：${error.message}。关闭后可重新打开。`; }
  });
  $('#close-links').addEventListener('click', () => { if (!busy) dialog.close(); });
  dialog.addEventListener('cancel', event => { if (busy) event.preventDefault(); });
  $('#select-utm-links').addEventListener('click', () => {
    rows.filter(eligible).forEach(row => selected.add(row.id));
    invalidate(); renderRows();
  });
  $('#preview-utm').addEventListener('click', () => {
    invalidate();
    const values = Object.fromEntries([...parameters].map(([key, input]) => [key, input.value]));
    const unique = new Map();
    for (const row of rows.filter(row => selected.has(row.id) && eligible(row))) {
      const after = applyUtm(row.url, values);
      if (after === row.url) continue;
      for (const key of row.fieldKeys) unique.set(`${row.instanceId}:${key}`, { instanceId: row.instanceId, componentName: row.componentName, key, before: row.url, after });
    }
    changes = [...unique.values()];
    for (const change of changes) {
      const item = document.createElement('div');
      const title = document.createElement('strong');
      title.textContent = `${change.componentName} · ${change.key}`;
      const before = document.createElement('div'); before.textContent = `原：${change.before}`;
      const after = document.createElement('div'); after.textContent = `新：${change.after}`;
      item.append(title, before, after); diffElement.append(item);
    }
    diffElement.hidden = !changes.length;
    applyButton.disabled = !changes.length;
    status.textContent = changes.length ? `将修改 ${changes.length} 个字段；同一字段对应的图片和 CTA 链接会一起更新。检查差异后再应用。` : '没有需要修改的字段。请勾选链接并填写至少一个 UTM 参数。';
  });
  applyButton.addEventListener('click', async () => {
    if (busy || !changes.length) return;
    const draft = getDraft();
    if (draft.id !== draftId || changes.some(change => draft.components.find(x => x.instanceId === change.instanceId)?.content[change.key] !== change.before)) {
      invalidate(); status.textContent = '链接已发生变化，请关闭后重新读取并预览。'; return;
    }
    busy = true;
    applyButton.disabled = true;
    $('#close-links').disabled = true;
    $('#preview-utm').disabled = true;
    $('#select-utm-links').disabled = true;
    parameters.forEach(input => { input.disabled = true; });
    renderRows();
    try {
      for (const change of changes) enqueue(change.instanceId, 'content', change.key, change.after);
      if (!await commitEdits()) { status.textContent = '保存未完成，修改已保留在待保存队列。关闭清单后可重试保存。'; invalidate(); return; }
      await loadRows();
      status.textContent = 'UTM 修改已保存；受影响组件需要重新确认。';
    } catch (error) { status.textContent = error.message; invalidate(); }
    finally {
      busy = false;
      $('#close-links').disabled = false;
      $('#preview-utm').disabled = false;
      $('#select-utm-links').disabled = false;
      parameters.forEach(input => { input.disabled = false; });
      renderRows();
    }
  });
}
