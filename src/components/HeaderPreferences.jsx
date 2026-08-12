import { useEffect, useRef, useState } from 'react'
import LanguageSelector from './LanguageSelector'
import ThemeSelector from './ThemeSelector'
import { MaterialIcon } from './ui'
import { useLanguage } from '../store/LanguageContext'

export default function HeaderPreferences() {
  const [open, setOpen] = useState(false)
  const container = useRef(null)
  const { t } = useLanguage()

  useEffect(() => {
    if (!open) return undefined
    const close = (event) => {
      if (event.key === 'Escape' || !container.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', close)
    }
  }, [open])

  return <div className="header-preferences" ref={container}>
    <div className="header-preferences__inline"><ThemeSelector /><LanguageSelector /></div>
    <button className="preferences-trigger" type="button" aria-label={t('preferences')} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
      <MaterialIcon name="settings" />
    </button>
    {open && <section className="preferences-panel" aria-label={t('preferences')}>
      <header><MaterialIcon name="tune" /><strong>{t('preferences')}</strong></header>
      <ThemeSelector />
      <LanguageSelector />
    </section>}
  </div>
}
