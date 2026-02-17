import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { de } from './de'
import { en } from './en'
import { interpolate } from './utils'
import type { Translations, SupportedLanguage, LanguageConfig } from './types'

const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  { code: 'de', label: 'Deutsch' },
  { code: 'en', label: 'English' },
]

const translationMap: Record<SupportedLanguage, Translations> = { de, en }
const validLangs = SUPPORTED_LANGUAGES.map(l => l.code)

function isValidLang(lang: string): lang is SupportedLanguage {
  return validLangs.includes(lang as SupportedLanguage)
}

interface LanguageContextValue {
  language: SupportedLanguage
  t: Translations
  fmt: (template: string, values: Record<string, string | number>) => string
  formatDate: (date: string | Date) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language] = useState<SupportedLanguage>(() => {
    // 1. URL parameter
    const urlParams = new URLSearchParams(window.location.search)
    const urlLang = urlParams.get('lang')
    if (urlLang && isValidLang(urlLang)) return urlLang

    // 2. localStorage
    const stored = localStorage.getItem('wot-language')
    if (stored && isValidLang(stored)) return stored

    // 3. Browser language
    const browserLang = navigator.language.split('-')[0]
    if (isValidLang(browserLang)) return browserLang

    // 4. Default to English
    return 'en'
  })

  useEffect(() => {
    localStorage.setItem('wot-language', language)
    document.documentElement.lang = language
  }, [language])

  const t = translationMap[language]

  const fmt = useCallback((template: string, values: Record<string, string | number>) => {
    return interpolate(template, values)
  }, [])

  const formatDate = useCallback((date: string | Date) => {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US')
  }, [language])

  return (
    <LanguageContext.Provider value={{ language, t, fmt, formatDate }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider')
  return context
}
