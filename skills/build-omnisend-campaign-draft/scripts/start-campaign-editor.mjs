import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCampaignEditorServer } from '../editor/campaign-editor-server.mjs';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(scriptDirectory, '../../..');
const sessionRoot = resolve(workspaceRoot, 'campaign-drafts/editor-sessions');
const port = Number(process.argv[2] ?? 4173);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('port must be an integer from 1 to 65535');

mkdirSync(sessionRoot, { recursive: true });
const editor = await createCampaignEditorServer({ workspaceRoot, sessionRoot });
const url = await editor.listen(port);
console.log(JSON.stringify({ status: 'ready', url, sessionRoot }, null, 2));

for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => editor.close().finally(() => process.exit(0)));
