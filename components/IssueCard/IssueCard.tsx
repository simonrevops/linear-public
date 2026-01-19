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

  return (
    <div
      className="bg-[#151515] border border-[#1f1f1f] rounded-lg p-3 hover:border-[#2f2f2f] transition-colors cursor-pointer mb-2"
      onClick={handleClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono text-[#6b7280]">{issue.identifier}</span>
          {issue.priority !== undefined && (
            <span
              className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                priorityColors[issue.priority] || priorityColors[0]
              }`}
              title={priorityLabels[issue.priority] || 'Unknown Priority'}
            >
              {priorityLabels[issue.priority] || 'Unknown'}
            </span>
          )}
        </div>
      </div>
      <h3 className="font-medium text-[#ededed] mb-2 line-clamp-2 text-sm">{issue.title}</h3>
      <div className="flex items-center justify-between">
        {issue.assignee && (
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-[#5e6ad2] flex items-center justify-center text-white text-xs">
              {issue.assignee.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs text-[#9ca3af]">{issue.assignee.name}</span>
          </div>
        )}
        {issue.project && (
          <span className="text-xs text-[#6b7280]">{issue.project.name}</span>
        )}
      </div>
      {issue.labels && issue.labels.nodes.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {issue.labels.nodes.map((label) => (
            <span
              key={label.id}
              className="px-1.5 py-0.5 bg-[#1f1f1f] text-[#9ca3af] text-xs rounded"
            >
              {label.name}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
