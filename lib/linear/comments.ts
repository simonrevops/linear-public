import { createIssueComment, fetchIssueComments } from './queries'
import { supabase } from '../supabase/client'

export interface PortalComment {
  id: string
  linear_issue_id: string
  author_name?: string
  author_email?: string
  content: string
  linear_comment_id?: string
  created_at: string
  updated_at: string
}

/**
 * Create a comment from the portal and sync to Linear
 */
export async function createAndSyncComment(
  issueId: string,
  content: string,
  authorName?: string,
  authorEmail?: string
): Promise<PortalComment> {
  // Create comment in Linear
  const linearComment = await createIssueComment(issueId, content)

  // Store in Supabase
  const { data, error } = await supabase
    .from('issue_comments')
    .insert({
      linear_issue_id: issueId,
      author_name: authorName,
      author_email: authorEmail,
      content: content,
      linear_comment_id: linearComment.id
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to save comment: ${error.message}`)
  }

  return {
    id: data.id,
    linear_issue_id: data.linear_issue_id,
    author_name: data.author_name || undefined,
    author_email: data.author_email || undefined,
    content: data.content,
    linear_comment_id: data.linear_comment_id || undefined,
    created_at: data.created_at,
    updated_at: data.updated_at
  }
}

/**
 * Fetch comments for an issue (from both Linear and portal)
 */
export async function fetchAllComments(issueId: string): Promise<Array<PortalComment | {
  id: string
  body: string
  user: {
    id: string
    name: string
    email?: string
  }
  createdAt: string
}>> {
  // Fetch from Linear
  const linearComments = await fetchIssueComments(issueId)

  // Fetch from portal (comments that haven't synced yet)
  const { data: portalComments } = await supabase
    .from('issue_comments')
    .select('*')
    .eq('linear_issue_id', issueId)
    .is('linear_comment_id', null)

  const allComments: Array<PortalComment | {
    id: string
    body: string
    user: {
      id: string
      name: string
      email?: string
    }
    createdAt: string
  }> = []

  // Add Linear comments
  for (const comment of linearComments) {
    allComments.push({
      id: comment.id,
      body: comment.body,
      user: comment.user,
      createdAt: comment.createdAt
    })
  }

  // Add portal comments
  if (portalComments) {
    for (const comment of portalComments) {
      allComments.push({
        id: comment.id,
        linear_issue_id: comment.linear_issue_id,
        author_name: comment.author_name || undefined,
        author_email: comment.author_email || undefined,
        content: comment.content,
        linear_comment_id: comment.linear_comment_id || undefined,
        created_at: comment.created_at,
        updated_at: comment.updated_at
      })
    }
  }

  // Sort by creation date
  allComments.sort((a, b) => {
    const dateA = 'createdAt' in a ? new Date(a.createdAt).getTime() : new Date(a.created_at).getTime()
    const dateB = 'createdAt' in b ? new Date(b.createdAt).getTime() : new Date(b.created_at).getTime()
    return dateA - dateB
  })

  return allComments
}

