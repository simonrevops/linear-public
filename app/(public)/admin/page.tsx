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
    <div className="h-screen bg-[#0d0d0d] flex flex-col" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif' }}>
      {/* Header - 44px */}
      <div className="h-11 border-b border-[#2a2a2a] flex items-center justify-between px-6 bg-[#0d0d0d]">
        <div className="flex items-center gap-6">
          <h1 className="text-[14px] font-medium text-[#ebebeb]">Admin Console</h1>
          <div className="flex items-center gap-1">
            <button className="px-2 py-1 text-[13px] text-[#ebebeb] border-b border-[#ebebeb]">Overview</button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#9466ff]"></div>
              <p className="mt-4 text-[#8a8a8a]">Loading admin data...</p>
            </div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-md p-4">
                <div className="text-[13px] text-[#8a8a8a] mb-1">Public Projects</div>
                <div className="text-2xl font-medium text-[#ebebeb]">{stats.publicProjects}</div>
              </div>
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-md p-4">
                <div className="text-[13px] text-[#8a8a8a] mb-1">Total Issues</div>
                <div className="text-2xl font-medium text-[#ebebeb]">{stats.totalIssues}</div>
              </div>
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-md p-4">
                <div className="text-[13px] text-[#8a8a8a] mb-1">Status</div>
                <div className="text-2xl font-medium text-[#9466ff]">Active</div>
              </div>
            </div>

            {/* Public Projects List */}
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[14px] font-medium text-[#ebebeb]">Public Projects</h2>
                <button
                  onClick={loadData}
                  className="px-4 py-2 bg-[#9466ff] text-white rounded-md hover:bg-[#8555e6] transition-colors duration-150 text-[13px]"
                >
                  Refresh
                </button>
              </div>

              {projects.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-[#8a8a8a] mb-2">No public projects found</p>
                  <p className="text-[13px] text-[#5c5c5c]">Tag projects with "public" label in Linear to make them visible</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      className="flex items-center justify-between p-3 bg-[#0d0d0d] border border-[#2a2a2a] rounded-md"
                    >
                      <div>
                        <h3 className="text-[13px] font-normal text-[#ebebeb]">{project.name}</h3>
                        {project.description && (
                          <p className="text-[12px] text-[#8a8a8a] mt-1">{project.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-[#5c5c5c] px-2 py-0.5 bg-[#262626] rounded-full">public</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
