import { NextRequest, NextResponse } from 'next/server'
import { fetchProjectsWithLabel } from '@/lib/linear/queries'
import { supabase } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const label = searchParams.get('label') || 'public'
    const useCache = searchParams.get('cache') !== 'false'

    // Check cache first
    if (useCache) {
      const cacheKey = `projects:${label}`
      const { data: cached } = await supabase
        .from('linear_cache')
        .select('*')
        .eq('cache_key', cacheKey)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (cached) {
        return NextResponse.json({
          projects: cached.data,
          cached: true
        })
      }
    }

    // Fetch from Linear
    const projects = await fetchProjectsWithLabel(label)

    // Cache the result (expires in 5 minutes)
    const cacheKey = `projects:${label}`
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()

    await supabase
      .from('linear_cache')
      .upsert({
        cache_key: cacheKey,
        data: projects,
        expires_at: expiresAt
      })

    return NextResponse.json({
      projects,
      cached: false
    })
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

