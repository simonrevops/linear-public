'use client'

import { useState, useEffect } from 'react'
import { LinearProject, LinearIssue } from '@/lib/linear/queries'
import IssueCard from '@/components/IssueCard/IssueCard'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<LinearProject[]>([])
  const [selectedProject, setSelectedProject] = useState<LinearProject | null>(null)
  const [issues, setIssues] = useState<LinearIssue[]>([])
  const [loading, setLoading] = useState(true)
  const [issuesLoading, setIssuesLoading] = useState(false)
  const [statuses, setStatuses] = useState<string[]>([])
  const [milestones, setMilestones] = useState<Array<{ id: string; name: string; isCollapsed: boolean; count: number }>>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadProjects()
  }, [])

  useEffect(() => {
    if (selectedProject) {
      loadIssues([selectedProject.id])
    } else {
      setIssues([])
      setStatuses([])
      setMilestones([])
    }
  }, [selectedProject])

  const loadProjects = async () => {
    try {
      const response = await fetch('/api/linear/projects?label=public&cache=false')
      const data = await response.json()
      setProjects(data.projects || [])
    } catch (error) {
      console.error('Error loading projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadIssues = async (projectIds: string[]) => {
    setIssuesLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/linear/issues?projectIds=${projectIds.join(',')}&cache=false`)
      
      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to fetch issues')
        setIssues([])
        return
      }
      
      const data = await response.json()
      const loadedIssues = data.issues || []
      
      if (loadedIssues.length === 0) {
        setError('No issues found in this project. Make sure the project has issues in Linear.')
      } else {
        setError(null)
      }
      
      setIssues(loadedIssues)

      // Get workflow states from Linear API response or fetch separately
      let workflowStates: Array<{ name: string; position: number }> = []
      
      if (data.workflowStates) {
        workflowStates = data.workflowStates
      } else {
        try {
          const teamIds: string[] = Array.from(new Set(loadedIssues.map((issue: LinearIssue) => issue.team.id))) as string[]
          const statesResponse = await fetch(`/api/linear/states?teamIds=${teamIds.join(',')}&cache=false`)
          const statesData = await statesResponse.json()
          workflowStates = statesData.states || []
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
        setStatuses(uniqueStatuses)
      }

      // Extract milestones from labels
      const milestoneMap = new Map<string, number>()
      loadedIssues.forEach((issue: LinearIssue) => {
        if (issue.labels?.nodes && issue.labels.nodes.length > 0) {
          issue.labels.nodes.forEach(label => {
            if (!['bug', 'feature', 'enhancement', 'public'].includes(label.name.toLowerCase())) {
              milestoneMap.set(label.name, (milestoneMap.get(label.name) || 0) + 1)
            }
          })
        }
      })
      
      // Create milestone array with counts
      const milestoneArray: Array<{ id: string; name: string; isCollapsed: boolean; count: number }> = []
      
      // Always include "All Issues" as first milestone
      milestoneArray.push({
        id: 'all-issues',
        name: 'All Issues',
        isCollapsed: false,
        count: loadedIssues.length
      })
      
      // Add other milestones
      Array.from(milestoneMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .forEach(([name, count]) => {
          milestoneArray.push({
            id: name.toLowerCase().replace(/\s+/g, '-'),
            name,
            isCollapsed: false,
            count
          })
        })
      
      setMilestones(milestoneArray)
    } catch (error) {
      console.error('Error loading issues:', error)
    } finally {
      setIssuesLoading(false)
    }
  }

  const toggleProject = (project: LinearProject) => {
    if (selectedProject?.id === project.id) {
      setSelectedProject(null)
    } else {
      setSelectedProject(project)
    }
  }

  const toggleMilestone = (milestoneId: string) => {
    setMilestones(prev => prev.map(m => 
      m.id === milestoneId ? { ...m, isCollapsed: !m.isCollapsed } : m
    ))
  }

  const getIssuesForCell = (status: string, milestone: { id: string; name: string }) => {
    return issues.filter((issue) => {
      const matchesStatus = issue.state.name === status
      let matchesMilestone = false
      
      if (milestone.id === 'all-issues') {
        matchesMilestone = true
      } else if (issue.labels?.nodes) {
        matchesMilestone = issue.labels.nodes.some(label => label.name === milestone.name)
      }
      
      return matchesStatus && matchesMilestone
    })
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

  const getStatusCount = (status: string) => {
    return issues.filter(issue => issue.state.name === status).length
  }

  if (loading) {
    return (
      <div className="h-screen bg-[#0d0d0d] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#9466ff]"></div>
          <p className="mt-4 text-[#8a8a8a]">Loading projects...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-[#0d0d0d] flex" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif' }}>
      {/* Left Sidebar - 240px fixed */}
      <div className="w-[240px] bg-[#0d0d0d] border-r border-[#2a2a2a] overflow-y-auto">
        <div className="p-3">
          <div className="text-[12px] uppercase text-[#5c5c5c] tracking-wide mb-2 px-2">Projects</div>
          <div className="space-y-1">
            {projects.length === 0 ? (
              <div className="text-[13px] text-[#5c5c5c] px-2 py-2">No public projects found.</div>
            ) : (
              projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => toggleProject(project)}
                  className={`w-full flex items-center gap-2 h-8 px-2 rounded-md transition-colors duration-150 ${
                    selectedProject?.id === project.id
                      ? 'bg-[#262626] text-[#ebebeb]'
                      : 'text-[#ebebeb] hover:bg-[#262626]'
                  }`}
                >
                  <div className="w-4 h-4 flex items-center justify-center text-[#9466ff]">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                      <path d="M7 0L8.5 5H14L9.75 8L11.25 13L7 10L2.75 13L4.25 8L0 5H5.5L7 0Z"/>
                    </svg>
                  </div>
                  <span className="text-[13px] truncate">{project.name}</span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area - flex-1 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header Bar - 44px */}
        <div className="h-11 border-b border-[#2a2a2a] flex items-center justify-between px-6 bg-[#0d0d0d]">
          <div className="flex items-center gap-3">
            {selectedProject && (
              <>
                <div className="w-4 h-4 flex items-center justify-center text-[#9466ff]">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                    <path d="M7 0L8.5 5H14L9.75 8L11.25 13L7 10L2.75 13L4.25 8L0 5H5.5L7 0Z"/>
                  </svg>
                </div>
                <span className="text-[14px] font-medium text-[#ebebeb]">{selectedProject.name}</span>
              </>
            )}
            {!selectedProject && (
              <span className="text-[14px] font-medium text-[#ebebeb]">Projects</span>
            )}
          </div>
          
          {selectedProject && (
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-1">
                <button className="px-2 py-1 text-[13px] text-[#8a8a8a] hover:text-[#ebebeb] transition-colors duration-150">Overview</button>
                <button className="px-2 py-1 text-[13px] text-[#8a8a8a] hover:text-[#ebebeb] transition-colors duration-150">Updates</button>
                <button className="px-2 py-1 text-[13px] text-[#ebebeb] border-b border-[#ebebeb]">Issues</button>
              </div>
            </div>
          )}
        </div>

        {/* Board Area */}
        <div className="flex-1 overflow-auto bg-[#0d0d0d]">
          {!selectedProject ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-[#8a8a8a] mb-2">Select a project to view its board</p>
                <p className="text-[13px] text-[#5c5c5c]">Choose a project from the sidebar</p>
              </div>
            </div>
          ) : issuesLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#9466ff]"></div>
                <p className="mt-4 text-[#8a8a8a]">Loading issues...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-[#dc2626] mb-2">Error loading issues</p>
                <p className="text-[13px] text-[#8a8a8a]">{error}</p>
                <button
                  onClick={() => selectedProject && loadIssues([selectedProject.id])}
                  className="mt-4 px-4 py-2 bg-[#9466ff] text-white rounded-md text-[13px] hover:bg-[#8555e6] transition-colors duration-150"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : issues.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-[#8a8a8a] mb-2">No issues found</p>
                <p className="text-[13px] text-[#5c5c5c]">This project doesn't have any issues yet</p>
              </div>
            </div>
          ) : (
            <div className="p-6">
              {/* Column Headers - Fixed at top */}
              <div className="sticky top-0 z-20 bg-[#0d0d0d] border-b border-[#2a2a2a] mb-4">
                <div className="grid" style={{ gridTemplateColumns: `200px repeat(${statuses.length}, minmax(280px, 1fr))` }}>
                  {/* Empty cell for milestone column */}
                  <div className="h-10"></div>
                  {/* Status column headers */}
                  {statuses.map((status) => (
                    <div
                      key={status}
                      className="flex items-center gap-2 justify-center h-10"
                    >
                      {getStatusIcon(status)}
                      <span className="text-[13px] font-medium text-[#8a8a8a]">{status}</span>
                      <span className="text-[11px] text-[#5c5c5c]">({getStatusCount(status)})</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Milestone Rows */}
              <div className="space-y-4">
                {milestones.map((milestone) => {
                  const isCollapsed = milestone.isCollapsed
                  return (
                    <div key={milestone.id} className="w-full">
                      {/* Milestone Row Header */}
                      <div className="mb-2">
                        <button
                          onClick={() => toggleMilestone(milestone.id)}
                          className="flex items-center gap-2 px-2 py-1.5 hover:bg-[#262626] rounded-md transition-colors duration-150 w-full text-left"
                        >
                          <svg
                            className={`w-3 h-3 text-[#8a8a8a] transition-transform duration-150 ${isCollapsed ? '' : 'rotate-90'}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 8 8"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2 1L6 4L2 7" />
                          </svg>
                          <div className="w-3.5 h-3.5 flex items-center justify-center text-[#9466ff]">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                              <path d="M7 0L8.5 5H14L9.75 8L11.25 13L7 10L2.75 13L4.25 8L0 5H5.5L7 0Z"/>
                            </svg>
                          </div>
                          <span className="text-[13px] font-medium text-[#ebebeb]">{milestone.name}</span>
                          <span className="text-[11px] text-[#8a8a8a]">({milestone.count})</span>
                        </button>
                      </div>

                      {/* Milestone Row Content - Grid of status columns */}
                      {!isCollapsed && (
                        <div
                          className="grid gap-4"
                          style={{ gridTemplateColumns: `200px repeat(${statuses.length}, minmax(280px, 1fr))` }}
                        >
                          {/* Milestone label column (sticky) */}
                          <div className="sticky left-0 z-10 bg-[#0d0d0d]"></div>
                          
                          {/* Status columns */}
                          {statuses.map((status) => {
                            const cellIssues = getIssuesForCell(status, milestone)
                            return (
                              <div
                                key={`${milestone.id}-${status}`}
                                className="space-y-1.5 min-h-[100px]"
                              >
                                {cellIssues.map((issue) => (
                                  <IssueCard key={issue.id} issue={issue} />
                                ))}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
