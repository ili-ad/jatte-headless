// scripts/rewire-imports.ts
import { Project, SyntaxKind } from 'ts-morph';
import fg from 'fast-glob';
import path from 'path';

const targets = process.argv.slice(2);
if (targets.length === 0) {
  console.error('Usage: pnpm ts-node scripts/rewire-imports.ts <folder> [folder2 …]');
  process.exit(1);
}

// 1. gather files -----------------------------------------------------------
const files = fg.sync(
  targets.map((p) => path.join(p, '**/*.{ts,tsx}')),
  { absolute: true },
);

// 2. open with ts-morph ------------------------------------------------------
const project = new Project({
  tsConfigFilePath: 'tsconfig.json',
  skipAddingFilesFromTsConfig: true,
});
project.addSourceFilesAtPaths(files);

// 3. rewrite imports --------------------------------------------------------
const fromReact = /^stream-chat-react(?=$|\/)/;
const fromSDK   = /^stream-chat(?=$|\/)/;

project.getSourceFiles().forEach((sf) => {
  let touched = false;

  sf.getImportDeclarations().forEach((imp) => {
    const oldPath = imp.getModuleSpecifierValue();

    if (fromReact.test(oldPath)) {
      imp.setModuleSpecifier(oldPath.replace(fromReact, 'stream-chat-shim'));
      touched = true;
    } else if (fromSDK.test(oldPath)) {
      imp.setModuleSpecifier(oldPath.replace(fromSDK, 'chat-shim'));
      touched = true;
    }
  });

  if (touched) sf.saveSync();
});

console.log(`✔ Rewired ${project.getSourceFiles().length} file(s).`);
