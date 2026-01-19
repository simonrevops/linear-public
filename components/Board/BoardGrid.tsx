'use client'

import { LinearIssue } from '@/lib/linear/queries'
import { GroupingProperty, groupIssuesByProperties, getPropertyDisplayName } from '@/lib/linear/groupBy'
import IssueCard from '../IssueCard/IssueCard'
import { useState } from 'react'

interface BoardGridProps {
  issues: LinearIssue[]
  rowProperty: GroupingProperty
  columnProperty: GroupingProperty
  onIssueClick?: (issue: LinearIssue) => void
}

export default function BoardGrid({ issues, rowProperty, columnProperty, onIssueClick }: BoardGridProps) {
  const grouped = groupIssuesByProperties(issues, rowProperty, columnProperty)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set(Array.from(grouped.keys())))

  const toggleRow = (rowKey: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(rowKey)) {
        next.delete(rowKey)
      } else {
        next.add(rowKey)
      }
      return next
    })
  }

  // Get all unique column keys
  const allColumnKeys = new Set<string>()
  grouped.forEach((rowMap) => {
    rowMap.forEach((_, columnKey) => {
      allColumnKeys.add(columnKey)
    })
  })

  const columnKeys = Array.from(allColumnKeys).sort()
  const rowKeys = Array.from(grouped.keys()).sort()

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead>
          <tr>
            <th className="border border-gray-300 bg-gray-50 p-2 text-left font-medium text-gray-700 sticky left-0 z-10">
              {rowProperty === 'status' ? 'Status' : rowProperty === 'project' ? 'Project' : rowProperty === 'team' ? 'Team' : rowProperty === 'assignee' ? 'Assignee' : rowProperty === 'priority' ? 'Priority' : 'Label'}
            </th>
            {columnKeys.map((columnKey) => {
              const sampleIssue = issues.find(issue => {
                const value = columnProperty === 'status' ? issue.state.name :
                  columnProperty === 'priority' ? `priority-${issue.priority}` :
                  columnProperty === 'assignee' ? issue.assignee?.id || 'unassigned' :
                  columnProperty === 'project' ? issue.project?.id || 'no-project' :
                  columnProperty === 'team' ? issue.team.id :
                  issue.labels?.nodes[0]?.id || 'no-label'
                return value === columnKey
              })
              const displayName = sampleIssue
                ? getPropertyDisplayName(sampleIssue, columnProperty, columnKey)
                : columnKey

              return (
                <th
                  key={columnKey}
                  className="border border-gray-300 bg-gray-50 p-2 text-center font-medium text-gray-700 min-w-[200px]"
                >
                  {displayName}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {rowKeys.map((rowKey) => {
            const rowMap = grouped.get(rowKey)!
            const sampleIssue = issues.find(issue => {
              const value = rowProperty === 'status' ? issue.state.name :
                rowProperty === 'priority' ? `priority-${issue.priority}` :
                rowProperty === 'assignee' ? issue.assignee?.id || 'unassigned' :
                rowProperty === 'project' ? issue.project?.id || 'no-project' :
                rowProperty === 'team' ? issue.team.id :
                issue.labels?.nodes[0]?.id || 'no-label'
              return value === rowKey
            })
            const rowDisplayName = sampleIssue
              ? getPropertyDisplayName(sampleIssue, rowProperty, rowKey)
              : rowKey
            const isExpanded = expandedRows.has(rowKey)

            return (
              <tr key={rowKey} className="border-b border-gray-200">
                <td
                  className="border border-gray-300 bg-gray-50 p-2 sticky left-0 z-10 cursor-pointer hover:bg-gray-100"
                  onClick={() => toggleRow(rowKey)}
                >
                  <div className="flex items-center space-x-2">
                    <span className={isExpanded ? 'transform rotate-90' : ''}>▶</span>
                    <span className="font-medium">{rowDisplayName}</span>
                    <span className="text-sm text-gray-500">
                      ({Array.from(rowMap.values()).reduce((sum, issues) => sum + issues.length, 0)})
                    </span>
                  </div>
                </td>
                {columnKeys.map((columnKey) => {
                  const columnIssues = rowMap.get(columnKey) || []
                  const count = columnIssues.length

                  return (
                    <td
                      key={columnKey}
                      className="border border-gray-300 p-2 align-top bg-white"
                    >
                      {isExpanded && (
                        <div className="space-y-2">
                          {columnIssues.map((issue) => (
                            <IssueCard
                              key={issue.id}
                              issue={issue}
                              onClick={() => onIssueClick?.(issue)}
                            />
                          ))}
                          {count === 0 && (
                            <div className="text-sm text-gray-400 text-center py-4">
                              No issues
                            </div>
                          )}
                        </div>
                      )}
                      {!isExpanded && (
                        <div className="text-sm text-gray-500 text-center py-2">
                          {count > 0 && <span className="font-medium">{count}</span>}
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

