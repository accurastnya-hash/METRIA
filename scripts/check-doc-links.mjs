import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const markdownFiles = [];

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.git') continue;
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(target);
    else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) markdownFiles.push(target);
  }
}

await walk(root);
const errors = [];
for (const markdownFile of markdownFiles) {
  const content = await readFile(markdownFile, 'utf8');
  const links = content.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g);
  for (const match of links) {
    const target = match[1].trim().replace(/^<|>$/g, '').split(/\s+/, 1)[0];
    if (!target || /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(target)) continue;
    const pathname = decodeURIComponent(target.split('#', 1)[0].split('?', 1)[0]);
    if (!pathname) continue;
    const resolved = path.resolve(path.dirname(markdownFile), pathname);
    if (!resolved.startsWith(`${root}${path.sep}`) && resolved !== root) {
      errors.push(`${path.relative(root, markdownFile)}: link escapes repository: ${target}`);
      continue;
    }
    try {
      await stat(resolved);
    } catch {
      errors.push(`${path.relative(root, markdownFile)}: missing target: ${target}`);
    }
  }
}

if (errors.length) {
  process.stderr.write(`${errors.join('\n')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Checked relative Markdown links in ${markdownFiles.length} files; all targets exist.\n`);
}
