'use client'

import { LinearIssue } from '@/lib/linear/queries'
import { useState } from 'react'
import IssueComments from './IssueComments'

interface IssueCardProps {
  issue: LinearIssue
  onClick?: () => void
}

export default function IssueCard({ issue, onClick }: IssueCardProps) {
  const [showDetails, setShowDetails] = useState(false)

  const priorityColors: Record<number, string> = {
    0: 'bg-[#2f2f2f] text-[#9ca3af]',
    1: 'bg-[#dc2626] text-white',
    2: 'bg-[#ea580c] text-white',
    3: 'bg-[#ca8a04] text-white',
    4: 'bg-[#2563eb] text-white',
  }

  const priorityLabels: Record<number, string> = {
    0: 'No Priority',
    1: 'Urgent',
    2: 'High',
    3: 'Medium',
    4: 'Low',
  }

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      setShowDetails(!showDetails)
    }
  }

  // Get assignee initials for tag
  const getAssigneeTag = () => {
    if (issue.assignee) {
      const nameParts = issue.assignee.name.split(' ')
      if (nameParts.length >= 2) {
        return (nameParts[0][0] + nameParts[1][0]).toUpperCase()
      }
      return issue.assignee.name.substring(0, 2).toUpperCase()
    }
    return null
  }

  // Get team tag (using team name)
  const getTeamTag = () => {
    if (issue.team) {
      const teamParts = issue.team.name.split(' ')
      if (teamParts.length >= 2) {
        return (teamParts[0][0] + teamParts[1][0]).toUpperCase()
      }
      return issue.team.name.substring(0, 2).toUpperCase()
    }
    return null
  }

  if (showDetails) {
    return (
      <div className="bg-[#151515] border border-[#1f1f1f] rounded-lg p-4 mb-2">
        <button
          onClick={() => setShowDetails(false)}
          className="mb-3 text-sm text-[#5e6ad2] hover:text-[#4c56c4]"
        >
          ← Back
        </button>
        <div className="mb-4">
          <h3 className="font-semibold text-[#ededed] mb-2">{issue.title}</h3>
          <div className="flex items-center gap-3 text-sm text-[#9ca3af] mb-3">
            <span className="font-mono">{issue.identifier}</span>
            <span className="px-2 py-0.5 rounded text-xs bg-[#1f1f1f]">{issue.state.name}</span>
            {issue.priority !== undefined && (
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium ${
                  priorityColors[issue.priority] || priorityColors[0]
                }`}
              >
                {priorityLabels[issue.priority] || 'Unknown'}
              </span>
            )}
          </div>
          {issue.description && (
            <div className="mt-3 p-3 bg-[#0d0d0d] rounded border border-[#1f1f1f]">
              <p className="whitespace-pre-wrap text-[#ededed] text-sm">{issue.description}</p>
            </div>
          )}
        </div>
        <IssueComments issueId={issue.id} />
      </div>
    )
  }

  const assigneeTag = getAssigneeTag()
  const teamTag = getTeamTag()

  return (
    <div
      className="bg-[#151515] border border-[#1f1f1f] rounded-lg p-2.5 hover:border-[#2f2f2f] transition-colors cursor-pointer mb-2 text-left"
      onClick={handleClick}
    >
      {/* Top row: ID and tag */}
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-xs font-mono text-[#9ca3af] font-medium">{issue.identifier}</span>
        {(assigneeTag || teamTag) && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#5e6ad2]/20 text-[#5e6ad2] border border-[#5e6ad2]/30">
            {assigneeTag || teamTag}
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="font-medium text-[#ededed] mb-2 text-sm leading-snug line-clamp-2">{issue.title}</h3>

      {/* Bottom row: Icons and metadata */}
      <div className="flex items-center gap-2 text-xs text-[#6b7280]">
        {/* Priority indicator */}
        {issue.priority !== undefined && issue.priority > 0 && (
          <span className={`w-1.5 h-1.5 rounded-full ${
            issue.priority === 1 ? 'bg-[#dc2626]' :
            issue.priority === 2 ? 'bg-[#ea580c]' :
            issue.priority === 3 ? 'bg-[#ca8a04]' :
            'bg-[#2563eb]'
          }`} />
        )}
        
        {/* Project/Milestone name */}
        {issue.project && (
          <span className="flex items-center gap-1">
            <span>◆</span>
            <span>{issue.project.name}</span>
          </span>
        )}
        
        {/* Assignee avatar */}
        {issue.assignee && (
          <div className="ml-auto flex items-center gap-1">
            <div className="w-4 h-4 rounded-full bg-[#5e6ad2] flex items-center justify-center text-white text-[10px]">
              {issue.assignee.name.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
      </div>

      {/* Labels */}
      {issue.labels && issue.labels.nodes.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {issue.labels.nodes.slice(0, 3).map((label) => (
            <span
              key={label.id}
              className="px-1.5 py-0.5 bg-[#1f1f1f] text-[#9ca3af] text-[10px] rounded"
            >
              {label.name}
            </span>
          ))}
          {issue.labels.nodes.length > 3 && (
            <span className="px-1.5 py-0.5 bg-[#1f1f1f] text-[#6b7280] text-[10px] rounded">
              +{issue.labels.nodes.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
