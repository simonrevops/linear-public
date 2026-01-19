import { supabase } from '../supabase/client'
import { ChatMessage } from './classifier'

export interface ChatbotSession {
  id: string
  session_id: string
  user_id?: string
  user_name?: string
  user_email: string
  hubspot_contact_id?: string
  hubspot_team?: string
  hubspot_team_id?: string
  channel_id?: string
  thread_ts?: string
  state: 'CONVERSING' | 'AWAIT_DUPLICATE' | 'AWAIT_CONFIRMATION'
  classification?: any
  messages: ChatMessage[]
  duplicate_id?: string
  linear_issue_id?: string
  created_at: string
  updated_at: string
}

/**
 * Create a new chatbot session
 */
export async function createSession(data: {
  userEmail: string
  userName?: string
  userId?: string
  hubspotContactId?: string
  hubspotTeam?: string
  hubspotTeamId?: string
}): Promise<ChatbotSession> {
  const sessionId = `${data.userEmail}-${Date.now()}`

  const { data: session, error } = await supabase
    .from('chatbot_sessions')
    .insert({
      session_id: sessionId,
      user_id: data.userId || data.userEmail,
      user_name: data.userName,
      user_email: data.userEmail,
      hubspot_contact_id: data.hubspotContactId,
      hubspot_team: data.hubspotTeam,
      hubspot_team_id: data.hubspotTeamId,
      state: 'CONVERSING',
      messages: JSON.stringify([]),
      classification: null
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create session: ${error.message}`)
  }

  return {
    ...session,
    messages: []
  }
}

/**
 * Get session by session ID
 */
export async function getSession(sessionId: string): Promise<ChatbotSession | null> {
  const { data, error } = await supabase
    .from('chatbot_sessions')
    .select('*')
    .eq('session_id', sessionId)
    .single()

  if (error || !data) {
    return null
  }

  return {
    ...data,
    messages: typeof data.messages === 'string' ? JSON.parse(data.messages) : data.messages || []
  }
}

/**
 * Get session by user email
 */
export async function getSessionByEmail(userEmail: string): Promise<ChatbotSession | null> {
  const { data, error } = await supabase
    .from('chatbot_sessions')
    .select('*')
    .eq('user_email', userEmail)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    return null
  }

  return {
    ...data,
    messages: typeof data.messages === 'string' ? JSON.parse(data.messages) : data.messages || []
  }
}

/**
 * Update session
 */
export async function updateSession(
  sessionId: string,
  updates: {
    state?: ChatbotSession['state']
    messages?: ChatMessage[]
    classification?: any
    linear_issue_id?: string
  }
): Promise<ChatbotSession> {
  const updateData: any = {
    updated_at: new Date().toISOString()
  }

  if (updates.state !== undefined) {
    updateData.state = updates.state
  }

  if (updates.messages !== undefined) {
    updateData.messages = JSON.stringify(updates.messages)
  }

  if (updates.classification !== undefined) {
    updateData.classification = updates.classification
  }

  if (updates.linear_issue_id !== undefined) {
    updateData.linear_issue_id = updates.linear_issue_id
  }

  const { data, error } = await supabase
    .from('chatbot_sessions')
    .update(updateData)
    .eq('session_id', sessionId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update session: ${error.message}`)
  }

  return {
    ...data,
    messages: typeof data.messages === 'string' ? JSON.parse(data.messages) : data.messages || []
  }
}

/**
 * Delete session
 */
export async function deleteSession(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('chatbot_sessions')
    .delete()
    .eq('session_id', sessionId)

  if (error) {
    throw new Error(`Failed to delete session: ${error.message}`)
  }
}

