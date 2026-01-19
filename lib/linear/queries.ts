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

  return projects.nodes.map(project => ({
    id: project.id,
    name: project.name,
    description: project.description || undefined,
    state: project.state,
    progress: project.progress,
    teams: {
      nodes: project.teams.nodes.map(team => ({
        id: team.id,
        name: team.name
      }))
    },
    labels: project.labels ? {
      nodes: project.labels.nodes.map(label => ({
        id: label.id,
        name: label.name
      }))
    } : undefined
  }))
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

  return issues.nodes.map(issue => ({
    id: issue.id,
    identifier: issue.identifier,
    title: issue.title,
    description: issue.description || undefined,
    state: {
      id: issue.state.id,
      name: issue.state.name,
      type: issue.state.type
    },
    priority: issue.priority,
    assignee: issue.assignee ? {
      id: issue.assignee.id,
      name: issue.assignee.name,
      email: issue.assignee.email || undefined
    } : undefined,
    project: issue.project ? {
      id: issue.project.id,
      name: issue.project.name
    } : undefined,
    team: {
      id: issue.team.id,
      name: issue.team.name
    },
    labels: issue.labels ? {
      nodes: issue.labels.nodes.map(label => ({
        id: label.id,
        name: label.name
      }))
    } : undefined,
    createdAt: issue.createdAt,
    updatedAt: issue.updatedAt
  }))
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

  return issues.nodes.map(issue => ({
    id: issue.id,
    identifier: issue.identifier,
    title: issue.title,
    description: issue.description || undefined,
    state: {
      id: issue.state.id,
      name: issue.state.name,
      type: issue.state.type
    },
    priority: issue.priority,
    assignee: issue.assignee ? {
      id: issue.assignee.id,
      name: issue.assignee.name,
      email: issue.assignee.email || undefined
    } : undefined,
    project: issue.project ? {
      id: issue.project.id,
      name: issue.project.name
    } : undefined,
    team: {
      id: issue.team.id,
      name: issue.team.name
    },
    labels: issue.labels ? {
      nodes: issue.labels.nodes.map(label => ({
        id: label.id,
        name: label.name
      }))
    } : undefined,
    createdAt: issue.createdAt,
    updatedAt: issue.updatedAt
  }))
}

/**
 * Fetch comments for an issue
 */
export async function fetchIssueComments(issueId: string): Promise<LinearComment[]> {
  const issue = await linearClient.issue(issueId)
  const comments = await issue.comments()

  return comments.nodes.map(comment => ({
    id: comment.id,
    body: comment.body,
    user: {
      id: comment.user.id,
      name: comment.user.name,
      email: comment.user.email || undefined
    },
    createdAt: comment.createdAt
  }))
}

/**
 * Create a comment on an issue
 */
export async function createIssueComment(issueId: string, body: string, userId?: string): Promise<LinearComment> {
  const comment = await linearClient.createComment({
    issueId,
    body,
    ...(userId && { userId })
  })

  return {
    id: comment.id,
    body: comment.body,
    user: {
      id: comment.user.id,
      name: comment.user.name,
      email: comment.user.email || undefined
    },
    createdAt: comment.createdAt
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
  const issue = await linearClient.createIssue({
    teamId: data.teamId,
    title: data.title,
    description: data.description,
    priority: data.priority,
    stateId: data.stateId,
    projectId: data.projectId,
    labelIds: data.labelIds
  })

  // Fetch the full issue to return complete data
  const fullIssue = await linearClient.issue(issue.id)

  return {
    id: fullIssue.id,
    identifier: fullIssue.identifier,
    title: fullIssue.title,
    description: fullIssue.description || undefined,
    state: {
      id: fullIssue.state.id,
      name: fullIssue.state.name,
      type: fullIssue.state.type
    },
    priority: fullIssue.priority,
    assignee: fullIssue.assignee ? {
      id: fullIssue.assignee.id,
      name: fullIssue.assignee.name,
      email: fullIssue.assignee.email || undefined
    } : undefined,
    project: fullIssue.project ? {
      id: fullIssue.project.id,
      name: fullIssue.project.name
    } : undefined,
    team: {
      id: fullIssue.team.id,
      name: fullIssue.team.name
    },
    labels: fullIssue.labels ? {
      nodes: fullIssue.labels.nodes.map(label => ({
        id: label.id,
        name: label.name
      }))
    } : undefined,
    createdAt: fullIssue.createdAt,
    updatedAt: fullIssue.updatedAt
  }
}

