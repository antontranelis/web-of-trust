import { useState, useRef, useEffect } from 'react'
import { useAudience, AUDIENCES } from './AudienceContext'

export function AudienceSwitcher() {
  const { audience, setAudience, currentAudience } = useAudience()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-gray-200 dark:border-gray-700"
        aria-label="Zielgruppe wählen"
        title={currentAudience.description}
      >
        <span className="text-lg">{currentAudience.icon}</span>
        <span className="hidden sm:inline">{currentAudience.label}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
          <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
            Perspektive wählen
          </div>
          {AUDIENCES.map((aud) => (
            <button
              key={aud.code}
              onClick={() => {
                setAudience(aud.code)
                setIsOpen(false)
              }}
              className={`w-full px-3 py-3 text-left flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                audience === aud.code ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''
              }`}
            >
              <span className="text-2xl">{aud.icon}</span>
              <div className="flex-1 min-w-0">
                <div className={`font-medium ${audience === aud.code ? 'text-emerald-700 dark:text-emerald-400' : ''}`}>
                  {aud.label}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {aud.description}
                </div>
              </div>
              {audience === aud.code && (
                <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
