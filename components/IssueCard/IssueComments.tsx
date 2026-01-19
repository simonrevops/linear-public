'use client'

import { useState, useEffect } from 'react'

interface Comment {
  id: string
  body?: string
  content?: string
  user?: {
    id: string
    name: string
    email?: string
  }
  author_name?: string
  author_email?: string
  createdAt?: string
  created_at?: string
}

interface IssueCommentsProps {
  issueId: string
  onCommentAdded?: () => void
}

export default function IssueComments({ issueId, onCommentAdded }: IssueCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchComments()
  }, [issueId])

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/linear/comments?issueId=${issueId}`)
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments || [])
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim()) return

    setSubmitting(true)
    try {
      const response = await fetch('/api/linear/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          issueId,
          content: commentText,
        }),
      })

      if (response.ok) {
        setCommentText('')
        setShowForm(false)
        fetchComments()
        onCommentAdded?.()
      }
    } catch (error) {
      console.error('Error creating comment:', error)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="text-[13px] text-[#8a8a8a]">Loading comments...</div>
  }

  return (
    <div className="mt-4" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif' }}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-[13px] font-normal text-[#ebebeb]">Comments ({comments.length})</h4>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-[13px] text-[#9466ff] hover:text-[#8555e6] transition-colors duration-150"
        >
          {showForm ? 'Cancel' : 'Add Comment'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a comment..."
            className="w-full px-3 py-2 bg-[#0d0d0d] border border-[#2a2a2a] rounded-md text-[#ebebeb] focus:outline-none focus:ring-2 focus:ring-[#9466ff] focus:border-[#9466ff] transition-colors duration-150 text-[13px]"
            rows={3}
          />
          <div className="mt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                setCommentText('')
              }}
              className="px-4 py-2 text-[13px] text-[#8a8a8a] hover:text-[#ebebeb] transition-colors duration-150"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !commentText.trim()}
              className="px-4 py-2 text-[13px] bg-[#9466ff] text-white rounded-md hover:bg-[#8555e6] disabled:opacity-50 transition-colors duration-150"
            >
              {submitting ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {comments.map((comment) => {
          const authorName = comment.user?.name || comment.author_name || 'Anonymous'
          const content = comment.body || comment.content || ''
          const date = comment.createdAt || comment.created_at

          // Get initials for avatar
          const initials = authorName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)

          return (
            <div key={comment.id} className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-md p-3">
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-6 h-6 rounded-full bg-[#9466ff] flex items-center justify-center text-white text-[10px] font-medium">
                  {initials}
                </div>
                <span className="text-[13px] font-normal text-[#ebebeb]">{authorName}</span>
                {date && (
                  <span className="text-[11px] text-[#5c5c5c]">
                    {new Date(date).toLocaleDateString()}
                  </span>
                )}
              </div>
              <p className="text-[13px] text-[#ebebeb] whitespace-pre-wrap">{content}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
