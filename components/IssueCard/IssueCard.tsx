'use client'

import { LinearIssue } from '@/lib/linear/queries'

interface IssueCardProps {
  issue: LinearIssue
  onClick?: () => void
}

export default function IssueCard({ issue, onClick }: IssueCardProps) {
  const priorityColors: Record<number, string> = {
    0: 'bg-gray-200',
    1: 'bg-red-500',
    2: 'bg-orange-500',
    3: 'bg-yellow-500',
    4: 'bg-blue-500',
  }

  const priorityLabels: Record<number, string> = {
    0: 'No Priority',
    1: 'Urgent',
    2: 'High',
    3: 'Medium',
    4: 'Low',
  }

  return (
    <div
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-mono text-gray-500">{issue.identifier}</span>
          {issue.priority !== undefined && (
            <span
              className={`px-2 py-0.5 rounded text-xs font-medium text-white ${
                priorityColors[issue.priority] || 'bg-gray-200'
              }`}
              title={priorityLabels[issue.priority] || 'Unknown Priority'}
            >
              {priorityLabels[issue.priority] || 'Unknown'}
            </span>
          )}
        </div>
      </div>
      <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">{issue.title}</h3>
      {issue.assignee && (
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
            {issue.assignee.name.charAt(0).toUpperCase()}
          </div>
          <span>{issue.assignee.name}</span>
        </div>
      )}
      {issue.labels && issue.labels.nodes.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {issue.labels.nodes.map((label) => (
            <span
              key={label.id}
              className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded"
            >
              {label.name}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

