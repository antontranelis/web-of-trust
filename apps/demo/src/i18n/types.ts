import type { de } from './de'

type DeepStringify<T> = {
  [K in keyof T]: T[K] extends string ? string : DeepStringify<T[K]>
}

export type Translations = DeepStringify<typeof de>

export type SupportedLanguage = 'de' | 'en'

export interface LanguageConfig {
  code: SupportedLanguage
  label: string
}
