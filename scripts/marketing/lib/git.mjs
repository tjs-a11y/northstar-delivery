// Commits the published files and pushes them, so GitHub Pages rebuilds the public site.
// Never force-pushes: a rejected push is rebased onto the remote and retried with backoff.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);

export async function commitAndPush({ root, paths, message, attempts = 4, sleep = (ms) => new Promise((r) => setTimeout(r, ms)), git = (args) => run('git', args, { cwd: root }) }) {
  await git(['add', '--', ...paths]);
  try {
    await git(['diff', '--cached', '--quiet']);
    return { committed: false, pushed: false };
  } catch {
    // Non-zero exit means there are staged changes to commit.
  }
  await git(['commit', '-m', message]);
  const { stdout } = await git(['rev-parse', '--abbrev-ref', 'HEAD']);
  const branch = stdout.trim();
  let last;
  for (let i = 0; i < attempts; i++) {
    try {
      await git(['push', 'origin', `HEAD:${branch}`]);
      return { committed: true, pushed: true, branch };
    } catch (e) {
      last = e;
      await sleep(2000 * 2 ** i);
      await git(['pull', '--rebase', 'origin', branch]);
    }
  }
  throw new Error(`git push failed after ${attempts} attempts: ${last?.stderr || last?.message}`);
}
