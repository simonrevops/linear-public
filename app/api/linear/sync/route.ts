import { NextRequest, NextResponse } from 'next/server'
import { fetchProjectsWithLabel, fetchIssuesFromProjects } from '@/lib/linear/queries'
import { supabase } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    const { label, projectIds } = await request.json()

    if (!label && !projectIds) {
      return NextResponse.json(
        { error: 'Either label or projectIds is required' },
        { status: 400 }
      )
    }

    const results: any = {}

    // Sync projects if label is provided
    if (label) {
      const projects = await fetchProjectsWithLabel(label)
      const cacheKey = `projects:${label}`
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()

      await supabase
        .from('linear_cache')
        .upsert({
          cache_key: cacheKey,
          data: projects,
          expires_at: expiresAt
        })

      results.projects = projects
    }

    // Sync issues if projectIds are provided
    if (projectIds && Array.isArray(projectIds) && projectIds.length > 0) {
      const issues = await fetchIssuesFromProjects(projectIds)
      const cacheKey = `issues:projects:${projectIds.sort().join(',')}`
      const expiresAt = new Date(Date.now() + 2 * 60 * 1000).toISOString()

      await supabase
        .from('linear_cache')
        .upsert({
          cache_key: cacheKey,
          data: issues,
          expires_at: expiresAt
        })

      results.issues = issues
    }

    return NextResponse.json({
      success: true,
      ...results
    })
  } catch (error) {
    console.error('Error syncing Linear data:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sync data' },
      { status: 500 }
    )
  }
}

