import { execSync } from 'node:child_process'
import { existsSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const frontendDir = join(dirname(fileURLToPath(import.meta.url)), '..')

/** @returns {{ commit: string, branch: string, dirty: boolean } | null} */
export function tryGit(cwd) {
  try {
    const repoRoot = execSync('git rev-parse --show-toplevel', {
      encoding: 'utf8',
      cwd,
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
    const commit = execSync('git rev-parse --short HEAD', {
      encoding: 'utf8',
      cwd: repoRoot,
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
    const branch =
      execSync('git branch --show-current', {
        encoding: 'utf8',
        cwd: repoRoot,
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim() || 'HEAD'
    const status = execSync('git status --short', {
      encoding: 'utf8',
      cwd: repoRoot,
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
    return { commit, branch, dirty: status.length > 0 }
  } catch {
    return null
  }
}

/**
 * @param {{ env?: NodeJS.ProcessEnv, frontendDir?: string, buildTime?: string, gitMetadata?: { commit: string, branch: string, dirty: boolean } | null }} [options]
 */
export function resolveVersionMetadata(options = {}) {
  const env = options.env ?? process.env
  const dir = options.frontendDir ?? frontendDir
  const buildTime = options.buildTime ?? new Date().toISOString()
  const git = options.gitMetadata !== undefined ? options.gitMetadata : tryGit(dir)

  if (git) {
    return {
      commit: git.commit,
      branch: git.branch,
      buildTime,
      dirty: git.dirty,
    }
  }

  return {
    commit: env.BUILD_COMMIT?.trim() || 'unknown',
    branch: env.BUILD_BRANCH?.trim() || 'unknown',
    buildTime,
    dirty: false,
  }
}

export function writeVersionFile(distDir, payload) {
  const outFile = join(distDir, 'version.json')
  writeFileSync(outFile, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
  return outFile
}

function main() {
  const distDir = join(frontendDir, 'dist')
  if (!existsSync(distDir)) {
    console.error('frontend/dist not found — run vite build before write-version.mjs')
    process.exit(1)
  }

  const payload = resolveVersionMetadata()
  const outFile = writeVersionFile(distDir, payload)
  console.log(`Wrote ${outFile}`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}
