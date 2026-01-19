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
      const projectsResponse = await fetch('/api/linear/projects?label=public')
      const projectsData = await projectsResponse.json()
      const projectIds = projectsData.projects?.map((p: any) => p.id) || []

      // Fetch issues from public projects and unassigned issues
      const issuesResponse = await fetch(`/api/linear/issues?projectIds=${projectIds.join(',')}`)
      const issuesData = await issuesResponse.json()
      const loadedIssues = issuesData.issues || []

      // Also fetch issues without projects
      // Note: This might require a separate API call or modification to the API
      setIssues(loadedIssues)

      // Extract unique statuses
      const uniqueStatuses = Array.from(
        new Set(loadedIssues.map((issue: LinearIssue) => issue.state.name))
      ).sort() as string[]
      setStatuses(uniqueStatuses)
    } catch (error) {
      console.error('Error loading issues:', error)
    } finally {
      setLoading(false)
    }
  }

  const getIssuesByStatus = (status: string) => {
    return issues.filter((issue) => issue.state.name === status)
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#5e6ad2]"></div>
          <p className="mt-4 text-[#9ca3af]">Loading issues...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#ededed] mb-2">All Issues</h1>
        <p className="text-[#9ca3af]">
          View all issues from public projects and unassigned issues, organized by status.
        </p>
      </div>

      {issues.length === 0 ? (
        <div className="bg-[#151515] border border-[#1f1f1f] rounded-lg p-8 text-center">
          <p className="text-[#9ca3af]">No issues found.</p>
        </div>
      ) : (
        <div className="bg-[#151515] border border-[#1f1f1f] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <div className="flex gap-4 p-4 min-w-max">
              {statuses.map((status) => {
                const statusIssues = getIssuesByStatus(status)
                return (
                  <div
                    key={status}
                    className="flex-shrink-0 w-80 border-r border-[#1f1f1f] last:border-r-0"
                  >
                    <div className="mb-3">
                      <h3 className="text-sm font-medium text-[#9ca3af] mb-1">{status}</h3>
                      <span className="text-xs text-[#6b7280]">{statusIssues.length} issues</span>
                    </div>
                    <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
                      {statusIssues.map((issue) => (
                        <IssueCard key={issue.id} issue={issue} />
                      ))}
                      {statusIssues.length === 0 && (
                        <div className="text-center py-8 text-[#6b7280] text-sm">
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
  )
}

