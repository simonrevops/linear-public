'use client'

import { useState, useEffect } from 'react'
import { LinearIssue } from '@/lib/linear/queries'
import { GroupingProperty } from '@/lib/linear/groupBy'
import BoardGrid from './BoardGrid'
import IssueComments from '../IssueCard/IssueComments'

interface BoardViewProps {
  issues: LinearIssue[]
  rowProperty?: GroupingProperty
  columnProperty?: GroupingProperty
  defaultRowProperty?: GroupingProperty
  defaultColumnProperty?: GroupingProperty
}

export default function BoardView({
  issues,
  rowProperty: initialRowProperty,
  columnProperty: initialColumnProperty,
  defaultRowProperty = 'project',
  defaultColumnProperty = 'status',
}: BoardViewProps) {
  const [rowProperty, setRowProperty] = useState<GroupingProperty>(
    initialRowProperty || defaultRowProperty
  )
  const [columnProperty, setColumnProperty] = useState<GroupingProperty>(
    initialColumnProperty || defaultColumnProperty
  )
  const [selectedIssue, setSelectedIssue] = useState<LinearIssue | null>(null)

  const groupingOptions: Array<{ value: GroupingProperty; label: string }> = [
    { value: 'status', label: 'Status' },
    { value: 'priority', label: 'Priority' },
    { value: 'assignee', label: 'Assignee' },
    { value: 'project', label: 'Project' },
    { value: 'team', label: 'Team' },
    { value: 'label', label: 'Label' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Group by (Rows)</label>
            <select
              value={rowProperty}
              onChange={(e) => setRowProperty(e.target.value as GroupingProperty)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {groupingOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Group by (Columns)</label>
            <select
              value={columnProperty}
              onChange={(e) => setColumnProperty(e.target.value as GroupingProperty)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {groupingOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="text-sm text-gray-600">
          {issues.length} issue{issues.length !== 1 ? 's' : ''}
        </div>
      </div>

      {selectedIssue ? (
        <div className="bg-white rounded-lg shadow-md p-6">
          <button
            onClick={() => setSelectedIssue(null)}
            className="mb-4 text-sm text-blue-600 hover:text-blue-700"
          >
            ← Back to board
          </button>
          <div className="mb-4">
            <h2 className="text-2xl font-bold mb-2">{selectedIssue.title}</h2>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className="font-mono">{selectedIssue.identifier}</span>
              <span>{selectedIssue.state.name}</span>
              {selectedIssue.assignee && <span>Assigned to: {selectedIssue.assignee.name}</span>}
            </div>
            {selectedIssue.description && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <p className="whitespace-pre-wrap">{selectedIssue.description}</p>
              </div>
            )}
          </div>
          <IssueComments issueId={selectedIssue.id} />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-4">
          <BoardGrid
            issues={issues}
            rowProperty={rowProperty}
            columnProperty={columnProperty}
            onIssueClick={setSelectedIssue}
          />
        </div>
      )}
    </div>
  )
}

