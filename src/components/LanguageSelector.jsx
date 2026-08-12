import { useLanguage } from '../store/LanguageContext'
import { MaterialIcon } from './ui'

export default function LanguageSelector() {
  const { language, setLanguage, t } = useLanguage()
  return <label className="language-selector" title={t('language')}>
    <MaterialIcon name="translate" />
    <select aria-label={t('language')} value={language} onChange={(event) => setLanguage(event.target.value)}>
      <option value="en">English</option>
      <option value="id">Bahasa Indonesia</option>
    </select>
  </label>
}
