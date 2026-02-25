import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/u/$userCode')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/u/$userCode"!</div>
}
