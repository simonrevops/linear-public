import { NextRequest, NextResponse } from 'next/server'
import { fetchWorkflowStatesForTeams } from '@/lib/linear/queries'
import { fetchProjectsWithLabel } from '@/lib/linear/queries'
import { supabase } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const teamIds = searchParams.get('teamIds')?.split(',').filter(Boolean) || []
    const label = searchParams.get('label') || 'public'
    const useCache = searchParams.get('cache') !== 'false'

    let finalTeamIds = teamIds

    // If no team IDs provided, get teams from public projects
    if (finalTeamIds.length === 0) {
      // Check cache first
      if (useCache) {
        const cacheKey = `workflow_states:projects:${label}`
        const { data: cached } = await supabase
          .from('linear_cache')
          .select('*')
          .eq('cache_key', cacheKey)
          .gt('expires_at', new Date().toISOString())
          .single()

        if (cached) {
          return NextResponse.json({
            states: cached.data,
            cached: true
          })
        }
      }

      // Fetch projects to get team IDs
      const projects = await fetchProjectsWithLabel(label)
      const allTeamIds = new Set<string>()
      projects.forEach(project => {
        project.teams.nodes.forEach(team => {
          allTeamIds.add(team.id)
        })
      })
      finalTeamIds = Array.from(allTeamIds)
    }

    if (finalTeamIds.length === 0) {
      return NextResponse.json({ states: [] })
    }

    // Fetch workflow states for all teams
    const states = await fetchWorkflowStatesForTeams(finalTeamIds)

    // Cache the result (expires in 10 minutes - states don't change often)
    const cacheKey = teamIds.length > 0 
      ? `workflow_states:teams:${finalTeamIds.sort().join(',')}`
      : `workflow_states:projects:${label}`
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    await supabase
      .from('linear_cache')
      .upsert({
        cache_key: cacheKey,
        data: states,
        expires_at: expiresAt
      })

    return NextResponse.json({
      states,
      cached: false
    })
  } catch (error) {
    console.error('Error fetching workflow states:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch workflow states' },
      { status: 500 }
    )
  }
}

