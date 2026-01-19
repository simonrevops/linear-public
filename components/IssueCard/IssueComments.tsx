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
    return <div className="text-sm text-gray-500">Loading comments...</div>
  }

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-700">Comments ({comments.length})</h4>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-sm text-blue-600 hover:text-blue-700"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
          <div className="mt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                setCommentText('')
              }}
              className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !commentText.trim()}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
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

          return (
            <div key={comment.id} className="bg-gray-50 rounded-md p-3">
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
                  {authorName.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-gray-900">{authorName}</span>
                {date && (
                  <span className="text-xs text-gray-500">
                    {new Date(date).toLocaleDateString()}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{content}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

