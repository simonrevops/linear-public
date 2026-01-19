'use client'

import { useState, useEffect } from 'react'
import { LinearIssue } from '@/lib/linear/queries'
import IssueCard from '@/components/IssueCard/IssueCard'

export default function AllIssuesPage() {
  const [issues, setIssues] = useState<LinearIssue[]>([])
  const [loading, setLoading] = useState(true)
  const [statuses, setStatuses] = useState<string[]>([])

  useEffect(() => {
    loadAllIssues()
  }, [])

  const loadAllIssues = async () => {
    try {
      // Fetch all public projects first
      const projectsResponse = await fetch('/api/linear/projects?label=public&cache=false')
      const projectsData = await projectsResponse.json()
      const projectIds = projectsData.projects?.map((p: any) => p.id) || []

      if (projectIds.length === 0) {
        setIssues([])
        setStatuses([])
        setLoading(false)
        return
      }

      // Fetch issues from public projects
      const issuesResponse = await fetch(`/api/linear/issues?projectIds=${projectIds.join(',')}&cache=false`)
      const issuesData = await issuesResponse.json()
      const loadedIssues = issuesData.issues || []

      setIssues(loadedIssues)

      // Extract unique statuses - order them like Linear
      const uniqueStatuses = Array.from(
        new Set(loadedIssues.map((issue: LinearIssue) => issue.state.name))
      )
      
      const statusOrder = ['Backlog', 'Todo', 'In Progress', 'Done', 'Canceled']
      const orderedStatuses = statusOrder.filter(s => uniqueStatuses.includes(s))
      const remainingStatuses = uniqueStatuses.filter(s => !statusOrder.includes(s)).sort()
      setStatuses([...orderedStatuses, ...remainingStatuses])
    } catch (error) {
      console.error('Error loading issues:', error)
    } finally {
      setLoading(false)
    }
  }

  const getIssuesByStatus = (status: string) => {
    return issues.filter((issue) => issue.state.name === status)
  }

  const getStatusCount = (status: string) => {
    return issues.filter(issue => issue.state.name === status).length
  }

  return (
    <div className="h-screen bg-[#0d0d0d] flex flex-col">
      {/* Header - Linear style */}
      <div className="bg-[#151515] border-b border-[#1f1f1f] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h1 className="text-lg font-semibold text-[#ededed]">All Issues</h1>
          <div className="flex items-center gap-1 text-sm text-[#9ca3af]">
            <button className="px-3 py-1.5 bg-[#1f1f1f] text-[#ededed] rounded">Issues</button>
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
              <p className="mt-4 text-[#9ca3af]">Loading issues...</p>
            </div>
          </div>
        ) : issues.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-[#9ca3af] mb-2">No issues found.</p>
              <p className="text-sm text-[#6b7280]">Make sure you have public projects with issues in Linear.</p>
            </div>
          </div>
        ) : (
          <div className="bg-[#151515] border border-[#1f1f1f] rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <div className="flex gap-4 p-4 min-w-max">
                {statuses.map((status) => {
                  const statusIssues = getIssuesByStatus(status)
                  const count = getStatusCount(status)
                  return (
                    <div
                      key={status}
                      className="flex-shrink-0 w-80"
                    >
                      {/* Column Header */}
                      <div className="bg-[#151515] border border-[#1f1f1f] rounded-t-lg p-3 mb-2">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-medium text-[#ededed]">{status}</h3>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[#6b7280]">{count}</span>
                            <button className="text-[#9ca3af] hover:text-[#ededed]">⋯</button>
                            <button className="text-[#9ca3af] hover:text-[#ededed]">+</button>
                          </div>
                        </div>
                      </div>

                      {/* Issues List */}
                      <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
                        {statusIssues.map((issue) => (
                          <IssueCard key={issue.id} issue={issue} />
                        ))}
                        {statusIssues.length === 0 && (
                          <div className="text-center py-8 text-[#6b7280] text-sm bg-[#151515] border border-[#1f1f1f] rounded-lg">
                            No issues
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
