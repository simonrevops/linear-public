import { NextRequest, NextResponse } from 'next/server'
import { createSession, getSessionByEmail } from '@/lib/chatbot/session'

export async function POST(request: NextRequest) {
  try {
    const { email, name, hubspotContactId, hubspotTeam, hubspotTeamId } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Check for existing active session (within last 30 minutes)
    const existingSession = await getSessionByEmail(email)
    const now = Date.now()
    const SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutes

    if (existingSession && (now - new Date(existingSession.created_at).getTime()) < SESSION_TIMEOUT) {
      // Return existing session
      return NextResponse.json({
        session: {
          session_id: existingSession.session_id,
          state: existingSession.state,
          messages: existingSession.messages
        }
      })
    }

    // Create new session
    const session = await createSession({
      userEmail: email,
      userName: name,
      userId: email,
      hubspotContactId,
      hubspotTeam,
      hubspotTeamId
    })

    return NextResponse.json({
      session: {
        session_id: session.session_id,
        state: session.state,
        messages: session.messages
      }
    })
  } catch (error) {
    console.error('Error in session route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

