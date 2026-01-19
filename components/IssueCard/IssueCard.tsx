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

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      setShowDetails(!showDetails)
    }
  }

  // Get assignee initials for avatar
  const getAssigneeInitials = () => {
    if (issue.assignee) {
      const nameParts = issue.assignee.name.split(' ')
      if (nameParts.length >= 2) {
        return (nameParts[0][0] + nameParts[1][0]).toUpperCase()
      }
      return issue.assignee.name.substring(0, 2).toUpperCase()
    }
    return null
  }

  // Get milestone/project label from issue labels
  const getMilestoneLabel = () => {
    if (issue.labels?.nodes && issue.labels.nodes.length > 0) {
      // Find first label that's not a common type
      const commonLabels = ['bug', 'feature', 'enhancement', 'public']
      const milestoneLabel = issue.labels.nodes.find(
        label => !commonLabels.includes(label.name.toLowerCase())
      )
      return milestoneLabel?.name
    }
    return null
  }

  if (showDetails) {
    return (
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-md p-4 mb-1.5">
        <button
          onClick={() => setShowDetails(false)}
          className="mb-3 text-[13px] text-[#9466ff] hover:text-[#8555e6] transition-colors duration-150"
        >
          ← Back
        </button>
        <div className="mb-4">
          <h3 className="font-medium text-[#ebebeb] mb-2 text-[13px]">{issue.title}</h3>
          <div className="flex items-center gap-3 text-[12px] text-[#8a8a8a] mb-3">
            <span className="font-mono">{issue.identifier}</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] bg-[#262626] text-[#8a8a8a]">{issue.state.name}</span>
          </div>
          {issue.description && (
            <div className="mt-3 p-3 bg-[#0d0d0d] rounded-md border border-[#2a2a2a]">
              <p className="whitespace-pre-wrap text-[#ebebeb] text-[13px]">{issue.description}</p>
            </div>
          )}
        </div>
        <IssueComments issueId={issue.id} />
      </div>
    )
  }

  const assigneeInitials = getAssigneeInitials()
  const milestoneLabel = getMilestoneLabel()

  return (
    <div
      className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-md p-3 hover:border-[#3a3a3a] transition-colors duration-150 cursor-pointer mb-1.5"
      style={{ 
        marginLeft: '4px', 
        marginRight: '4px',
        width: 'calc(100% - 8px)'
      }}
      onClick={handleClick}
    >
      {/* Header row: Issue ID (left) + Assignee avatar (right) */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[12px] text-[#5c5c5c] font-normal font-mono">{issue.identifier}</span>
        {assigneeInitials && (
          <div className="w-6 h-6 rounded-full bg-[#9466ff] flex items-center justify-center text-white text-[10px] font-medium flex-shrink-0">
            {assigneeInitials}
          </div>
        )}
      </div>

      {/* Title */}
      <h3 className="text-[13px] text-[#ebebeb] font-normal line-clamp-2 mb-2 leading-snug">{issue.title}</h3>

      {/* Metadata row */}
      {milestoneLabel && (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 px-2 py-0.5 bg-[#262626] rounded-full">
            <div className="w-3 h-3 flex items-center justify-center text-[#9466ff]">
              <svg width="12" height="12" viewBox="0 0 14 14" fill="currentColor">
                <path d="M7 0L8.5 5H14L9.75 8L11.25 13L7 10L2.75 13L4.25 8L0 5H5.5L7 0Z"/>
              </svg>
            </div>
            <span className="text-[11px] text-[#8a8a8a]">{milestoneLabel}</span>
          </div>
        </div>
      )}
    </div>
  )
}
