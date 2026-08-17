import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const APPROVED_HOST = '127.0.0.1';
const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(scriptDirectory, '../../..');
const validatorScript = resolve(scriptDirectory, 'validate-campaign-contracts.mjs');
const serverScript = resolve(scriptDirectory, 'campaign-editor-server.mjs');

function parseArgs(argv) {
  const options = { noOpen: false, port: 0 };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--no-open') {
      options.noOpen = true;
      continue;
    }
    if (argument === '--port' && argv[index + 1]) {
      options.port = Number(argv[index + 1]);
      index += 1;
      continue;
    }
    throw new Error(`unsupported editor starter option: ${argument}`);
  }
  if (!Number.isInteger(options.port) || options.port < 0 || options.port > 65535) {
    throw new Error('Campaign editor port is invalid');
  }
  return options;
}

function validateContracts() {
  const result = spawnSync(process.execPath, [validatorScript], {
    cwd: workspaceRoot,
    encoding: 'utf8'
  });
  if (result.status !== 0) {
    throw new Error(`Campaign contracts are invalid: ${(result.stderr || result.stdout).trim()}`);
  }
}

function startDetachedServer(port) {
  const child = spawn(process.execPath, [
    serverScript,
    '--workspace', workspaceRoot,
    '--host', APPROVED_HOST,
    '--port', String(port)
  ], {
    cwd: workspaceRoot,
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe']
  });
  child.unref();

  return new Promise((resolveUrl, rejectUrl) => {
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill();
      rejectUrl(new Error('Campaign editor server did not report a URL'));
    }, 10_000);

    function finish() {
      clearTimeout(timer);
      child.stdout.destroy();
      child.stderr.destroy();
    }

    child.stdout.on('data', (chunk) => {
      stdout += chunk;
      const url = stdout.split(/\r?\n/).find((line) => /^http:\/\/127\.0\.0\.1:\d+\/$/.test(line));
      if (url) {
        finish();
        resolveUrl(url);
      }
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.once('error', (error) => {
      finish();
      rejectUrl(error);
    });
    child.once('exit', (code) => {
      if (code !== 0 && !stdout) {
        finish();
        rejectUrl(new Error(stderr.trim() || `Campaign editor server exited with code ${code}`));
      }
    });
  });
}

function openInLocalBrowser(url) {
  const command = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'cmd' : 'xdg-open';
  const args = process.platform === 'win32' ? ['/c', 'start', '', url] : [url];
  const opener = spawn(command, args, { detached: true, stdio: 'ignore' });
  opener.unref();
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!existsSync(validatorScript) || !existsSync(serverScript)) throw new Error('Campaign editor scripts are unavailable');
  validateContracts();
  const url = await startDetachedServer(options.port);
  process.stdout.write(`${url}\n`);
  if (!options.noOpen) openInLocalBrowser(url);
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
