import { createContext, useContext, useLayoutEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  )

  useLayoutEffect(() => {
    const root = window.document.documentElement

    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
    const applyTheme = () => {
      const appliedTheme = theme === 'system'
        ? systemTheme.matches ? 'dark' : 'light'
        : theme
      root.classList.remove('light', 'dark')
      root.classList.add(appliedTheme)
      const background = getComputedStyle(root).getPropertyValue('--background').trim()
      root.style.backgroundColor = background
      document.body.style.backgroundColor = background

      // Reinsert the tag so Safari refreshes its browser chrome immediately.
      // Updating content in place can leave the previous tint until rotation.
      const previousThemeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
      const themeColor = document.createElement('meta')
      themeColor.name = 'theme-color'
      themeColor.content = background
      previousThemeColor?.remove()
      document.head.appendChild(themeColor)
    }
    applyTheme()
    if (theme === 'system') {
      systemTheme.addEventListener('change', applyTheme)
      return () => systemTheme.removeEventListener('change', applyTheme)
    }
  }, [theme])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
