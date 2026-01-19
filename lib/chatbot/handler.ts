import { evaluateConversation, ChatMessage, Classification } from './classifier'
import { getSession, updateSession, createSession, getSessionByEmail } from './session'
import { createIssue } from '../linear/queries'

export interface ChatbotHandlerResult {
  status: 'need_more_info' | 'ready' | 'create'
  message: string
  classification?: Classification
  linearIssueId?: string
}

/**
 * Handle a chatbot message
 */
export async function handleChatbotMessage(
  sessionId: string,
  userMessage: string,
  userEmail: string
): Promise<ChatbotHandlerResult> {
  // Get or create session
  let session = await getSession(sessionId)
  
  if (!session) {
    // Try to find existing session by email
    session = await getSessionByEmail(userEmail)
    
    if (!session) {
      // Create new session
      session = await createSession({
        userEmail,
        userName: undefined,
        userId: userEmail
      })
    }
  }

  // Add user message to conversation
  const messages: ChatMessage[] = [
    ...session.messages,
    {
      role: 'user',
      content: userMessage
    }
  ]

  // Evaluate conversation with AI
  const agentResponse = await evaluateConversation(
    messages,
    session.hubspot_team
  )

  // Handle different response statuses
  if (agentResponse.status === 'need_more_info') {
    // Add assistant's question to messages
    const updatedMessages: ChatMessage[] = [
      ...messages,
      {
        role: 'assistant',
        content: agentResponse.question || "I need more information. Could you provide more details?"
      }
    ]

    await updateSession(session.session_id, {
      messages: updatedMessages,
      state: 'CONVERSING'
    })

    return {
      status: 'need_more_info',
      message: agentResponse.question || "I need more information. Could you provide more details?"
    }
  }

  if (agentResponse.status === 'ready') {
    // Show confirmation message
    const classification = agentResponse.classification!
    const confirmMessage = `Here's what I'll create:

**${classification.title}**

- Type: ${classification.type}
- Platform: ${classification.platforms.join(', ')}
- System: ${classification.systems?.join(', ') || 'None identified'}
- Priority: ${classification.priority}

${classification.summary}

Reply *yes* to create, or *cancel* to discard.`

    const updatedMessages: ChatMessage[] = [
      ...messages,
      {
        role: 'assistant',
        content: confirmMessage
      }
    ]

    await updateSession(session.session_id, {
      messages: updatedMessages,
      state: 'AWAIT_CONFIRMATION',
      classification: classification
    })

    return {
      status: 'ready',
      message: confirmMessage,
      classification
    }
  }

  if (agentResponse.status === 'create') {
    // Create Linear issue
    const classification = session.classification || agentResponse.classification
    
    if (!classification) {
      throw new Error('Classification not found for issue creation')
    }

    // Map classification to Linear issue
    // Default team ID - should be configurable
    const defaultTeamId = process.env.LINEAR_DEFAULT_TEAM_ID || 'd9a86fe0-32f2-42c4-9f69-698b6f05f6b7'
    
    // Map priority
    const priorityMap: Record<string, number> = {
      'urgent': 1,
      'high': 2,
      'medium': 3,
      'low': 4
    }

    const linearIssue = await createIssue({
      teamId: defaultTeamId,
      title: classification.title,
      description: `Summary: ${classification.summary}\nAreas: ${classification.areas.join(', ')}\nRisk flags: ${classification.risk_flags.join(', ')}\n\nReported by: ${session.user_name || session.user_email}${session.hubspot_team ? `\nTeam: ${session.hubspot_team}` : ''}`,
      priority: priorityMap[classification.priority] || 3,
      stateId: '34205277-5dab-43eb-af3b-6150e2dab059' // Default state ID
    })

    // Update session with Linear issue ID
    await updateSession(session.session_id, {
      linear_issue_id: linearIssue.id,
      state: 'CONVERSING'
    })

    const successMessage = "I've created an issue in Linear and notified the RevOps team. Thank you! You can report another issue if needed."

    const updatedMessages: ChatMessage[] = [
      ...messages,
      {
        role: 'assistant',
        content: successMessage
      }
    ]

    await updateSession(session.session_id, {
      messages: updatedMessages
    })

    return {
      status: 'create',
      message: successMessage,
      classification,
      linearIssueId: linearIssue.id
    }
  }

  throw new Error('Unexpected agent response status')
}

