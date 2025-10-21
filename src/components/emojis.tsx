import React, { useContext } from 'react'
import { Button } from './ui/button'
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@/lib/UserContext'


export default function Emojis() {

  const { user } = useUser()

    const icons = [
        '😂', '♥️', 
        '😭', '👍', '🙏', '🎉'
    ];


    async function sendEmoji(emoji: string, userId: string) {
    const { error } = await supabase
        .from('emoji_reactions')
        .insert([
        {
            emoji: emoji,
            user_id: userId,
            created_at: new Date().toISOString(),
        },
        ])

    if (error) {
        console.error('Error sending emoji:', error.message)
    } else {
        console.log('Emoji sent successfully!')
    }
    }

  return (
    <div className='flex flex-row flex-wrap'>
        {icons.map((icon, index) => (
            <Button key={index} variant="outline" size="icon" aria-label="Submit" onClick={()=>sendEmoji(icon, user!.id)}>
                {icon}
            </Button>
        ))}
    </div>
  )
}
