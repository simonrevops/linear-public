import { LinearIssue } from './queries'

export type GroupingProperty = 
  | 'status' 
  | 'priority' 
  | 'assignee' 
  | 'project' 
  | 'team'
  | 'label'

export interface GroupedIssues {
  [key: string]: LinearIssue[]
}

/**
 * Group issues by a property
 */
export function groupIssuesByProperty(
  issues: LinearIssue[],
  property: GroupingProperty
): GroupedIssues {
  const grouped: GroupedIssues = {}

  for (const issue of issues) {
    let key: string

    switch (property) {
      case 'status':
        key = issue.state.name
        break
      case 'priority':
        key = `priority-${issue.priority}`
        break
      case 'assignee':
        key = issue.assignee?.id || 'unassigned'
        break
      case 'project':
        key = issue.project?.id || 'no-project'
        break
      case 'team':
        key = issue.team.id
        break
      case 'label':
        // For labels, we'll group by the first label or 'no-label'
        key = issue.labels?.nodes[0]?.id || 'no-label'
        break
      default:
        key = 'unknown'
    }

    if (!grouped[key]) {
      grouped[key] = []
    }
    grouped[key].push(issue)
  }

  return grouped
}

/**
 * Group issues by multiple properties (for row/column grouping)
 */
export function groupIssuesByProperties(
  issues: LinearIssue[],
  rowProperty: GroupingProperty,
  columnProperty: GroupingProperty
): Map<string, Map<string, LinearIssue[]>> {
  const result = new Map<string, Map<string, LinearIssue[]>>()

  for (const issue of issues) {
    const rowKey = getPropertyValue(issue, rowProperty)
    const columnKey = getPropertyValue(issue, columnProperty)

    if (!result.has(rowKey)) {
      result.set(rowKey, new Map())
    }

    const rowMap = result.get(rowKey)!
    if (!rowMap.has(columnKey)) {
      rowMap.set(columnKey, [])
    }

    rowMap.get(columnKey)!.push(issue)
  }

  return result
}

function getPropertyValue(issue: LinearIssue, property: GroupingProperty): string {
  switch (property) {
    case 'status':
      return issue.state.name
    case 'priority':
      return `priority-${issue.priority}`
    case 'assignee':
      return issue.assignee?.id || 'unassigned'
    case 'project':
      return issue.project?.id || 'no-project'
    case 'team':
      return issue.team.id
    case 'label':
      return issue.labels?.nodes[0]?.id || 'no-label'
    default:
      return 'unknown'
  }
}

/**
 * Get display name for a property value
 */
export function getPropertyDisplayName(
  issue: LinearIssue,
  property: GroupingProperty,
  value: string
): string {
  switch (property) {
    case 'status':
      return issue.state.name
    case 'priority':
      const priorityLabels: Record<number, string> = {
        0: 'No Priority',
        1: 'Urgent',
        2: 'High',
        3: 'Medium',
        4: 'Low'
      }
      return priorityLabels[issue.priority] || `Priority ${issue.priority}`
    case 'assignee':
      return issue.assignee?.name || 'Unassigned'
    case 'project':
      return issue.project?.name || 'No Project'
    case 'team':
      return issue.team.name
    case 'label':
      return issue.labels?.nodes.find(l => l.id === value)?.name || 'No Label'
    default:
      return value
  }
}

