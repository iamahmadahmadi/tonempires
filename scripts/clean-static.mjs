import { readdir, rm } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../frontend/build/', import.meta.url));
const forbidden = new Set(['.bat', '.exe', '.rar']);
let removed = 0;

async function clean(directory) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error?.code === 'ENOENT') return;
    throw error;
  }
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      await clean(path);
    } else if (forbidden.has(extname(entry.name).toLowerCase())) {
      await rm(path, { force: true });
      removed += 1;
      console.log(`Removed unsupported static asset: ${path}`);
    }
  }
}

await clean(root);
console.log(`Static cleanup complete (${removed} unsupported file(s) removed).`);
