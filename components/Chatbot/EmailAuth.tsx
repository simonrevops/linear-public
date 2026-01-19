'use client'

import { useState } from 'react'

interface EmailAuthProps {
  onAuthenticated: (user: {
    id: string
    email: string
    name?: string
    hubspot_team?: string
    hubspot_team_id?: string
  }) => void
}

export default function EmailAuth({ onAuthenticated }: EmailAuthProps) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/identify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, name: name || undefined }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to authenticate')
      }

      const data = await response.json()
      onAuthenticated(data.user)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-[#ededed] mb-2">Identify Yourself</h2>
      <p className="text-[#9ca3af] mb-6 text-sm">
        Please enter your email to report an issue. We'll use this to understand the scope and impact.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-[#9ca3af] mb-1">
            Email *
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 bg-[#0d0d0d] border border-[#1f1f1f] rounded-md text-[#ededed] focus:outline-none focus:ring-2 focus:ring-[#5e6ad2] focus:border-[#5e6ad2]"
            placeholder="your.email@company.com"
          />
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-[#9ca3af] mb-1">
            Name (optional)
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 bg-[#0d0d0d] border border-[#1f1f1f] rounded-md text-[#ededed] focus:outline-none focus:ring-2 focus:ring-[#5e6ad2] focus:border-[#5e6ad2]"
            placeholder="Your name"
          />
        </div>

        {error && (
          <div className="p-3 bg-[#dc2626]/20 border border-[#dc2626]/50 rounded-md text-[#dc2626] text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !email}
          className="w-full bg-[#5e6ad2] text-white py-2 px-4 rounded-md hover:bg-[#4c56c4] focus:outline-none focus:ring-2 focus:ring-[#5e6ad2] focus:ring-offset-2 focus:ring-offset-[#0d0d0d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Identifying...' : 'Continue'}
        </button>
      </form>
    </div>
  )
}
