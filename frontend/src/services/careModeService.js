import { ref } from 'vue'

const STORAGE_KEY = 'ui_care_mode_v1'

export const careModeEnabled = ref(false)

const applyCareModeToDom = (enabled) => {
  const on = Boolean(enabled)
  careModeEnabled.value = on
  document?.body?.classList?.toggle('care-mode', on)
}

const readStoredPreference = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return null
    return raw === '1' || raw === 'true'
  } catch {
    return null
  }
}

const writeStoredPreference = (enabled) => {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0')
  } catch {
    // ignore
  }
}

const isCustomer = () => {
  try {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null')
    const role = user?.role
    return role !== 'seller' && role !== 'admin'
  } catch {
    return true
  }
}

export const ensureCareModeAllowed = () => {
  // Care mode is only for customers
  if (!isCustomer()) {
    writeStoredPreference(false)
    applyCareModeToDom(false)
    return false
  }
  return true
}

export const setCareModeEnabled = (enabled) => {
  if (enabled && !ensureCareModeAllowed()) return
  writeStoredPreference(Boolean(enabled))
  applyCareModeToDom(Boolean(enabled))
  window.dispatchEvent(new Event('careModeChanged'))
}

export const toggleCareMode = () => {
  setCareModeEnabled(!careModeEnabled.value)
}

export const initCareMode = () => {
  // Start from stored preference (default off)
  const stored = readStoredPreference()
  const next = stored === null ? false : stored
  applyCareModeToDom(next)
  ensureCareModeAllowed()

  // Keep in sync with login/logout/role switches
  window.addEventListener('userStateChanged', ensureCareModeAllowed)
}

