'use client'

import { useState } from 'react'
import EmailAuth from '@/components/Chatbot/EmailAuth'
import ChatInterface from '@/components/Chatbot/ChatInterface'

export default function CreateIssuePage() {
  const [user, setUser] = useState<{
    id: string
    email: string
    name?: string
    hubspot_team?: string
    hubspot_team_id?: string
  } | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleAuthenticated = async (authenticatedUser: {
    id: string
    email: string
    name?: string
    hubspot_team?: string
    hubspot_team_id?: string
  }) => {
    setUser(authenticatedUser)
    setLoading(true)

    try {
      const response = await fetch('/api/chatbot/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: authenticatedUser.email,
          name: authenticatedUser.name,
          hubspotContactId: authenticatedUser.id,
          hubspotTeam: authenticatedUser.hubspot_team,
          hubspotTeamId: authenticatedUser.hubspot_team_id,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to initialize session')
      }

      const data = await response.json()
      setSessionId(data.session.session_id)
    } catch (error) {
      console.error('Error initializing session:', error)
      alert('Failed to initialize chat session. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen bg-[#0d0d0d] flex flex-col" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif' }}>
      {!user ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full">
            <EmailAuth onAuthenticated={handleAuthenticated} />
          </div>
        </div>
      ) : loading || !sessionId ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#9466ff]"></div>
            <p className="mt-4 text-[#8a8a8a]">Initializing chat...</p>
          </div>
        </div>
      ) : (
        <ChatInterface
          sessionId={sessionId}
          userEmail={user.email}
          initialMessages={[]}
        />
      )}
    </div>
  )
}
