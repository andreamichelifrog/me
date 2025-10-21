import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import EmojiFloatLayer from '@/components/emoji_float_layer'

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {

  useEffect(() => {
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
          console.log('Dark mode updated:', payload.new.dark_mode)
          // Update your app's theme state here
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])



  return (
    <div className="p-2">
      <h3>Welcome Home!</h3>
      <EmojiFloatLayer></EmojiFloatLayer>
    </div>
  )
}