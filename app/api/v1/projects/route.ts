import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * GET /api/v1/projects
 * 
 * Query Parameters:
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 100)
 * - q: string (search in title/abstract/org)
 * - year: number (filter by year)
 * - org: string (filter by organization slug)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = Math.max(1, Number(searchParams.get('page')) || 1)
    const limit = Math.min(100, Number(searchParams.get('limit')) || 20)
    const skip = (page - 1) * limit
    const search = searchParams.get('q') || undefined
    const year = searchParams.get('year') || undefined
    const orgSlug = searchParams.get('org') || undefined

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { project_title: { contains: search, mode: 'insensitive' } },
        { project_abstract_short: { contains: search, mode: 'insensitive' } },
        { org_name: { contains: search, mode: 'insensitive' } },
        { contributor: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (year) {
      where.year = parseInt(year)
    }

    if (orgSlug) {
      where.org_slug = orgSlug
    }

    // Fetch projects with pagination
    const [items, total] = await Promise.all([
      prisma.projects.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date_updated: 'desc' },
        select: {
          project_id: true,
          project_title: true,
          project_abstract_short: true,
          project_code_url: true,
          contributor: true,
          mentors: true,
          org_name: true,
          org_slug: true,
          year: true,
          date_created: true,
          date_updated: true,
        },
      }),
      prisma.projects.count({ where }),
    ])

    return NextResponse.json(
      {
        success: true,
        data: {
          projects: items,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
        },
      }
    )
  } catch (error) {
    console.error('Projects API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to fetch projects',
          code: 'FETCH_ERROR',
        },
      },
      { status: 500 }
    )
  }
}

