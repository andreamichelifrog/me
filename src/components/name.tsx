import React, { useState } from 'react'
import { Input } from './ui/input'
import { Label } from '@radix-ui/react-label'
import { supabase } from '../lib/supabaseClient'
import { useUser } from '@/lib/UserContext'
import { Button } from './ui/button'

export default function Name() {
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { setUser } = useUser()

  async function handleSave() {
    setLoading(true)
    setError('')
    const { data, error } = await supabase
      .from('username')
      .insert([{ username: username }])
      .select()
    setLoading(false)
    if (error) {
      setError(error.message)
    } else if (data && data.length > 0) {
      setUser(data[0])
      setUsername('')
    }
  }

  return (
    <div className="grid w-full max-w-sm items-center gap-3">
      <Label htmlFor="username">
        Type your username! {username ? '🫣' : '😎'}
      </Label>
      <Input
        type="text"
        id="username"
        placeholder="Username"
        value={username}
        onChange={e => setUsername(e.target.value)}
        disabled={loading}
      />
      <Button
        onClick={handleSave}
        disabled={!username || loading}
      >
        {loading ? 'Saving...' : 'Save Username'}
      </Button>
      {error && <div className="text-red-500 text-sm">{error}</div>}
    </div>
  )
}

