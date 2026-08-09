import { createContext, useContext, useEffect, useMemo, useState } from 'react'

export const themes = {
  'ink-wash': {
    name: 'Ink wash',
    colors: ['#4A4A4A', '#CBCBCB', '#FFFFE3', '#6D8196'],
  },
  'salt-pepper': {
    name: 'Salt and pepper',
    colors: ['#FFFFFF', '#D4D4D4', '#B3B3B3', '#2B2B2B'],
  },
  apple: {
    name: 'Apple',
    colors: ['#FFFFFF', '#F5F5F7', '#1D1D1F', '#0071E3'],
  },
}

const THEME_STORAGE_KEY = 'control-room-theme'
const ThemeContext = createContext(null)

function getInitialTheme() {
  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
  return themes[savedTheme] ? savedTheme : 'apple'
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = 'light'
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  const value = useMemo(() => ({ theme, setTheme, themes }), [theme])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)
