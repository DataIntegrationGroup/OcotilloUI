// NOTE: This file is a reference — the actual fix goes in index.html (see below).
// The polyfill must load BEFORE React/pdf modules, so an inline <script> in
// <head> is the simplest and most reliable approach.

/* ================================================================
   Buffer polyfill for react-pdf in browsers.
   
   react-pdf uses Node.js Buffer internals for image data; browsers
   don't provide it. This shim gives react-pdf what it needs so the
   PDFViewer can actually render content instead of sitting empty.
   
   Minimal implementation covering only what react-pdf touches:
   - Buffer.isBuffer() — type check
   - Buffer.from(data) — create from string or Uint8Array  
   - Buffer.concat(arrays) — merge buffers
   ================================================================ */
