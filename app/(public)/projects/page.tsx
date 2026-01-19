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
        // Fallback: fetch states separately if not included in response
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
        // Fallback: use statuses from issues in the order they appear
        setStatuses(uniqueStatuses)
      }

      // Extract milestones from labels
      // In Linear, milestones can be represented as labels or we use "All Issues" as default
      const milestoneSet = new Set<string>()
      loadedIssues.forEach((issue: LinearIssue) => {
        if (issue.labels?.nodes && issue.labels.nodes.length > 0) {
          issue.labels.nodes.forEach(label => {
            // Filter out common labels that aren't milestones
            if (!['bug', 'feature', 'enhancement', 'public'].includes(label.name.toLowerCase())) {
              milestoneSet.add(label.name)
            }
          })
        }
      })
      
      // Always include "All Issues" as a milestone row
      const uniqueMilestones = Array.from(milestoneSet).sort()
      setMilestones(uniqueMilestones.length > 0 ? ['All Issues', ...uniqueMilestones] : ['All Issues'])
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
      {/* Header */}
      <div className="bg-[#151515] border-b border-[#1f1f1f] px-6 py-3">
        {selectedProject ? (
          <h1 className="text-lg font-semibold text-[#ededed]">{selectedProject.name}</h1>
        ) : (
          <h1 className="text-lg font-semibold text-[#ededed]">Projects</h1>
        )}
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
              </div>
            </div>
          ) : (
            <div className="p-6">
              {/* Board Grid: Milestones as rows, Statuses as columns */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  {/* Header Row - Status Columns */}
                  <thead>
                    <tr>
                      <th className="sticky left-0 z-10 bg-[#151515] border border-[#1f1f1f] px-4 py-3 text-left text-sm font-medium text-[#ededed] min-w-[200px]">
                        Milestone
                      </th>
                      {statuses.map((status) => (
                        <th
                          key={status}
                          className="bg-[#151515] border border-[#1f1f1f] px-4 py-3 text-center text-sm font-medium text-[#ededed] min-w-[280px]"
                        >
                          {status}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {milestones.map((milestone) => (
                      <tr key={milestone}>
                        {/* Milestone Row Header */}
                        <td className="sticky left-0 z-10 bg-[#151515] border border-[#1f1f1f] px-4 py-3 text-sm font-medium text-[#ededed]">
                          {milestone}
                        </td>
                        {/* Status Columns */}
                        {statuses.map((status) => {
                          const cellIssues = getIssuesForCell(status, milestone)
                          return (
                            <td
                              key={`${milestone}-${status}`}
                              className="bg-[#151515] border border-[#1f1f1f] px-2 py-2 align-top"
                            >
                              <div className="space-y-2 min-h-[100px]">
                                {cellIssues.map((issue) => (
                                  <IssueCard key={issue.id} issue={issue} />
                                ))}
                                {cellIssues.length === 0 && (
                                  <div className="text-center py-4 text-xs text-[#6b7280]">
                                    —
                                  </div>
                                )}
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
