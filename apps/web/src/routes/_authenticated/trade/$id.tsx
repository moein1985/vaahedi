import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/trade/$id')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authenticated/trade/$id"!</div>
}
