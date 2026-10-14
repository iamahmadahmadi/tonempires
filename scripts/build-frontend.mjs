import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const frontendDir = join(projectRoot, 'frontend');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

// Keep CRA's build deterministic in CI and reduce memory use by not generating
// sourcemaps. This wrapper works on Windows, macOS, and Linux with Node 18+.
const build = spawnSync(npmCommand, ['run', 'build'], {
  cwd: frontendDir,
  env: { ...process.env, NODE_ENV: 'production', CI: 'false', GENERATE_SOURCEMAP: 'false' },
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (build.error) throw build.error;
if (build.status !== 0) process.exit(build.status ?? 1);

const cleanup = spawnSync(process.execPath, [join(projectRoot, 'scripts', 'clean-static.mjs')], {
  cwd: projectRoot,
  stdio: 'inherit',
});
if (cleanup.error) throw cleanup.error;
if (cleanup.status !== 0) process.exit(cleanup.status ?? 1);
