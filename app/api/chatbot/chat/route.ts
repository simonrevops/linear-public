import { NextRequest, NextResponse } from 'next/server'
import { handleChatbotMessage } from '@/lib/chatbot/handler'

export async function POST(request: NextRequest) {
  try {
    const { sessionId, message, userEmail } = await request.json()

    if (!sessionId || !message || !userEmail) {
      return NextResponse.json(
        { error: 'sessionId, message, and userEmail are required' },
        { status: 400 }
      )
    }

    const result = await handleChatbotMessage(sessionId, message, userEmail)

    return NextResponse.json({
      status: result.status,
      message: result.message,
      classification: result.classification,
      linearIssueId: result.linearIssueId
    })
  } catch (error) {
    console.error('Error in chat route:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

