import { NextRequest, NextResponse } from 'next/server'
import { createAndSyncComment, fetchAllComments } from '@/lib/linear/comments'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const issueId = searchParams.get('issueId')

    if (!issueId) {
      return NextResponse.json(
        { error: 'issueId is required' },
        { status: 400 }
      )
    }

    const comments = await fetchAllComments(issueId)

    return NextResponse.json({ comments })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { issueId, content, authorName, authorEmail } = await request.json()

    if (!issueId || !content) {
      return NextResponse.json(
        { error: 'issueId and content are required' },
        { status: 400 }
      )
    }

    const comment = await createAndSyncComment(issueId, content, authorName, authorEmail)

    return NextResponse.json({ comment })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create comment' },
      { status: 500 }
    )
  }
}

