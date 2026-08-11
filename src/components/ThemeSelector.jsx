import { themes, useTheme } from '../store/ThemeContext'
import { useLanguage } from '../store/LanguageContext'

export default function ThemeSelector() {
  const { theme, setTheme } = useTheme()
  const { t } = useLanguage()
  const selectedTheme = themes[theme]

  return <label className="theme-selector" title={t('appearance')}>
    <span className="theme-selector__swatches" aria-hidden="true">
      {selectedTheme.colors.map((color) => <i key={color} style={{ background: color }} />)}
    </span>
    <span className="sr-only">Color palette</span>
    <select aria-label="Color palette" value={theme} onChange={(event) => setTheme(event.target.value)}>
      {Object.entries(themes).map(([value, config]) => <option key={value} value={value}>{config.name}</option>)}
    </select>
  </label>
}
