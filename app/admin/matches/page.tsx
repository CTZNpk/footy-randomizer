import AdminNav from '@/components/AdminNav'
import MatchesManager from '@/components/MatchesManager'
import { listMatchRows, listPlayerViews } from '@/lib/queries'

export const dynamic = 'force-dynamic'

export default async function MatchesPage() {
  const [players, matches] = await Promise.all([listPlayerViews(true), listMatchRows()])

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <AdminNav />
      <MatchesManager players={players} matches={matches} />
    </main>
  )
}
