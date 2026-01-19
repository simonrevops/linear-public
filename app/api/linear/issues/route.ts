import { NextRequest, NextResponse } from 'next/server'
import { fetchIssuesFromProjects, fetchWorkflowStatesForTeams } from '@/lib/linear/queries'
import { supabase } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const projectIds = searchParams.get('projectIds')?.split(',') || []
    const useCache = searchParams.get('cache') !== 'false'

    if (projectIds.length === 0) {
      return NextResponse.json({ issues: [] })
    }

    // Check cache first
    if (useCache) {
      const cacheKey = `issues:projects:${projectIds.sort().join(',')}`
      const { data: cached } = await supabase
        .from('linear_cache')
        .select('*')
        .eq('cache_key', cacheKey)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (cached) {
        // Try to get workflow states from cache or fetch fresh
        const teamIds: string[] = Array.from(
          new Set(cached.data.map((issue: any) => issue.team?.id).filter(Boolean))
        ) as string[]
        let workflowStates: any[] = []
        if (teamIds.length > 0) {
          try {
            const statesCacheKey = `workflow_states:teams:${teamIds.sort().join(',')}`
            const { data: statesCached } = await supabase
              .from('linear_cache')
              .select('*')
              .eq('cache_key', statesCacheKey)
              .gt('expires_at', new Date().toISOString())
              .single()
            
            if (statesCached) {
              workflowStates = statesCached.data
            } else {
              // Fetch fresh if not cached
              workflowStates = await fetchWorkflowStatesForTeams(teamIds)
            }
          } catch (err) {
            console.error('Error fetching workflow states from cache:', err)
          }
        }
        
        return NextResponse.json({
          issues: cached.data,
          workflowStates,
          cached: true
        })
      }
    }

    // Fetch from Linear
    const issues = await fetchIssuesFromProjects(projectIds)

    // Get unique team IDs from issues to fetch workflow states
    const teamIds: string[] = Array.from(new Set(issues.map(issue => issue.team.id))) as string[]
    const workflowStates = await fetchWorkflowStatesForTeams(teamIds)

    // Cache the issues (expires in 2 minutes)
    const cacheKey = `issues:projects:${projectIds.sort().join(',')}`
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000).toISOString()

    await supabase
      .from('linear_cache')
      .upsert({
        cache_key: cacheKey,
        data: issues,
        expires_at: expiresAt
      })

    // Cache workflow states separately (expires in 10 minutes - states don't change often)
    if (teamIds.length > 0 && workflowStates.length > 0) {
      const statesCacheKey = `workflow_states:teams:${teamIds.sort().join(',')}`
      const statesExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()
      
      await supabase
        .from('linear_cache')
        .upsert({
          cache_key: statesCacheKey,
          data: workflowStates,
          expires_at: statesExpiresAt
        })
    }

    return NextResponse.json({
      issues,
      workflowStates,
      cached: false
    })
  } catch (error) {
    console.error('Error fetching issues:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch issues' },
      { status: 500 }
    )
  }
}

