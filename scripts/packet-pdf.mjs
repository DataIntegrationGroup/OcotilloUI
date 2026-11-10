/**
 * packet:pdf — capture the Tailwind field-compilation packet to a 2-page letter PDF.
 *
 * §1 contract (L8): build dist, serve it over HTTP (never file://), print the route URL,
 * and write the resulting PDF to --out. Run from the repo root with `npm run packet:pdf`.
 */
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync, spawn } from 'node:child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const DIST = path.join(ROOT, 'dist')
const PORT = Number(process.env.PORT) || 5177
const ROUTE_PATH = '/ocotillo/print/packet/fixture-well?mock=1'
const OUT_FLAG = '--out'

/** Parse --out <path> (optional); --mock is accepted for parity with the gate run. */
function parseArgs(argv) {
  const out = process.env.OUT_PDF || null
  let i = 0
  while (i < argv.length) {
    if (argv[i] === OUT_FLAG) {
      i++;
      return { out: argv[i], mock: true }
    }
    if (argv[i].startsWith(`${OUT_FLAG}=`)) {
      return { out: argv[i].slice(OUT_FLAG.length + 1), mock: true }
    }
    i++
  }
  return { out, mock: true }
}

const { out: outFile } = parseArgs(process.argv.slice(2))
if (!outFile) {
  console.error('packet:pdf -- requires --out <path>')
  process.exit(1)
}

/** Build dist if it is missing or stale (never UPDATE_GOLDEN, never push). */
function ensureDist() {
  const distIndex = path.join(DIST, 'index.html')
  if (!fs.existsSync(distIndex)) {
    console.log('packet:pdf building dist (first build) ...')
    execFileSync('npm', ['run', 'build:fast'], {
      cwd: ROOT,
      stdio: 'inherit',
      env: { ...process.env, CI: '', VITE_API_URL: '/api' },
    })
  } else {
    // Fresh build so the served CSS is current (cheap vs. git-based freshness check).
    execFileSync('npm', ['run', 'build:fast'], {
      cwd: ROOT,
      stdio: 'inherit',
      env: { ...process.env, CI: '', VITE_API_URL: '/api' },
    })
  }
}

/** Minimal static server for dist with SPA fallback so deep links resolve. */
function makeServer(root) {
  const types = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.map': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.ico': 'image/x-icon',
  }
  return http.createServer((req, res) => {
    const url = new URL(req.url ?? '/', `http://localhost:${PORT}`)
    let pathname = decodeURIComponent(url.pathname)
    if (pathname === '/') pathname = '/index.html'
    const filePath = path.join(root, path.normalize(pathname).replace(/^(\.\.[\/\\])+/, ''))
    fs.readFile(filePath, (err, data) => {
      if (err) {
        // SPA fallback: any unmatched route serves index.html.
        try {
          fs.readFile(path.join(root, 'index.html'), (_e, html) => {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
            res.end(html)
          })
        } catch {
          res.writeHead(404).end('Not found')
        }
        return
      }
      const ext = path.extname(filePath)
      res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' })
      res.end(data)
    })
  })
}

async function capture(url, pdfPath) {
  const { chromium } = await import('playwright')
  console.log('packet:pdf launching browser ...')
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
  try {
    const page = await browser.newPage()
    // Seed a fake-but-valid OIDC token at document start so authentik-provider's
    // check() returns authenticated: true on this box (no live backend). A token
    // with no `exp` claim is treated as non-expiring by isJwtExpired.
    await page.addInitScript(
      (t) => { try { localStorage.setItem('access_token', t); localStorage.setItem('id_token', t) } catch {} },
      'eyJhbGciOiJub25lIn0.eyJuYW1lIjoiVGVzdCBVc2VyIn0.sig'
    )

    const consoleErrors = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })
    page.on('pageerror', (err) => consoleErrors.push(`PAGEERROR: ${err.message}`))

    await page.goto(url, { waitUntil: 'networkidle', timeout: 120000 })

    // Tolerant readiness wait: the sheet must exist. Dump diagnostics on failure
    // so a blank render is diagnosed instead of silently swallowed.
    let ok = false
    try {
      await page.waitForFunction(
        () => !!document.querySelector('.sheet'),
        { timeout: 60000 }
      )
      ok = true
    } catch (e) {
      const bodyText = (await page.evaluate(() => document.body?.innerText ?? '')).slice(0, 300)
      console.error('readiness wait failed; body.innerText:', JSON.stringify(bodyText))
      if (consoleErrors.length) console.error('consoleErrors:', consoleErrors)
      throw e
    }

    const pdf = await page.pdf({
      path: pdfPath,
      format: 'letter',
      printBackground: true,
      preferCSSPageSize: true,
    })

    fs.mkdirSync(path.dirname(pdfPath), { recursive: true })
    fs.writeFileSync(pdfPath, Buffer.isBuffer(pdf) ? pdf : new Uint8Array(pdf))
    return pdfPath
  } finally {
    await browser.close()
  }
}

async function main() {
  ensureDist()
  const server = makeServer(DIST)
  await new Promise((r) => server.listen(PORT, '127.0.0.1', r))
  const url = `http://127.0.0.1:${PORT}${ROUTE_PATH}`
  console.log(`packet:pdf serving dist at ${url}`)
  try {
    const written = await capture(url, outFile)
    const size = fs.statSync(written).size
    console.log(`packet:pdf wrote PDF -> ${written} (${size} bytes)`)
    console.log(url)
  } finally {
    server.close()
  }
}

main().catch((err) => {
  console.error('packet:pdf failed:', err.message || err)
  process.exit(1)
})
