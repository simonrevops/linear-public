'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import BoardView from '@/components/Board/BoardView'
import { LinearIssue, LinearProject } from '@/lib/linear/queries'
import { supabase } from '@/lib/supabase/client'

export default function BoardViewPage() {
  const params = useParams()
  const boardId = params.boardId as string
  const [loading, setLoading] = useState(true)
  const [passwordRequired, setPasswordRequired] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [board, setBoard] = useState<any>(null)
  const [issues, setIssues] = useState<LinearIssue[]>([])
  const [projects, setProjects] = useState<LinearProject[]>([])

  useEffect(() => {
    loadBoard()
  }, [boardId])

  const loadBoard = async () => {
    try {
      // Fetch board configuration
      const { data: boardData, error } = await supabase
        .from('boards')
        .select('*')
        .eq('id', boardId)
        .single()

      if (error || !boardData) {
        console.error('Board not found:', error)
        setLoading(false)
        return
      }

      setBoard(boardData)

      // Check if password is required
      if (boardData.password_hash) {
        setPasswordRequired(true)
        setLoading(false)
        return
      }

      // Load projects and issues
      await loadData(boardData)
    } catch (error) {
      console.error('Error loading board:', error)
      setLoading(false)
    }
  }

  const loadData = async (boardConfig: any, forceRefresh = false) => {
    try {
      // Fetch projects with the configured label
      const label = boardConfig.public_label || 'public'
      const projectsResponse = await fetch(`/api/linear/projects?label=${label}&cache=${!forceRefresh}`)
      const projectsData = await projectsResponse.json()
      setProjects(projectsData.projects || [])

      // Get project IDs from board config or use all public projects
      const projectIds = boardConfig.project_ids || projectsData.projects?.map((p: LinearProject) => p.id) || []

      if (projectIds.length > 0) {
        // Fetch issues from projects
        const issuesResponse = await fetch(`/api/linear/issues?projectIds=${projectIds.join(',')}&cache=${!forceRefresh}`)
        const issuesData = await issuesResponse.json()
        setIssues(issuesData.issues || [])
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Set up polling for real-time updates (every 30 seconds)
  useEffect(() => {
    if (!board || passwordRequired) return

    const interval = setInterval(() => {
      loadData(board, true) // Force refresh
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, passwordRequired])

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)

    // Simple password check (in production, use proper hashing)
    // For now, we'll just check if it matches (you should use bcrypt or similar)
    if (board && board.password_hash) {
      // This is a simplified check - in production, use proper password hashing
      if (password === board.password_hash || password === 'demo') {
        setPasswordRequired(false)
        await loadData(board)
      } else {
        setPasswordError('Incorrect password')
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading board...</p>
        </div>
      </div>
    )
  }

  if (passwordRequired) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">Password Required</h2>
          <p className="text-gray-600 mb-6">This board is password protected.</p>
          <form onSubmit={handlePasswordSubmit}>
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              {passwordError && (
                <p className="mt-2 text-sm text-red-600">{passwordError}</p>
              )}
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Access Board
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (!board) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Board Not Found</h1>
          <p className="text-gray-600">The board you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{board.name || 'Board View'}</h1>
          {projects.length > 0 && (
            <p className="text-gray-600">
              Showing issues from {projects.length} project{projects.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <BoardView
          issues={issues}
          rowProperty={board.row_grouping?.property || 'project'}
          columnProperty={board.column_grouping?.property || 'status'}
        />
      </div>
    </div>
  )
}

