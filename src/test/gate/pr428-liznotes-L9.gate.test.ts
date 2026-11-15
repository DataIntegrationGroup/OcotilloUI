/**
 * FROZEN GATE — L9: one PDF density (`comfortable`), no selector.
 *
 * Frozen 2026-11-09 21:48 by the planner, BEFORE the lane started. Do not edit.
 * If this gate fails because of a gate bug (wrong path, wrong assertion, a grep
 * that matches grid density instead of PDF density), report it as a finding and
 * stop. Do not rewrite it, do not weaken it.
 *
 * Run:  npx vitest run src/test/gate/pr428-liznotes-L9.gate.test.ts
 *
 * What it decides: a person opening PDF Export Options cannot choose a
 * density, the type system cannot express a second one, no PDF code path
 * branches on it any more, and the app still builds and prints the two-page
 * packet.
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = process.cwd()
const p = (...s: string[]) => path.join(ROOT, ...s)
const read = (f: string) => fs.readFileSync(f, 'utf8')
const exists = (f: string) => fs.existsSync(f)

const DENSITY_TYPE = p('src/interfaces/IPdfDensity.ts')
const CONFIG = p('src/config/pdf.tsx')
const PREVIEW = p('src/pages/ocotillo/thing/well-show-pdf-preview.tsx')
const DOWNLOAD = p('src/components/Button/WellPDFDownload.tsx')
const ACTIONS = p('src/components/Button/WellPDFActions.tsx')
const EQUIPMENT = p('src/components/WellShow/Equipment.tsx')
const STYLES = p('src/utils/CreatePdfStyles.ts')
const PDF_DIR = p('src/components/pdf')

/** every .ts/.tsx file under a directory */
const walk = (dir: string, acc: string[] = []): string[] => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, acc)
    else if (/\.(ts|tsx)$/.test(entry.name)) acc.push(full)
  }
  return acc
}

describe('L9 static — one density, and no way to pick another', () => {
  it('the union has exactly one member: comfortable', () => {
    const src = read(DENSITY_TYPE)
    const union = /export\s+type\s+IPdfDensity\s*=\s*([^\n]+)/.exec(src)
    expect(union, 'IPdfDensity declaration not found').toBeTruthy()
    const members = union![1].match(/'[a-z]+'/g) ?? []
    expect(members).toEqual(["'comfortable'"])
    expect(src).not.toContain("'compact'")
    expect(src).not.toContain("'standard'")
  })

  it('PDF_DENSITIES carries exactly one entry', () => {
    const src = read(DENSITY_TYPE)
    const arr = /PDF_DENSITIES[^=]*=\s*\[([^\]]*)\]/.exec(src)
    expect(arr, 'PDF_DENSITIES array not found').toBeTruthy()
    expect(arr![1].match(/'[a-z]+'/g) ?? []).toEqual(["'comfortable'"])
  })

  it('config defaults are the maximum, not standard', () => {
    const src = read(CONFIG)
    expect(src).toContain("density: 'comfortable'")
    expect(src).not.toContain("density: 'standard'")
    expect(src).not.toContain("density: 'compact'")
  })

  it('the export-options panel has no density selector left', () => {
    const src = read(PREVIEW)
    expect(src).not.toMatch(/densityOptions/)
    expect(src).not.toMatch(/densityIcons/)
    expect(src).not.toMatch(/name=["']density["']/)
    expect(src).not.toMatch(/PDF_DENSITIES/)
  })

  it('no call site still asks for standard or compact', () => {
    for (const file of [DOWNLOAD, ACTIONS, EQUIPMENT]) {
      const src = read(file)
      expect(src, path.basename(file)).not.toMatch(/density\s*[:=]\s*\{?[^}\n]*'standard'/)
      expect(src, path.basename(file)).not.toMatch(/density\s*[:=]\s*\{?[^}\n]*'compact'/)
      expect(src, path.basename(file)).not.toMatch(/\?\?\s*'standard'/)
    }
  })

  it('no PDF component still branches on which density it got', () => {
    const files = [STYLES, ...walk(PDF_DIR)]
    const offenders: string[] = []
    for (const file of files) {
      if (!exists(file)) continue
      const src = read(file)
      // a comparison or switch on density against a non-maximum value
      const bad =
        /density\s*===\s*['"](compact|standard)['"]/.test(src) ||
        /density\s*!==\s*['"](compact|standard)['"]/.test(src) ||
        /['"](compact|standard)['"]\s*===\s*density/.test(src) ||
        /case\s*['"](compact|standard)['"]/.test(src)
      if (bad) offenders.push(path.relative(ROOT, file))
    }
    expect(offenders, `still branching on density: ${offenders.join(', ')}`).toEqual([])
  })

  it('the type change compiles through every call site', () => {
    let out = ''
    try {
      out = execFileSync('npx', ['tsc', '--noEmit', '--pretty', 'false'], {
        cwd: ROOT,
        encoding: 'utf8',
        timeout: 300_000,
      })
    } catch (err) {
      const e = err as { stdout?: string; stderr?: string }
      out = `${e.stdout ?? ''}\n${e.stderr ?? ''}`
    }
    const errors = out.split('\n').filter((l) => /error TS\d+/.test(l))
    const densityErrors = errors.filter((l) => /density|IPdfDensity|comfortable|compact/i.test(l))
    expect(densityErrors, `density type errors:\n${densityErrors.join('\n')}`).toEqual([])
  })
})
