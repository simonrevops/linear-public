import { NextRequest, NextResponse } from 'next/server'
import { fetchIssuesFromProjects } from '@/lib/linear/queries'
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
        return NextResponse.json({
          issues: cached.data,
          cached: true
        })
      }
    }

    // Fetch from Linear
    const issues = await fetchIssuesFromProjects(projectIds)

    // Cache the result (expires in 2 minutes)
    const cacheKey = `issues:projects:${projectIds.sort().join(',')}`
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000).toISOString()

    await supabase
      .from('linear_cache')
      .upsert({
        cache_key: cacheKey,
        data: issues,
        expires_at: expiresAt
      })

    return NextResponse.json({
      issues,
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

