'use client'

import { useState, useEffect } from 'react'
import { LinearProject, LinearIssue } from '@/lib/linear/queries'
import IssueCard from '@/components/IssueCard/IssueCard'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<LinearProject[]>([])
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set())
  const [issues, setIssues] = useState<LinearIssue[]>([])
  const [loading, setLoading] = useState(true)
  const [statuses, setStatuses] = useState<string[]>([])
  const [milestones, setMilestones] = useState<string[]>([])

  useEffect(() => {
    loadProjects()
  }, [])

  useEffect(() => {
    if (selectedProjects.size > 0) {
      loadIssues(Array.from(selectedProjects))
    } else {
      setIssues([])
      setStatuses([])
      setMilestones([])
    }
  }, [selectedProjects])

  const loadProjects = async () => {
    try {
      const response = await fetch('/api/linear/projects?label=public')
      const data = await response.json()
      setProjects(data.projects || [])
    } catch (error) {
      console.error('Error loading projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadIssues = async (projectIds: string[]) => {
    try {
      const response = await fetch(`/api/linear/issues?projectIds=${projectIds.join(',')}`)
      const data = await response.json()
      const loadedIssues = data.issues || []
      setIssues(loadedIssues)

      // Extract unique statuses and milestones
      const uniqueStatuses = Array.from(new Set(loadedIssues.map((issue: LinearIssue) => issue.state.name))).sort() as string[]
      setStatuses(uniqueStatuses)

      // Extract milestones from project names (or use a milestone field if available)
      // For now, grouping by project as milestone proxy
      const uniqueMilestones = Array.from(
        new Set(loadedIssues.map((issue: LinearIssue) => issue.project?.name || 'No Project'))
      ).sort() as string[]
      setMilestones(uniqueMilestones)
    } catch (error) {
      console.error('Error loading issues:', error)
    }
  }

  const toggleProject = (projectId: string) => {
    const newSelected = new Set(selectedProjects)
    if (newSelected.has(projectId)) {
      newSelected.delete(projectId)
    } else {
      newSelected.add(projectId)
    }
    setSelectedProjects(newSelected)
  }

  const getIssuesForCell = (status: string, milestone: string) => {
    return issues.filter(
      (issue) =>
        issue.state.name === status &&
        (issue.project?.name || 'No Project') === milestone
    )
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#5e6ad2]"></div>
          <p className="mt-4 text-[#9ca3af]">Loading projects...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#ededed] mb-2">Projects</h1>
        <p className="text-[#9ca3af]">Select projects to view their issues organized by status and milestone.</p>
      </div>

      {/* Project Toggle List */}
      <div className="bg-[#151515] border border-[#1f1f1f] rounded-lg p-4 mb-6">
        <h2 className="text-sm font-medium text-[#9ca3af] mb-3">Public Projects</h2>
        <div className="space-y-2">
          {projects.length === 0 ? (
            <p className="text-[#6b7280] text-sm">No public projects found. Tag projects with "public" label in Linear.</p>
          ) : (
            projects.map((project) => (
              <label
                key={project.id}
                className="flex items-center gap-3 p-2 rounded hover:bg-[#1f1f1f] cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedProjects.has(project.id)}
                  onChange={() => toggleProject(project.id)}
                  className="w-4 h-4 rounded border-[#1f1f1f] bg-[#0d0d0d] text-[#5e6ad2] focus:ring-[#5e6ad2]"
                />
                <span className="text-[#ededed]">{project.name}</span>
                {project.description && (
                  <span className="text-sm text-[#6b7280] ml-auto">{project.description}</span>
                )}
              </label>
            ))
          )}
        </div>
      </div>

      {/* Issues Board */}
      {selectedProjects.size > 0 && issues.length > 0 && (
        <div className="bg-[#151515] border border-[#1f1f1f] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-[#151515] border-r border-b border-[#1f1f1f] p-3 text-left text-sm font-medium text-[#9ca3af] min-w-[200px]">
                    Milestone
                  </th>
                  {statuses.map((status) => (
                    <th
                      key={status}
                      className="border-b border-[#1f1f1f] p-3 text-center text-sm font-medium text-[#9ca3af] min-w-[250px]"
                    >
                      {status}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {milestones.map((milestone) => (
                  <tr key={milestone} className="border-b border-[#1f1f1f]">
                    <td className="sticky left-0 z-10 bg-[#151515] border-r border-[#1f1f1f] p-3 font-medium text-[#ededed]">
                      {milestone}
                    </td>
                    {statuses.map((status) => {
                      const cellIssues = getIssuesForCell(status, milestone)
                      return (
                        <td
                          key={`${milestone}-${status}`}
                          className="border-r border-[#1f1f1f] p-2 align-top bg-[#0d0d0d]"
                        >
                          <div className="space-y-2 min-h-[60px]">
                            {cellIssues.map((issue) => (
                              <IssueCard key={issue.id} issue={issue} />
                            ))}
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

      {selectedProjects.size > 0 && issues.length === 0 && (
        <div className="bg-[#151515] border border-[#1f1f1f] rounded-lg p-8 text-center">
          <p className="text-[#9ca3af]">No issues found in selected projects.</p>
        </div>
      )}

      {selectedProjects.size === 0 && (
        <div className="bg-[#151515] border border-[#1f1f1f] rounded-lg p-8 text-center">
          <p className="text-[#9ca3af]">Select one or more projects above to view issues.</p>
        </div>
      )}
    </div>
  )
}

