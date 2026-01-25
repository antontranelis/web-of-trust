import { createContext, useContext, useState, useEffect } from 'react'
import { audienceContent } from './audienceContent'

export const AUDIENCES = [
  { code: 'default', label: 'Alle', icon: '🌍', description: 'Allgemeine Perspektive' },
  { code: 'spiritual', label: 'Spirituelle', icon: '🧘', description: 'Verbundenheit & Leichtigkeit' },
  { code: 'entrepreneur', label: 'Unternehmer', icon: '💼', description: 'Netzwerke & Wertschöpfung' },
  { code: 'activist', label: 'Aktivisten', icon: '✊', description: 'Systemwandel & Gemeinschaft' },
  { code: 'engineer', label: 'Ingenieure', icon: '⚙️', description: 'Technik & Architektur' },
  { code: 'journalist', label: 'Journalisten', icon: '📰', description: 'Story & Impact' },
  { code: 'artist', label: 'Künstler', icon: '🎨', description: 'Kreativität & Austausch' },
]

const AudienceContext = createContext()

export function AudienceProvider({ children }) {
  // Check if audience mode is enabled via URL parameter ?personas or ?audience=xxx
  const [isEnabled] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.has('personas') || urlParams.has('audience')
  })

  const [audience, setAudience] = useState(() => {
    // Check URL parameter first
    const urlParams = new URLSearchParams(window.location.search)
    const urlAudience = urlParams.get('audience')
    const validAudiences = AUDIENCES.map(a => a.code)
    if (urlAudience && validAudiences.includes(urlAudience)) {
      return urlAudience
    }

    // Check localStorage (only if enabled)
    if (urlParams.has('personas') || urlParams.has('audience')) {
      const stored = localStorage.getItem('wot-audience')
      if (stored && validAudiences.includes(stored)) {
        return stored
      }
    }

    // Default
    return 'default'
  })

  useEffect(() => {
    localStorage.setItem('wot-audience', audience)
    document.documentElement.dataset.audience = audience
  }, [audience])

  // Get content for current audience, fallback to default
  const getContent = (key) => {
    const audienceData = audienceContent[audience] || audienceContent.default
    return audienceData[key] || audienceContent.default[key]
  }

  // Get the current audience object
  const currentAudience = AUDIENCES.find(a => a.code === audience) || AUDIENCES[0]

  return (
    <AudienceContext.Provider value={{
      audience,
      setAudience,
      getContent,
      currentAudience,
      audiences: AUDIENCES,
      isEnabled, // Only show UI when enabled via URL param
    }}>
      {children}
    </AudienceContext.Provider>
  )
}

export function useAudience() {
  const context = useContext(AudienceContext)
  if (!context) {
    throw new Error('useAudience must be used within an AudienceProvider')
  }
  return context
}
