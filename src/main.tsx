import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { ORIGINAL_PERSON_ID } from './lib/people'
import { migrateLegacyPerson } from './lib/storage'
import { startSync } from './lib/sync'
import './index.css'

// Before anything renders: move a pre-roster log into its owner's namespace.
migrateLegacyPerson(ORIGINAL_PERSON_ID)

// Deliberately not awaited: the device already has its own copy, so the app opens
// at full speed and the shared data merges in behind it.
startSync()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
