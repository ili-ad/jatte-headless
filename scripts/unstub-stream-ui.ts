import fg from 'fast-glob';
import fs from 'fs/promises';
import path from 'path';
import cp from 'child_process';

const SHIM_SRC = path.resolve(__dirname, '../libs/stream-chat-shim/src');
const UI_SRC = path.resolve(__dirname, '../libs/stream-ui/src');

async function processFile(shimFile: string) {
  let txt = await fs.readFile(shimFile, 'utf8');
  if (!txt.includes('TODO backend-wire-up')) return;
  const rel = path.relative(SHIM_SRC, shimFile);
  const uiFile = path.join(UI_SRC, rel);
  let imports: string[] = [];
  try {
    const upstream = await fs.readFile(uiFile, 'utf8');
    imports = upstream
      .split(/\r?\n/)
      .filter((l) => l.trim().startsWith('import') &&
        /(stream-chat(?:-react)?)/.test(l));
  } catch {
    // no upstream file
  }
  const lines = txt.split(/\r?\n/);
  const cleaned: string[] = [];
  for (const line of lines) {
    if (line.includes('TODO backend-wire-up')) continue;
    if (/^class \w+Controller/.test(line.trim())) continue;
    cleaned.push(line);
  }
  if (imports.length) {
    const firstNonImport = cleaned.findIndex((l) => !l.startsWith('import'));
    const idx = firstNonImport === -1 ? cleaned.length : firstNonImport;
    cleaned.splice(idx, 0, ...imports);
  }
  await fs.writeFile(shimFile, cleaned.join('\n'));
  console.log('patched', rel);
}

async function main() {
  for (const file of fg.sync('**/*.{ts,tsx}', { cwd: SHIM_SRC, absolute: true })) {
    await processFile(file);
  }
  try {
    cp.execSync('pnpm build && pnpm -F frontend tsc --noEmit', { stdio: 'inherit' });
  } catch {
    process.exit(1);
  }
}

main();
