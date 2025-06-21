import fg from 'fast-glob';
import fs from 'fs';
for (const file of fg.sync(['frontend/**/*.{ts,tsx}'])) {
  const txt = fs.readFileSync(file, 'utf8');
  if (/['"]stream-chat(\/.*)?['"]/.test(txt))
    console.log(file);
}
