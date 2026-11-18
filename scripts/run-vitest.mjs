// Runs Vitest from the canonical project path.
// On Windows a terminal can report the drive letter in lower case ("c:\..."),
// which makes Vitest load itself twice and fail before any test runs.
import { spawnSync } from 'node:child_process';
import { realpathSync } from 'node:fs';

const cwd = realpathSync.native(process.cwd());
const args = process.argv.slice(2);
const result = spawnSync('npx', ['vitest', ...(args.length ? args : ['run'])], { cwd, stdio: 'inherit', shell: true });
process.exit(result.status ?? 1);
