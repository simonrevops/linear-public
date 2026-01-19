'use client'

import { useState, useRef, useEffect } from 'react'

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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const emailInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    emailInputRef.current?.focus()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/identify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
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
    <div className="flex flex-col h-full justify-center items-center p-6">
      <div className="max-w-md w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-md p-6">
        <h2 className="text-[14px] font-medium text-[#ebebeb] mb-2">Identify Yourself</h2>
        <p className="text-[#8a8a8a] mb-6 text-[13px]">
          Please enter your email to report an issue. We'll use this to understand the scope and impact.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-[13px] font-normal text-[#8a8a8a] mb-1">
              Email *
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 bg-[#0d0d0d] border border-[#2a2a2a] rounded-md text-[#ebebeb] focus:outline-none focus:ring-2 focus:ring-[#9466ff] focus:border-[#9466ff] transition-colors duration-150"
              placeholder="your.email@company.com"
              ref={emailInputRef}
            />
          </div>

          {error && (
            <div className="p-3 bg-[#dc2626]/20 border border-[#dc2626]/50 rounded-md text-[#dc2626] text-[13px]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full bg-[#9466ff] text-white py-2 px-4 rounded-md hover:bg-[#8555e6] focus:outline-none focus:ring-2 focus:ring-[#9466ff] focus:ring-offset-2 focus:ring-offset-[#0d0d0d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 text-[13px]"
          >
            {loading ? 'Identifying...' : 'Continue (Press ENTER)'}
          </button>
        </form>
      </div>
    </div>
  )
}
