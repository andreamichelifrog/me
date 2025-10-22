import DarkMode from '@/components/dark_mode'
import Emojis from '@/components/emojis'
import Name from '@/components/name'
import { useUser } from '@/lib/UserContext'
import { createFileRoute } from '@tanstack/react-router'
import React from 'react'

export const Route = createFileRoute('/audience')({
  component: RouteComponent,
})

function RouteComponent() {

  const { user } = useUser()

  return (
    <div className='p-8 h-screen flex flex-col justify-center items-center gap-8'>
      {!user && <Name></Name>}
      {!!user && 
      <React.Fragment>
        <DarkMode></DarkMode>
        <Emojis></Emojis>
      </React.Fragment>}
    </div>
  )
}
