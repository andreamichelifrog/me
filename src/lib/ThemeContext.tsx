import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

interface isDarkContextType {
  isDark: boolean
  setIsDark: (isDark:boolean) => void
}


const ThemeContext = createContext<isDarkContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [isDark, setIsDark] = useState(true);
  useEffect(() => {
    // Set initial dark mode
    document.documentElement.classList.add('dark')

    const channel = supabase
      .channel('presentation-state-channel')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'presentation_state',
        },
        (payload) => {
          if (payload.new.dark_mode) {
            document.documentElement.classList.add('dark')
            setIsDark(true)
          } else {
              document.documentElement.classList.remove('dark')
              setIsDark(false)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return <ThemeContext.Provider value={{isDark, setIsDark}}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within a ThemeProvider')
  return context
}
