import '@fontsource-variable/outfit'
import '@fontsource-variable/public-sans'
import './index.css'

import React from 'react'
import { createRoot } from 'react-dom/client'

import App from './App'

import * as Sentry from '@sentry/react'

const dsn = import.meta.env.VITE_SENTRY_DSN

if (dsn !== undefined && dsn !== '' && dsn !== null) {
  Sentry.init({
    dsn: dsn,
    // Setting this option to true will send default PII data to Sentry.
    // For example, automatic IP address collection on events
    sendDefaultPii: true,
  })
}

const container = document.getElementById('root')
 
const root = createRoot(container!)
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
