import en from './en.js'
import kn from './kn.js'

export const translations = { en, kn }

export function getTranslation(lang = 'en') {
  return translations[lang] || translations.en
}

export default translations
