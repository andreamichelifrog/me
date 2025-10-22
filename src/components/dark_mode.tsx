import { supabase } from '@/lib/supabaseClient'
import { useTheme } from '@/lib/ThemeContext';
import { Label } from '@radix-ui/react-label';
// import React from 'react'
import { Button } from './ui/button';
import { useUser } from '@/lib/UserContext';
import { Switch } from './ui/switch';

export default function DarkMode() {

    const { user } = useUser() 

  const {isDark} = useTheme();

  async function sendDarkMode(userId: string) {
    try {
      // try to find an existing presentation_state row (assumes single-row table)
      const { data: existing, error: selectError } = await supabase
        .from('presentation_state')
        .select('id')
        .limit(1)
        .maybeSingle()

      if (selectError) {
        console.error('Error reading presentation state:', selectError.message)
        return
      }

      if (existing?.id) {
        // update the found row by id (requires WHERE)
        const { error } = await supabase
          .from('presentation_state')
          .update({
            dark_mode: !isDark,
            user_id: userId,
            created_at: new Date().toISOString(),
          })
          .eq('id', existing.id)

        if (error) {
          console.error('Error updating presentation state:', error.message)
        } else {
          console.log('Presentation state updated successfully!')
        }
      } else {
        // no row yet — insert a new one
        const { error } = await supabase
          .from('presentation_state')
          .insert([
            {
              dark_mode: !isDark,
              user_id: userId,
              created_at: new Date().toISOString(),
            },
          ])

        if (error) {
          console.error('Error inserting presentation state:', error.message)
        } else {
          console.log('Presentation state inserted successfully!')
        }
      }
    } catch (err) {
      console.error('Unexpected error sending presentation state:', err)
    }
  }
  

  return (
    <Button className="rounded-3xl h-20 text-3xl md:h-24 w-64 flex justify-between"
      size="lg" variant="three-d" aria-label="Submit" onClick={()=>sendDarkMode(user!.id)}>
      {/* <div className="flex items-center space-x-2"> */}
      <div className='flex items-center gap-4'>
        <p>{ isDark ? '🌙' : '☀️' }</p>
          {/* <Switch id="dark-mode" checked={isDark} /> */}
            <input type="checkbox" value="" className="sr-only peer" checked={isDark} readOnly />
            <div className="relative w-11 h-6 bg-secondary rounded-full peer peer-focus:ring-4 peer-focus:ring-ring  peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-background after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-background after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
      </div>
        <Label htmlFor="dark-mode" className='text-xl'>Dark Mode</Label>
      {/* </div> */}
    </Button>

  )
}
