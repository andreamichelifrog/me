import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from './supabaseClient'

interface ThemeContextType {
  isDark: boolean
  setIsDark: (isDark: boolean) => void
  toggleTheme: (userId?: string) => Promise<void>
  presentationStateId: string | null
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState<boolean>(false)
  const [presentationStateId, setPresentationStateId] = useState<string | null>(null)

  // initialize presentation_state row (create if missing) and subscription
  useEffect(() => {
    let channel: any

    async function init() {
      try {
        // read existing row (expect at most one)
        const { data: existing, error: selectError } = await supabase
          .from('presentation_state')
          .select('id,dark_mode')
          .limit(1)
          .maybeSingle()

        if (selectError) {
          console.error('Error reading presentation_state during init:', selectError.message)
        }

        if (existing && existing.id) {
          setPresentationStateId(existing.id)
          const dark = Boolean(existing.dark_mode)
          setIsDark(dark)
          if (dark) document.documentElement.classList.add('dark')
          else document.documentElement.classList.remove('dark')
        } else {
          // create the row so subsequent updates can use its id
          const { data: inserted, error: insertError } = await supabase
            .from('presentation_state')
            .insert([
              {
                dark_mode: isDark,
                created_at: new Date().toISOString(),
              },
            ])
            .select('id')
            .maybeSingle()

          if (insertError) {
            console.error('Error creating presentation_state during init:', insertError.message)
          } else if (inserted && (inserted as any).id) {
            setPresentationStateId((inserted as any).id)
          }
        }

        // subscribe to updates
        channel = supabase
          .channel('presentation-state-channel')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'presentation_state',
            },
            (payload) => {
              const newDark = Boolean(payload.new?.dark_mode)
              if (newDark) {
                document.documentElement.classList.add('dark')
                setIsDark(true)
              } else {
                document.documentElement.classList.remove('dark')
                setIsDark(false)
              }
              if (payload.new?.id) setPresentationStateId(payload.new.id)
            }
          )
          .subscribe()
      } catch (err) {
        console.error('Unexpected error initializing theme:', err)
      }
    }

    init()

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  const toggleTheme = useCallback(async (userId?: string) => {
    const newDark = !isDark

    // optimistic UI update
    setIsDark(newDark)
    if (newDark) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')

    try {
      if (presentationStateId) {
        const { error } = await supabase
          .from('presentation_state')
          .update({ dark_mode: newDark, user_id: userId ?? null, created_at: new Date().toISOString() })
          .eq('id', presentationStateId)

        if (error) {
          console.error('Error updating presentation_state:', error.message)
        }
      } else {
        // as a fallback create the row and store id
        const { data: inserted, error } = await supabase
          .from('presentation_state')
          .insert([
            { dark_mode: newDark, user_id: userId ?? null, created_at: new Date().toISOString() },
          ])
          .select('id')
          .maybeSingle()

        if (error) {
          console.error('Error inserting presentation_state on toggle:', error.message)
        } else if (inserted && (inserted as any).id) {
          setPresentationStateId((inserted as any).id)
        }
      }
    } catch (err) {
      console.error('Unexpected error toggling theme:', err)
    }
  }, [isDark, presentationStateId])

  return (
    <ThemeContext.Provider value={{ isDark, setIsDark, toggleTheme, presentationStateId }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within a ThemeProvider')
  return context
}
