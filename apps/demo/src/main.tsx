import { Component, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, fontFamily: 'monospace', fontSize: 13, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          <h1 style={{ color: 'red', fontSize: 18 }}>App Crash</h1>
          <p><strong>{this.state.error.message}</strong></p>
          <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 8, overflow: 'auto', maxHeight: '60vh' }}>
            {this.state.error.stack}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}

// Also catch unhandled errors outside React
window.addEventListener('error', (e) => {
  document.body.innerHTML = `<div style="padding:24px;font-family:monospace;font-size:13px;word-break:break-word">
    <h1 style="color:red">Unhandled Error</h1>
    <p><b>${e.message}</b></p>
    <pre style="background:#f5f5f5;padding:12px;border-radius:8px;white-space:pre-wrap">${e.error?.stack || e.filename + ':' + e.lineno}</pre>
  </div>`
})

window.addEventListener('unhandledrejection', (e) => {
  const err = e.reason
  document.body.innerHTML = `<div style="padding:24px;font-family:monospace;font-size:13px;word-break:break-word">
    <h1 style="color:red">Unhandled Promise Rejection</h1>
    <p><b>${err?.message || String(err)}</b></p>
    <pre style="background:#f5f5f5;padding:12px;border-radius:8px;white-space:pre-wrap">${err?.stack || ''}</pre>
  </div>`
})

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
)
