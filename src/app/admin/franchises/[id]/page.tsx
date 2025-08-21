import { redirect } from 'next/navigation'

interface Params {
  params: { id: string }
}

export default function FranchiseIdRedirectPage({ params }: Params) {
  redirect(`/admin/franchises/${params.id}/gyms`)
}

