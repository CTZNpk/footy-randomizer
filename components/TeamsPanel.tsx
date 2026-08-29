import { PlayerView, Team } from '@/lib/types'

const LABELS: Record<Team, { title: string; accent: string; align: string }> = {
  A: { title: 'Team A', accent: 'text-teamA border-teamA/40', align: 'text-left' },
  B: { title: 'Team B', accent: 'text-teamB border-teamB/40', align: 'text-right' },
}

export default function TeamsPanel({ team, players }: { team: Team; players: PlayerView[] }) {
  const style = LABELS[team]
  const total = players.reduce((sum, player) => sum + player.weight, 0)

  return (
    <section className={`rounded-xl border bg-pitch-soft/60 p-4 ${style.accent} ${style.align}`}>
      <h2 className="font-bold uppercase tracking-wide">{style.title}</h2>
      <p className="mb-3 text-xs text-muted">
        {players.length} players · {total.toFixed(1)} total
      </p>
      <ul className="space-y-1">
        {players.map((player) => (
          <li key={player.id} className="rounded bg-line/30 px-3 py-1.5 text-sm text-chalk">
            {player.name}
          </li>
        ))}
      </ul>
    </section>
  )
}
