import React from 'react'
import { createRoot } from 'react-dom/client'

import App from './App'

import * as Sentry from '@sentry/react'

let dsn = import.meta.env.VITE_SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn: dsn,
    // Setting this option to true will send default PII data to Sentry.
    // For example, automatic IP address collection on events
    sendDefaultPii: true,
  })
}

const container = document.getElementById('root')
// eslint-disable-next-line
const root = createRoot(container!)
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
