import Emojis from '@/components/emojis'
import Name from '@/components/name'
import { useUser } from '@/lib/UserContext'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/audience')({
  component: RouteComponent,
})

function RouteComponent() {

  const { user } = useUser()

  return (
    <div>
      <h1>Audience Page</h1>
      <p>This is the audience page content.</p>
      {!user && <Name></Name>}
      {!!user && <Emojis></Emojis>}
    </div>
  )
}
