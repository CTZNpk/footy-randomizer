'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (response.ok) router.push('/admin/players')
    else setError((await response.json()).error)
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <h1 className="mb-1 text-2xl font-black tracking-tight">Admin</h1>
      <p className="mb-6 text-sm text-muted">Enter the admin password to continue.</p>

      <form onSubmit={submit} className="space-y-3">
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-lg border border-line bg-pitch-soft px-3 py-2 outline-none focus:border-turf"
        />
        {error && <p className="text-sm text-red-300">{error}</p>}
        <button className="w-full rounded-lg bg-turf py-2.5 font-bold text-pitch hover:bg-turf-soft">
          Log in
        </button>
      </form>
    </main>
  )
}
