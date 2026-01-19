'use client'

import { useState, useEffect } from 'react'
import { LinearProject } from '@/lib/linear/queries'

export default function AdminPage() {
  const [projects, setProjects] = useState<LinearProject[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalProjects: 0,
    publicProjects: 0,
    totalIssues: 0,
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const response = await fetch('/api/linear/projects?label=public&cache=false')
      const data = await response.json()
      setProjects(data.projects || [])
      setStats({
        totalProjects: data.projects?.length || 0,
        publicProjects: data.projects?.length || 0,
        totalIssues: 0, // Would need to fetch separately
      })
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen bg-[#0d0d0d] flex flex-col">
      {/* Header - Linear style */}
      <div className="bg-[#151515] border-b border-[#1f1f1f] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h1 className="text-lg font-semibold text-[#ededed]">Admin Console</h1>
          <div className="flex items-center gap-1 text-sm text-[#9ca3af]">
            <button className="px-3 py-1.5 bg-[#1f1f1f] text-[#ededed] rounded">Overview</button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-[#1f1f1f] rounded text-[#9ca3af]">🔗</button>
          <button className="p-2 hover:bg-[#1f1f1f] rounded text-[#9ca3af]">📊</button>
          <button className="px-3 py-1.5 text-sm text-[#9ca3af] hover:bg-[#1f1f1f] rounded">Display</button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#151515] border-b border-[#1f1f1f] px-6 py-2">
        <div className="flex items-center gap-2 text-sm text-[#9ca3af]">
          <span>🔍</span>
          <span>Filter</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#5e6ad2]"></div>
              <p className="mt-4 text-[#9ca3af]">Loading admin data...</p>
            </div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-[#151515] border border-[#1f1f1f] rounded-lg p-4">
                <div className="text-sm text-[#9ca3af] mb-1">Public Projects</div>
                <div className="text-2xl font-semibold text-[#ededed]">{stats.publicProjects}</div>
              </div>
              <div className="bg-[#151515] border border-[#1f1f1f] rounded-lg p-4">
                <div className="text-sm text-[#9ca3af] mb-1">Total Issues</div>
                <div className="text-2xl font-semibold text-[#ededed]">{stats.totalIssues}</div>
              </div>
              <div className="bg-[#151515] border border-[#1f1f1f] rounded-lg p-4">
                <div className="text-sm text-[#9ca3af] mb-1">Status</div>
                <div className="text-2xl font-semibold text-[#5e6ad2]">Active</div>
              </div>
            </div>

            {/* Public Projects List */}
            <div className="bg-[#151515] border border-[#1f1f1f] rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#ededed]">Public Projects</h2>
                <button
                  onClick={loadData}
                  className="px-4 py-2 bg-[#5e6ad2] text-white rounded-md hover:bg-[#4c56c4] transition-colors text-sm"
                >
                  Refresh
                </button>
              </div>

              {projects.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-[#9ca3af] mb-2">No public projects found.</p>
                  <p className="text-sm text-[#6b7280]">
                    Tag projects with the "public" label in Linear to make them visible.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      className="flex items-center justify-between p-4 bg-[#0d0d0d] border border-[#1f1f1f] rounded-lg hover:border-[#2f2f2f] transition-colors"
                    >
                      <div className="flex-1">
                        <h3 className="font-medium text-[#ededed] mb-1">{project.name}</h3>
                        {project.description && (
                          <p className="text-sm text-[#9ca3af]">{project.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-[#6b7280]">
                          <span>State: {project.state}</span>
                          <span>Progress: {Math.round(project.progress * 100)}%</span>
                          {project.teams.nodes.length > 0 && (
                            <span>Teams: {project.teams.nodes.map(t => t.name).join(', ')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-[#151515] border border-[#1f1f1f] rounded-lg p-6">
              <h3 className="text-lg font-semibold text-[#ededed] mb-3">How to Manage Public Projects</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-[#9ca3af]">
                <li>Go to your Linear workspace</li>
                <li>Open the project you want to make public</li>
                <li>Add the "public" label to the project</li>
                <li>Click "Refresh" above to see the updated list</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
