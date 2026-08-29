import AdminNav from '@/components/AdminNav'
import VotesReview from '@/components/VotesReview'
import { listVotesByPlayer } from '@/lib/queries'

export const dynamic = 'force-dynamic'

export default async function VotesPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <AdminNav />
      <VotesReview rows={await listVotesByPlayer()} />
    </main>
  )
}
