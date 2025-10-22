import { createContext, useContext, useEffect } from 'react'
import { supabase } from './supabaseClient'

const ThemeContext = createContext({})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
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
          } else {
            document.documentElement.classList.remove('dark')
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return <>{children}</>
}