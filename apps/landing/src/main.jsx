import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { LanguageProvider } from './i18n/LanguageContext'
import { AudienceProvider } from './audience'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LanguageProvider>
      <AudienceProvider>
        <App />
      </AudienceProvider>
    </LanguageProvider>
  </React.StrictMode>,
)
