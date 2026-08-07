import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { resolveVersionMetadata, writeVersionFile } from './write-version.mjs'

test('resolveVersionMetadata uses git metadata when available', () => {
  const payload = resolveVersionMetadata({
    gitMetadata: { commit: 'abc1234', branch: 'main', dirty: true },
    buildTime: '2026-08-07T00:00:00.000Z',
  })

  assert.equal(payload.commit, 'abc1234')
  assert.equal(payload.branch, 'main')
  assert.equal(payload.dirty, true)
  assert.equal(payload.buildTime, '2026-08-07T00:00:00.000Z')
})

test('resolveVersionMetadata falls back to BUILD_* env when git unavailable', () => {
  const payload = resolveVersionMetadata({
    gitMetadata: null,
    env: { BUILD_COMMIT: 'deadbeef', BUILD_BRANCH: 'release' },
    buildTime: '2026-08-07T00:00:00.000Z',
  })

  assert.equal(payload.commit, 'deadbeef')
  assert.equal(payload.branch, 'release')
  assert.equal(payload.dirty, false)
})

test('resolveVersionMetadata uses unknown and dirty=false without git or env', () => {
  const payload = resolveVersionMetadata({
    gitMetadata: null,
    env: {},
    buildTime: '2026-08-07T00:00:00.000Z',
  })

  assert.equal(payload.commit, 'unknown')
  assert.equal(payload.branch, 'unknown')
  assert.equal(payload.dirty, false)
})

test('writeVersionFile writes version.json', () => {
  const dir = mkdtempSync(join(tmpdir(), 'nw-version-'))
  try {
    const payload = {
      commit: 'unknown',
      branch: 'unknown',
      buildTime: '2026-08-07T00:00:00.000Z',
      dirty: false,
    }
    const outFile = writeVersionFile(dir, payload)
    const written = JSON.parse(readFileSync(outFile, 'utf8'))
    assert.deepEqual(written, payload)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
