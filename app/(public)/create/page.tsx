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

  if (!user) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-semibold text-[#ededed] mb-2">Create Issue</h1>
          <p className="text-[#9ca3af] mb-6">Report issues, request features, or get help from the RevOps team.</p>
          <div className="bg-[#151515] border border-[#1f1f1f] rounded-lg p-6">
            <EmailAuth onAuthenticated={handleAuthenticated} />
          </div>
        </div>
      </div>
    )
  }

  if (loading || !sessionId) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#5e6ad2]"></div>
            <p className="mt-4 text-[#9ca3af]">Initializing chat...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[#ededed] mb-2">Create Issue</h1>
          <p className="text-[#9ca3af]">
            Chat with our RevOps assistant to report issues, request features, or get help.
          </p>
          {user.hubspot_team && (
            <p className="text-sm text-[#6b7280] mt-2">
              Team: {user.hubspot_team}
            </p>
          )}
        </div>
        <div className="bg-[#151515] border border-[#1f1f1f] rounded-lg p-6">
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

