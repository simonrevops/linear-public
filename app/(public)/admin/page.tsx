'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { LinearProject } from '@/lib/linear/queries'
import Link from 'next/link'

export default function AdminPage() {
  const [boards, setBoards] = useState<any[]>([])
  const [projects, setProjects] = useState<LinearProject[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    public_label: 'public',
    password: '',
    row_grouping: 'project',
    column_grouping: 'status',
    project_ids: [] as string[],
  })

  useEffect(() => {
    loadBoards()
    loadProjects()
  }, [])

  const loadBoards = async () => {
    try {
      const { data, error } = await supabase
        .from('boards')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setBoards(data || [])
    } catch (error) {
      console.error('Error loading boards:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadProjects = async () => {
    try {
      const response = await fetch('/api/linear/projects?label=public')
      const data = await response.json()
      setProjects(data.projects || [])
    } catch (error) {
      console.error('Error loading projects:', error)
    }
  }

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { data, error } = await supabase
        .from('boards')
        .insert({
          name: formData.name,
          public_label: formData.public_label,
          password_hash: formData.password || null,
          row_grouping: { property: formData.row_grouping },
          column_grouping: { property: formData.column_grouping },
          project_ids: formData.project_ids.length > 0 ? formData.project_ids : null,
        })
        .select()
        .single()

      if (error) throw error

      setBoards([data, ...boards])
      setShowCreateForm(false)
      setFormData({
        name: '',
        public_label: 'public',
        password: '',
        row_grouping: 'project',
        column_grouping: 'status',
        project_ids: [],
      })
    } catch (error) {
      console.error('Error creating board:', error)
      alert('Failed to create board')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Board Configuration</h1>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {showCreateForm ? 'Cancel' : 'Create New Board'}
          </button>
        </div>

        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Create New Board</h2>
            <form onSubmit={handleCreateBoard} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Board Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Public Label</label>
                <input
                  type="text"
                  value={formData.public_label}
                  onChange={(e) => setFormData({ ...formData, public_label: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="public"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password (optional)</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Row Grouping</label>
                  <select
                    value={formData.row_grouping}
                    onChange={(e) => setFormData({ ...formData, row_grouping: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="project">Project</option>
                    <option value="status">Status</option>
                    <option value="priority">Priority</option>
                    <option value="assignee">Assignee</option>
                    <option value="team">Team</option>
                    <option value="label">Label</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Column Grouping</label>
                  <select
                    value={formData.column_grouping}
                    onChange={(e) => setFormData({ ...formData, column_grouping: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="status">Status</option>
                    <option value="priority">Priority</option>
                    <option value="assignee">Assignee</option>
                    <option value="project">Project</option>
                    <option value="team">Team</option>
                    <option value="label">Label</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Projects (leave empty for all)</label>
                <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2">
                  {projects.map((project) => (
                    <label key={project.id} className="flex items-center space-x-2 py-1">
                      <input
                        type="checkbox"
                        checked={formData.project_ids.includes(project.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, project_ids: [...formData.project_ids, project.id] })
                          } else {
                            setFormData({ ...formData, project_ids: formData.project_ids.filter(id => id !== project.id) })
                          }
                        }}
                      />
                      <span>{project.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
              >
                Create Board
              </button>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Label</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Protected</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Link</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {boards.map((board) => (
                <tr key={board.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {board.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {board.public_label}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {board.password_hash ? 'Yes' : 'No'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Link
                      href={`/view/${board.id}`}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      View Board
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

