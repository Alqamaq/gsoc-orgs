import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * GET /api/v1/projects/{id}
 * 
 * Returns detailed information about a specific project
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const project = await prisma.projects.findUnique({
      where: { project_id: id },
    })

    if (!project) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Project not found',
            code: 'NOT_FOUND',
          },
        },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: project,
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    )
  } catch (error) {
    console.error('Project detail API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to fetch project',
          code: 'FETCH_ERROR',
        },
      },
      { status: 500 }
    )
  }
}

