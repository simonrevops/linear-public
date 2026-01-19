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
  const [milestones, setMilestones] = useState<string[]>([])
  const [collapsedMilestones, setCollapsedMilestones] = useState<Set<string>>(new Set())
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
      console.log('Loading issues for project IDs:', projectIds)
      const response = await fetch(`/api/linear/issues?projectIds=${projectIds.join(',')}&cache=false`)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error response:', errorData)
        setError(errorData.error || 'Failed to fetch issues')
        setIssues([])
        return
      }
      
      const data = await response.json()
      const loadedIssues = data.issues || []
      console.log('Loaded issues:', loadedIssues.length, loadedIssues)
      
      if (loadedIssues.length === 0) {
        console.warn('No issues returned for project IDs:', projectIds)
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
        // Fallback: fetch states separately if not included in response
        try {
          const teamIds = Array.from(new Set(loadedIssues.map((issue: LinearIssue) => issue.team.id)))
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
        // Fallback: use statuses from issues in the order they appear
        setStatuses(uniqueStatuses)
      }

      // Extract milestones - for now using labels or project areas
      // In Linear, milestones are typically project milestones or can be derived from labels
      const milestoneSet = new Set<string>()
      loadedIssues.forEach((issue: LinearIssue) => {
        // Try to get milestone from labels first
        if (issue.labels?.nodes && issue.labels.nodes.length > 0) {
          issue.labels.nodes.forEach(label => {
            // Filter out common labels that aren't milestones
            if (!['bug', 'feature', 'enhancement'].includes(label.name.toLowerCase())) {
              milestoneSet.add(label.name)
            }
          })
        }
        // If no milestone label, use a default
        if (milestoneSet.size === 0 && issue.project) {
          milestoneSet.add('All Issues')
        }
      })
      
      const uniqueMilestones = Array.from(milestoneSet).sort()
      setMilestones(uniqueMilestones.length > 0 ? uniqueMilestones : ['All Issues'])
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

  const toggleMilestone = (milestone: string) => {
    const newCollapsed = new Set(collapsedMilestones)
    if (newCollapsed.has(milestone)) {
      newCollapsed.delete(milestone)
    } else {
      newCollapsed.add(milestone)
    }
    setCollapsedMilestones(newCollapsed)
  }

  const getIssuesForCell = (status: string, milestone: string) => {
    return issues.filter((issue) => {
      const matchesStatus = issue.state.name === status
      let matchesMilestone = false
      
      if (milestone === 'All Issues') {
        matchesMilestone = true
      } else if (issue.labels?.nodes) {
        matchesMilestone = issue.labels.nodes.some(label => label.name === milestone)
      }
      
      return matchesStatus && matchesMilestone
    })
  }

  const getStatusCount = (status: string) => {
    return issues.filter(issue => issue.state.name === status).length
  }

  if (loading) {
    return (
      <div className="h-screen bg-[#0d0d0d] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#5e6ad2]"></div>
          <p className="mt-4 text-[#9ca3af]">Loading projects...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-[#0d0d0d] flex flex-col">
      {/* Header - Linear style */}
      <div className="bg-[#151515] border-b border-[#1f1f1f] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          {selectedProject ? (
            <>
              <h1 className="text-lg font-semibold text-[#ededed]">{selectedProject.name}</h1>
              <div className="flex items-center gap-1 text-sm text-[#9ca3af]">
                <button className="px-3 py-1.5 hover:bg-[#1f1f1f] rounded">Overview</button>
                <button className="px-3 py-1.5 hover:bg-[#1f1f1f] rounded">Updates</button>
                <button className="px-3 py-1.5 bg-[#1f1f1f] text-[#ededed] rounded">Issues</button>
              </div>
            </>
          ) : (
            <h1 className="text-lg font-semibold text-[#ededed]">Projects</h1>
          )}
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

      <div className="flex-1 overflow-hidden flex">
        {/* Sidebar - Project List */}
        <div className="w-64 bg-[#151515] border-r border-[#1f1f1f] overflow-y-auto">
          <div className="p-4">
            <h2 className="text-xs font-semibold text-[#9ca3af] uppercase mb-3">Public Projects</h2>
            <div className="space-y-1">
              {projects.length === 0 ? (
                <p className="text-xs text-[#6b7280] p-2">No public projects found.</p>
              ) : (
                projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => toggleProject(project)}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                      selectedProject?.id === project.id
                        ? 'bg-[#5e6ad2] text-white'
                        : 'text-[#ededed] hover:bg-[#1f1f1f]'
                    }`}
                  >
                    {project.name}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Main Board Area */}
        <div className="flex-1 overflow-auto bg-[#0d0d0d]">
          {!selectedProject ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-[#9ca3af] mb-2">Select a project to view its board</p>
                <p className="text-sm text-[#6b7280]">Choose a project from the sidebar</p>
              </div>
            </div>
          ) : issuesLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#5e6ad2]"></div>
                <p className="mt-4 text-[#9ca3af]">Loading issues...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-[#dc2626] mb-2">Error loading issues</p>
                <p className="text-sm text-[#9ca3af]">{error}</p>
                <button
                  onClick={() => selectedProject && loadIssues([selectedProject.id])}
                  className="mt-4 px-4 py-2 bg-[#5e6ad2] text-white rounded text-sm hover:bg-[#4c56c4]"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : issues.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-[#9ca3af] mb-2">No issues found</p>
                <p className="text-sm text-[#6b7280]">This project doesn't have any issues yet</p>
                <p className="text-xs text-[#6b7280] mt-2">Check the browser console for debugging info</p>
              </div>
            </div>
          ) : (
            <div className="p-6">
              {/* Status Columns */}
              <div className="flex gap-4 overflow-x-auto pb-4">
                {statuses.map((status) => {
                  const count = getStatusCount(status)
                  return (
                    <div key={status} className="flex-shrink-0 w-80">
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

                      {/* Milestone Sections */}
                      <div className="space-y-4">
                        {milestones.map((milestone) => {
                          const isCollapsed = collapsedMilestones.has(milestone)
                          const milestoneIssues = getIssuesForCell(status, milestone)
                          
                          if (milestoneIssues.length === 0 && milestone !== 'All Issues') {
                            return null
                          }

                          return (
                            <div key={`${status}-${milestone}`} className="bg-[#151515] border border-[#1f1f1f] rounded-lg">
                              {/* Milestone Header */}
                              <button
                                onClick={() => toggleMilestone(milestone)}
                                className="w-full flex items-center justify-between p-3 hover:bg-[#1f1f1f] rounded-t-lg transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-[#9ca3af]">
                                    {isCollapsed ? '▶' : '▼'}
                                  </span>
                                  <span className="text-sm font-medium text-[#ededed]">{milestone}</span>
                                  <span className="text-xs text-[#6b7280]">({milestoneIssues.length})</span>
                                </div>
                              </button>

                              {/* Issues in this milestone */}
                              {!isCollapsed && (
                                <div className="p-2 space-y-2 min-h-[100px]">
                                  {milestoneIssues.map((issue) => (
                                    <IssueCard key={issue.id} issue={issue} />
                                  ))}
                                  {milestoneIssues.length === 0 && (
                                    <div className="text-center py-8 text-xs text-[#6b7280]">
                                      No issues
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
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
