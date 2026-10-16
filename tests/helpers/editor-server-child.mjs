import { createCampaignEditorServer } from '../../skills/build-omnisend-campaign-draft/editor/campaign-editor-server.mjs';

const [workspaceRoot, sessionRoot, templateRoot] = process.argv.slice(2);
const noExternalWrites = async () => { throw new Error('external writes disabled in regression tests'); };
const server = await createCampaignEditorServer({ workspaceRoot, sessionRoot, templateRoot,
  runDraftUploader: noExternalWrites, runHtmlExporter: noExternalWrites });
process.send({ url: await server.listen() });
process.on('message', async message => {
  if (message === 'close') {
    await server.close();
    process.disconnect();
  }
});
