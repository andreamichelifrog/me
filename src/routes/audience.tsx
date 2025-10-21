import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/audience')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/audience"!</div>
}
