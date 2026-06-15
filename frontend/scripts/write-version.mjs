import { execSync } from 'node:child_process'
import { existsSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const frontendDir = join(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = join(frontendDir, 'dist')
const outFile = join(distDir, 'version.json')

function git(cmd, cwd) {
  return execSync(cmd, { encoding: 'utf8', cwd, stdio: ['ignore', 'pipe', 'pipe'] }).trim()
}

if (!existsSync(distDir)) {
  console.error('frontend/dist not found — run vite build before write-version.mjs')
  process.exit(1)
}

const repoRoot = git('git rev-parse --show-toplevel', frontendDir)
const commit = git('git rev-parse --short HEAD', repoRoot)
const branch = git('git branch --show-current', repoRoot)
const status = git('git status --short', repoRoot)
const dirty = status.length > 0

const payload = {
  commit,
  branch,
  buildTime: new Date().toISOString(),
  dirty,
}

writeFileSync(outFile, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
console.log(`Wrote ${outFile}`)
