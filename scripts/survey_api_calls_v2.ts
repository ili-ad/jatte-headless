import fs from 'fs/promises';
import path from 'path';
import fg from 'fast-glob';

interface Finding {
  effectivePath: string;
  file: string;
  line: number;
  hasTrailingSlash: boolean;
  sourceKind: 'literal' | 'axiosBaseUrl' | 'helper';
  rawPath: string;
}

const patterns = [
  'frontend/src/**/*.{ts,tsx,js,jsx}',
  'frontend/tests/**/*.{ts,tsx,js,jsx}',
  'frontend/stubs/**/*.{ts,tsx,js,jsx}',
  'libs/**/*.{ts,tsx,js,jsx}',
];

const OUTPUT_PATH = path.join('frontend', 'DOCS', 'api-callsite-survey.v2.md');

function indexToLine(text: string, index: number): number {
  return text.slice(0, index).split(/\n/).length;
}

function normalizePath(rawPath: string): string {
  const trimmed = rawPath.trim();
  const withoutQuery = trimmed.replace(/[?#].*$/, '');
  return withoutQuery;
}

function joinWithApi(relativePath: string): string {
  const normalized = normalizePath(relativePath);
  if (!normalized) {
    return '/api';
  }
  const leading = normalized.startsWith('/') ? normalized : `/${normalized}`;
  return `/api${leading}`;
}

function hasTrailingSlash(pathStr: string): boolean {
  return pathStr.endsWith('/');
}

async function main() {
  const files = await fg(patterns, {
    ignore: ['**/node_modules/**'],
    dot: false,
    onlyFiles: true,
  });

  const findings: Finding[] = [];

  for (const file of files) {
    const text = await fs.readFile(file, 'utf8');
    const lines = text.split(/\r?\n/);

    const baseIdentifiers = new Set<string>();
    const axiosClients = new Set<string>();
    const helpers: Array<{ name: string; param: string }> = [];

    lines.forEach((line) => {
      const baseMatch = line.match(/const\s+([A-Za-z_$][\w$]*)\s*=\s*['"]\/api['"]/);
      if (baseMatch) {
        baseIdentifiers.add(baseMatch[1]);
      }
    });

    const axiosClientRegex = /const\s+([A-Za-z_$][\w$]*)\s*=\s*axios\.create\(\s*\{[\s\S]*?baseURL\s*:\s*['"]\/api['"][\s\S]*?\}\s*\)/gm;
    let axiosClientMatch: RegExpExecArray | null;
    while ((axiosClientMatch = axiosClientRegex.exec(text)) !== null) {
      axiosClients.add(axiosClientMatch[1]);
    }

    const arrowHelperRegex = /(const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*\(\s*(\w+)[^)]*\)\s*=>\s*([\s\S]*?);/gm;
    let arrowMatch: RegExpExecArray | null;
    while ((arrowMatch = arrowHelperRegex.exec(text)) !== null) {
      const [, , name, param, body] = arrowMatch;
      if (/\/api\$\{\s*${param}\s*\}/.test(body) || /\/api\/\$\{\s*${param}\s*\}/.test(body)) {
        helpers.push({ name, param });
      }
    }

    const functionHelperRegex = /function\s+([A-Za-z_$][\w$]*)\s*\(\s*(\w+)\s*[^)]*\)\s*\{([\s\S]*?)\}/gm;
    let funcMatch: RegExpExecArray | null;
    while ((funcMatch = functionHelperRegex.exec(text)) !== null) {
      const [, name, param, body] = funcMatch;
      if (/\/api\$\{\s*${param}\s*\}/.test(body) || /\/api\/\$\{\s*${param}\s*\}/.test(body)) {
        helpers.push({ name, param });
      }
    }

    lines.forEach((line, idx) => {
      const literalRegex = /\/api\/[^\s'"`?#)]+/g;
      let literalMatch: RegExpExecArray | null;
      while ((literalMatch = literalRegex.exec(line)) !== null) {
        const pathPart = normalizePath(literalMatch[0]);
        const effectivePath = pathPart;
        findings.push({
          effectivePath,
          file,
          line: idx + 1,
          hasTrailingSlash: hasTrailingSlash(effectivePath),
          sourceKind: 'literal',
          rawPath: pathPart,
        });
      }
    });

    lines.forEach((line, idx) => {
      for (const baseId of baseIdentifiers) {
        const templateRegex = new RegExp("\\b(?:fetch|axios\\.[A-Za-z]+)\\(\\s*\\`\\$\\{" + baseId + "\\}([^\\`]*)\\`", 'g');
        let tempMatch: RegExpExecArray | null;
        while ((tempMatch = templateRegex.exec(line)) !== null) {
          const relative = tempMatch[1] || '';
          const effectivePath = joinWithApi(relative);
          findings.push({
            effectivePath,
            file,
            line: idx + 1,
            hasTrailingSlash: hasTrailingSlash(effectivePath),
            sourceKind: 'axiosBaseUrl',
            rawPath: relative,
          });
        }

        const concatRegex = new RegExp("\\b(?:fetch|axios\\.[A-Za-z]+)\\(\\s*" + baseId + "\\s*\\+\\s*(['\"`])([^'\"`]+)\\1");
        const concatMatch = concatRegex.exec(line);
        if (concatMatch) {
          const relative = concatMatch[2];
          const effectivePath = joinWithApi(relative);
          findings.push({
            effectivePath,
            file,
            line: idx + 1,
            hasTrailingSlash: hasTrailingSlash(effectivePath),
            sourceKind: 'axiosBaseUrl',
            rawPath: relative,
          });
        }
      }

      for (const client of axiosClients) {
        const clientRegex = new RegExp(`\\b${client}\\.(get|post|put|patch|delete|request)\\(\\s*([\\'\\"\`])([^\\'\\"\`]+)\\2`, 'g');
        let clientMatch: RegExpExecArray | null;
        while ((clientMatch = clientRegex.exec(line)) !== null) {
          const relative = clientMatch[3];
          const effectivePath = joinWithApi(relative);
          findings.push({
            effectivePath,
            file,
            line: idx + 1,
            hasTrailingSlash: hasTrailingSlash(effectivePath),
            sourceKind: 'axiosBaseUrl',
            rawPath: relative,
          });
        }
      }

      for (const helper of helpers) {
        const helperRegex = new RegExp(`\\b${helper.name}\\(\\s*([\\'\\"\`])([^\\'\\"\`]+)\\1`, 'g');
        let helperMatch: RegExpExecArray | null;
        while ((helperMatch = helperRegex.exec(line)) !== null) {
          const relative = helperMatch[2];
          const effectivePath = joinWithApi(relative);
          findings.push({
            effectivePath,
            file,
            line: idx + 1,
            hasTrailingSlash: hasTrailingSlash(effectivePath),
            sourceKind: 'helper',
            rawPath: relative,
          });
        }
      }
    });
  }

  const grouped = new Map<string, Finding[]>();
  for (const finding of findings) {
    const list = grouped.get(finding.effectivePath) ?? [];
    list.push(finding);
    grouped.set(finding.effectivePath, list);
  }

  const sortedPaths = Array.from(grouped.keys()).sort((a, b) => a.localeCompare(b));
  const totalCallsites = findings.length;
  const uniquePaths = sortedPaths.length;
  const noTrailingSlash = findings.filter((f) => !f.hasTrailingSlash).length;
  const frontendFindings = findings.filter((f) => f.file.startsWith('frontend/')).length;
  const libsFindings = findings.filter((f) => f.file.startsWith('libs/')).length;

  const lines: string[] = [];
  lines.push('# API callsite survey v2');
  lines.push('');
  lines.push('_Generated by `scripts/survey_api_calls_v2.ts`_');
  lines.push('');
  lines.push('> Note: In Next.js projects with `trailingSlash: false`, `/api/foo/` will redirect (308) to `/api/foo`. This report lists source callsites and may show both forms when present.');
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`Total callsites analyzed: ${totalCallsites}`);
  lines.push(`Unique suspected \`/api/…\` paths: ${uniquePaths}`);
  lines.push(`Callsites without trailing slash: ${noTrailingSlash}`);
  lines.push(`Location breakdown — frontend: ${frontendFindings}; libs: ${libsFindings}`);
  lines.push('');
  lines.push('### Heuristics');
  lines.push('- **A: direct literals** — string or template literals containing `/api/…`.');
  lines.push('- **B: axios/fetch base URL** — local base variables or axios instances with `baseURL: "/api"` combined with relative paths.');
  lines.push('- **C: helper wrappers** — helper functions that prepend `/api` to a provided path, plus same-file callsites.');
  lines.push('');
  lines.push('## Endpoints');
  lines.push('');

  for (const effectivePath of sortedPaths) {
    lines.push(`### \`${effectivePath}\``);
    const entries = grouped.get(effectivePath)!;
    for (const entry of entries.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line)) {
      const relativeFile = path.posix.normalize(entry.file);
      lines.push(`- \`${relativeFile}:${entry.line}\` (${entry.sourceKind})`);
    }
    lines.push('');
  }

  await fs.writeFile(OUTPUT_PATH, lines.join('\n'));
  console.log(`Wrote ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
