import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import zhCN from './locales/zh-CN.json'
import zhTW from './locales/zh-TW.json'

// Get saved language from localStorage or default to 'zh-CN'
const savedLocale = localStorage.getItem('locale') || 'zh-CN'

const i18n = createI18n({
  legacy: false, // Use Composition API
  locale: savedLocale,
  fallbackLocale: 'zh-CN', // Fallback to Chinese if translation missing
  messages: {
    'en': en,
    'zh-CN': zhCN,
    'zh-TW': zhTW
  }
})

export default i18n