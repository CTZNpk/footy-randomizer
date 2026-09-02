import { STREAK_LENGTH_SM, STREAK_LENGTH_XS } from '@/lib/constants'
import { Outcome } from '@/lib/types'

const STYLES: Record<Outcome, string> = {
  W: 'bg-turf/20 text-turf-soft border-turf/40',
  L: 'bg-red-500/15 text-red-300 border-red-500/30',
  D: 'bg-white/10 text-muted border-white/20',
}

const visibility = (fromEnd: number) =>
  fromEnd > STREAK_LENGTH_SM ? 'hidden lg:flex' : fromEnd > STREAK_LENGTH_XS ? 'hidden sm:flex' : 'flex'

export default function FormPills({ form }: { form: Outcome[] }) {
  if (form.length === 0) {
    return <span className="text-xs text-muted">no matches yet</span>
  }

  return (
    <span className="flex gap-1">
      {form.map((outcome, i) => (
        <span
          key={i}
          className={`h-5 w-5 items-center justify-center rounded border text-[10px] font-bold ${visibility(form.length - i)} ${STYLES[outcome]}`}
        >
          {outcome}
        </span>
      ))}
    </span>
  )
}
