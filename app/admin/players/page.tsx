import AdminNav from '@/components/AdminNav'
import PlayersTable from '@/components/PlayersTable'
import { listAdminPlayers } from '@/lib/queries'

export const dynamic = 'force-dynamic'

export default async function PlayersPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <AdminNav />
      <PlayersTable players={await listAdminPlayers()} />
    </main>
  )
}
