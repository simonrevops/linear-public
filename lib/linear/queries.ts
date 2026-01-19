import { linearClient } from './client'

export interface LinearProject {
  id: string
  name: string
  description?: string
  state: string
  progress: number
  teams: {
    nodes: Array<{
      id: string
      name: string
    }>
  }
  labels?: {
    nodes: Array<{
      id: string
      name: string
    }>
  }
}

export interface LinearIssue {
  id: string
  identifier: string
  title: string
  description?: string
  state: {
    id: string
    name: string
    type: string
  }
  priority: number
  assignee?: {
    id: string
    name: string
    email: string
  }
  project?: {
    id: string
    name: string
  }
  team: {
    id: string
    name: string
  }
  labels?: {
    nodes: Array<{
      id: string
      name: string
    }>
  }
  createdAt: string
  updatedAt: string
}

export interface LinearComment {
  id: string
  body: string
  user: {
    id: string
    name: string
    email?: string
  }
  createdAt: string
}

export interface LinearWorkflowState {
  id: string
  name: string
  type: string
  position: number
}

/**
 * Fetch workflow states for a team
 */
export async function fetchWorkflowStates(teamId: string): Promise<LinearWorkflowState[]> {
  try {
    const team = await linearClient.team(teamId)
    
    // Handle states - may be a function that returns a promise
    const workflowStatesData = typeof team.states === 'function'
      ? await (team.states as any)()
      : await (team.states as any)
    
    const results: LinearWorkflowState[] = []
    
    if (workflowStatesData?.nodes) {
      for (const state of workflowStatesData.nodes) {
        results.push({
          id: state.id,
          name: state.name,
          type: state.type,
          position: state.position || 0
        })
      }
    }
    
    // Sort by position (Linear's workflow order)
    return results.sort((a, b) => a.position - b.position)
  } catch (error) {
    console.error('Error fetching workflow states:', error)
    return []
  }
}

/**
 * Fetch workflow states for multiple teams and merge them
 * Returns unique states ordered by their position in workflows
 */
export async function fetchWorkflowStatesForTeams(teamIds: string[]): Promise<LinearWorkflowState[]> {
  if (teamIds.length === 0) {
    return []
  }

  const allStates = new Map<string, LinearWorkflowState>()
  
  for (const teamId of teamIds) {
    const states = await fetchWorkflowStates(teamId)
    for (const state of states) {
      // Use name as key to avoid duplicates, keep the one with lower position
      const existing = allStates.get(state.name)
      if (!existing || existing.position > state.position) {
        allStates.set(state.name, state)
      }
    }
  }
  
  // Return sorted by position
  return Array.from(allStates.values()).sort((a, b) => a.position - b.position)
}

/**
 * Fetch projects with a specific label
 */
export async function fetchProjectsWithLabel(labelName: string = 'public'): Promise<LinearProject[]> {
  const projects = await linearClient.projects({
    filter: {
      labels: {
        name: { eq: labelName }
      }
    }
  })

  const results: LinearProject[] = []
  
  for (const project of projects.nodes) {
    // Handle teams - may be a function that returns a promise
    const teamsData = typeof project.teams === 'function' 
      ? await (project.teams as any)() 
      : await (project.teams as any)
    const teamsNodes = teamsData?.nodes || []

    // Handle labels - may be a function that returns a promise
    let labelsNodes: any[] = []
    if (project.labels) {
      const labelsData = typeof project.labels === 'function'
        ? await (project.labels as any)()
        : await (project.labels as any)
      labelsNodes = labelsData?.nodes || []
    }

    results.push({
      id: project.id,
      name: project.name,
      description: project.description || undefined,
      state: project.state,
      progress: project.progress,
      teams: {
        nodes: teamsNodes.map((team: any) => ({
          id: team.id,
          name: team.name
        }))
      },
      labels: labelsNodes.length > 0 ? {
        nodes: labelsNodes.map((label: any) => ({
          id: label.id,
          name: label.name
        }))
      } : undefined
    })
  }

  return results
}

/**
 * Fetch issues from multiple projects
 */
export async function fetchIssuesFromProjects(projectIds: string[]): Promise<LinearIssue[]> {
  if (projectIds.length === 0) {
    return []
  }

  const issues = await linearClient.issues({
    filter: {
      project: {
        id: { in: projectIds }
      }
    }
  })

  const results: LinearIssue[] = []

  for (const issue of issues.nodes) {
    // Await LinearFetch objects - handle both function and direct access
    const state = issue.state ? (typeof issue.state === 'function' ? await (issue.state as any)() : await (issue.state as any)) : null
    const team = issue.team ? (typeof issue.team === 'function' ? await (issue.team as any)() : await (issue.team as any)) : null
    const assignee = issue.assignee ? (typeof issue.assignee === 'function' ? await (issue.assignee as any)() : await (issue.assignee as any)) : null
    const project = issue.project ? (typeof issue.project === 'function' ? await (issue.project as any)() : await (issue.project as any)) : null
    let labelsNodes: any[] = []
    if (issue.labels) {
      const labelsData = typeof issue.labels === 'function'
        ? await (issue.labels as any)()
        : await (issue.labels as any)
      labelsNodes = labelsData?.nodes || []
    }

    if (!state || !team) {
      continue // Skip if required fields are missing
    }

    results.push({
      id: issue.id,
      identifier: issue.identifier,
      title: issue.title,
      description: issue.description || undefined,
      state: {
        id: state.id,
        name: state.name,
        type: state.type
      },
      priority: issue.priority,
      assignee: assignee && assignee.email ? {
        id: assignee.id,
        name: assignee.name,
        email: assignee.email
      } : undefined,
      project: project ? {
        id: project.id,
        name: project.name
      } : undefined,
      team: {
        id: team.id,
        name: team.name
      },
      labels: labelsNodes.length > 0 ? {
        nodes: labelsNodes.map((label: any) => ({
          id: label.id,
          name: label.name
        }))
      } : undefined,
      createdAt: issue.createdAt.toISOString(),
      updatedAt: issue.updatedAt.toISOString()
    })
  }

  return results
}

/**
 * Fetch issues by team
 */
export async function fetchIssuesByTeam(teamId: string): Promise<LinearIssue[]> {
  const issues = await linearClient.issues({
    filter: {
      team: {
        id: { eq: teamId }
      }
    }
  })

  const results: LinearIssue[] = []

  for (const issue of issues.nodes) {
    // Await LinearFetch objects - handle both function and direct access
    const state = issue.state ? (typeof issue.state === 'function' ? await (issue.state as any)() : await (issue.state as any)) : null
    const team = issue.team ? (typeof issue.team === 'function' ? await (issue.team as any)() : await (issue.team as any)) : null
    const assignee = issue.assignee ? (typeof issue.assignee === 'function' ? await (issue.assignee as any)() : await (issue.assignee as any)) : null
    const project = issue.project ? (typeof issue.project === 'function' ? await (issue.project as any)() : await (issue.project as any)) : null
    let labelsNodes: any[] = []
    if (issue.labels) {
      const labelsData = typeof issue.labels === 'function'
        ? await (issue.labels as any)()
        : await (issue.labels as any)
      labelsNodes = labelsData?.nodes || []
    }

    if (!state || !team) {
      continue // Skip if required fields are missing
    }

    results.push({
      id: issue.id,
      identifier: issue.identifier,
      title: issue.title,
      description: issue.description || undefined,
      state: {
        id: state.id,
        name: state.name,
        type: state.type
      },
      priority: issue.priority,
      assignee: assignee && assignee.email ? {
        id: assignee.id,
        name: assignee.name,
        email: assignee.email
      } : undefined,
      project: project ? {
        id: project.id,
        name: project.name
      } : undefined,
      team: {
        id: team.id,
        name: team.name
      },
      labels: labelsNodes.length > 0 ? {
        nodes: labelsNodes.map((label: any) => ({
          id: label.id,
          name: label.name
        }))
      } : undefined,
      createdAt: issue.createdAt.toISOString(),
      updatedAt: issue.updatedAt.toISOString()
    })
  }

  return results
}

/**
 * Fetch comments for an issue
 */
export async function fetchIssueComments(issueId: string): Promise<LinearComment[]> {
  const issue = await linearClient.issue(issueId)
  const comments = await issue.comments()

  const results: LinearComment[] = []

  for (const comment of comments.nodes) {
    const user = comment.user ? (typeof comment.user === 'function' ? await (comment.user as any)() : await (comment.user as any)) : null
    if (!user) {
      continue
    }
    results.push({
      id: comment.id,
      body: comment.body,
      user: {
        id: user.id,
        name: user.name,
        email: user.email || undefined
      },
      createdAt: comment.createdAt.toISOString()
    })
  }

  return results
}

/**
 * Create a comment on an issue
 */
export async function createIssueComment(issueId: string, body: string, userId?: string): Promise<LinearComment> {
  const commentPayload = await linearClient.createComment({
    issueId,
    body,
    ...(userId && { userId })
  })

  // Fetch the created comment to get full data
  const issue = await linearClient.issue(issueId)
  const comments = await issue.comments()
  const createdComment = comments.nodes[comments.nodes.length - 1] // Get the most recent comment
  
  if (!createdComment) {
    throw new Error('Failed to fetch created comment')
  }

  const user = createdComment.user ? (typeof createdComment.user === 'function' ? await (createdComment.user as any)() : await (createdComment.user as any)) : null
  if (!user) {
    throw new Error('Failed to fetch comment user')
  }

  return {
    id: createdComment.id,
    body: createdComment.body,
    user: {
      id: user.id,
      name: user.name,
      email: user.email || undefined
    },
    createdAt: createdComment.createdAt.toISOString()
  }
}

/**
 * Create an issue
 */
export async function createIssue(data: {
  teamId: string
  title: string
  description?: string
  priority?: number
  stateId?: string
  projectId?: string
  labelIds?: string[]
}): Promise<LinearIssue> {
  const issuePayload = await linearClient.createIssue({
    teamId: data.teamId,
    title: data.title,
    description: data.description,
    priority: data.priority,
    stateId: data.stateId,
    projectId: data.projectId,
    labelIds: data.labelIds
  })

  // IssuePayload may have different structure, try to get ID
  const issueId = (issuePayload as any).id || (issuePayload as any).issue?.id
  if (!issueId) {
    throw new Error('Failed to get issue ID from creation response')
  }

  // Fetch the full issue to return complete data
  const fullIssue = await linearClient.issue(issueId)

  // Await all LinearFetch objects - handle both function and direct access
  const state = fullIssue.state ? (typeof fullIssue.state === 'function' ? await (fullIssue.state as any)() : await (fullIssue.state as any)) : null
  const team = fullIssue.team ? (typeof fullIssue.team === 'function' ? await (fullIssue.team as any)() : await (fullIssue.team as any)) : null
  const assignee = fullIssue.assignee ? (typeof fullIssue.assignee === 'function' ? await (fullIssue.assignee as any)() : await (fullIssue.assignee as any)) : null
  const project = fullIssue.project ? (typeof fullIssue.project === 'function' ? await (fullIssue.project as any)() : await (fullIssue.project as any)) : null
  let labelsNodes: any[] = []
  if (fullIssue.labels) {
    const labelsData = typeof fullIssue.labels === 'function'
      ? await (fullIssue.labels as any)()
      : await (fullIssue.labels as any)
    labelsNodes = labelsData?.nodes || []
  }

  if (!state || !team) {
    throw new Error('Failed to fetch required issue data')
  }

  return {
    id: fullIssue.id,
    identifier: fullIssue.identifier,
    title: fullIssue.title,
    description: fullIssue.description || undefined,
    state: {
      id: state.id,
      name: state.name,
      type: state.type
    },
    priority: fullIssue.priority,
    assignee: assignee && assignee.email ? {
      id: assignee.id,
      name: assignee.name,
      email: assignee.email
    } : undefined,
    project: project ? {
      id: project.id,
      name: project.name
    } : undefined,
    team: {
      id: team.id,
      name: team.name
    },
    labels: labelsNodes.length > 0 ? {
      nodes: labelsNodes.map((label: any) => ({
        id: label.id,
        name: label.name
      }))
    } : undefined,
    createdAt: fullIssue.createdAt.toISOString(),
    updatedAt: fullIssue.updatedAt.toISOString()
  }
}
