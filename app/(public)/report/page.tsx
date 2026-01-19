'use client'

import { useState } from 'react'
import EmailAuth from '@/components/Chatbot/EmailAuth'
import ChatInterface from '@/components/Chatbot/ChatInterface'

export default function ReportPage() {
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
      // Initialize chatbot session
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-center mb-8">Report an Issue</h1>
          <EmailAuth onAuthenticated={handleAuthenticated} />
        </div>
      </div>
    )
  }

  if (loading || !sessionId) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Initializing chat...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Report an Issue</h1>
          <p className="text-gray-600">
            Chat with our RevOps assistant to report issues, request features, or get help.
          </p>
          {user.hubspot_team && (
            <p className="text-sm text-gray-500 mt-1">
              Team: {user.hubspot_team}
            </p>
          )}
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <ChatInterface
            sessionId={sessionId}
            userEmail={user.email}
            initialMessages={[]}
          />
        </div>
      </div>
    </div>
  )
}

