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

      // Get workflow states from Linear
      let workflowStates: Array<{ name: string; position: number }> = []
      
      if (issuesData.workflowStates) {
        workflowStates = issuesData.workflowStates
      } else {
        // Fallback: fetch states separately if not included in response
        try {
          const teamIds: string[] = Array.from(new Set(loadedIssues.map((issue: LinearIssue) => issue.team.id))) as string[]
          if (teamIds.length > 0) {
            const statesResponse = await fetch(`/api/linear/states?teamIds=${teamIds.join(',')}&cache=false`)
            const statesData = await statesResponse.json()
            workflowStates = statesData.states || []
          }
        } catch (err) {
          console.error('Error fetching workflow states:', err)
        }
      }

      // Extract unique statuses from issues
      const uniqueStatuses: string[] = Array.from(
        new Set(loadedIssues.map((issue: LinearIssue) => issue.state.name))
      ) as string[]

      // Order statuses by their position in Linear's workflow
      if (workflowStates.length > 0) {
        const statusMap = new Map(workflowStates.map(s => [s.name, s.position]))
        const orderedStatuses = workflowStates
          .filter(state => uniqueStatuses.includes(state.name))
          .map(state => state.name)
        const unorderedStatuses = uniqueStatuses.filter((s: string) => !statusMap.has(s)).sort()
        setStatuses([...orderedStatuses, ...unorderedStatuses])
      } else {
        // Fallback: use statuses from issues in the order they appear
        setStatuses(uniqueStatuses)
      }
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

  const getStatusIcon = (status: string) => {
    const statusLower = status.toLowerCase()
    if (statusLower.includes('backlog')) {
      return (
        <div className="w-3.5 h-3.5 rounded-full border border-[#5c5c5c]" />
      )
    } else if (statusLower.includes('todo')) {
      return (
        <div className="w-3.5 h-3.5 rounded-full border border-[#e5e5e5]" />
      )
    } else if (statusLower.includes('progress')) {
      return (
        <div className="w-3.5 h-3.5 rounded-full border-2 border-[#f2c94c] border-t-transparent border-r-transparent" />
      )
    } else if (statusLower.includes('done')) {
      return (
        <div className="w-3.5 h-3.5 rounded-full bg-[#5bb98c] flex items-center justify-center">
          <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 8 8">
            <path d="M6.5 1L3 4.5L1.5 3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      )
    }
    return <div className="w-3.5 h-3.5 rounded-full border border-[#5c5c5c]" />
  }

  return (
    <div className="h-screen bg-[#0d0d0d] flex flex-col" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif' }}>
      {/* Header - 44px */}
      <div className="h-11 border-b border-[#2a2a2a] flex items-center justify-between px-6 bg-[#0d0d0d]">
        <div className="flex items-center gap-6">
          <h1 className="text-[14px] font-medium text-[#ebebeb]">All Issues</h1>
          <div className="flex items-center gap-1">
            <button className="px-2 py-1 text-[13px] text-[#ebebeb] border-b border-[#ebebeb]">Issues</button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#9466ff]"></div>
              <p className="mt-4 text-[#8a8a8a]">Loading issues...</p>
            </div>
          </div>
        ) : issues.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-[#8a8a8a] mb-2">No issues found.</p>
              <p className="text-[13px] text-[#5c5c5c]">Make sure you have public projects with issues in Linear.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="flex gap-4 min-w-max">
              {statuses.map((status) => {
                const statusIssues = getIssuesByStatus(status)
                const count = getStatusCount(status)
                return (
                  <div
                    key={status}
                    className="flex-shrink-0"
                    style={{ minWidth: '280px', width: '280px' }}
                  >
                    {/* Column Header */}
                    <div className="flex items-center gap-2 justify-center mb-4 pb-2 border-b border-[#2a2a2a]">
                      {getStatusIcon(status)}
                      <span className="text-[13px] font-medium text-[#8a8a8a]">{status}</span>
                      <span className="text-[11px] text-[#5c5c5c]">({count})</span>
                    </div>

                    {/* Issues List */}
                    <div className="space-y-1.5">
                      {statusIssues.map((issue) => (
                        <IssueCard key={issue.id} issue={issue} />
                      ))}
                      {statusIssues.length === 0 && (
                        <div className="text-center py-8 text-[#5c5c5c] text-[13px]">
                          —
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
