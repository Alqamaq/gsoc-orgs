import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * GET /api/v1/tech-stack/{slug}
 * 
 * Returns organizations using a specific technology
 * 
 * Query Parameters:
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 100)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const searchParams = request.nextUrl.searchParams
    const page = Math.max(1, Number(searchParams.get('page')) || 1)
    const limit = Math.min(100, Number(searchParams.get('limit')) || 20)
    const skip = (page - 1) * limit

    // Convert slug back to technology name pattern
    const techPattern = slug.replace(/-/g, ' ')

    // Find all organizations using this technology (case-insensitive)
    const allOrgs = await prisma.organizations.findMany({
      select: {
        slug: true,
        name: true,
        category: true,
        description: true,
        image_url: true,
        img_r2_url: true,
        logo_r2_url: true,
        url: true,
        technologies: true,
        active_years: true,
        total_projects: true,
      },
    })

    // Filter organizations that have this technology
    const matchingOrgs = allOrgs.filter((org) =>
      org.technologies.some(
        (tech) => tech.toLowerCase().replace(/[^a-z0-9]+/g, '-') === slug
      )
    )

    // Get the actual technology name from the first match
    const actualTechName = matchingOrgs.length > 0
      ? matchingOrgs[0].technologies.find(
          (tech) => tech.toLowerCase().replace(/[^a-z0-9]+/g, '-') === slug
        )
      : techPattern

    if (matchingOrgs.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Technology not found',
            code: 'NOT_FOUND',
          },
        },
        { status: 404 }
      )
    }

    // Apply pagination
    const total = matchingOrgs.length
    const items = matchingOrgs
      .sort((a, b) => b.total_projects - a.total_projects)
      .slice(skip, skip + limit)

    return NextResponse.json(
      {
        success: true,
        data: {
          technology: {
            name: actualTechName,
            slug,
            usage_count: total,
          },
          organizations: items,
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
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    )
  } catch (error) {
    console.error('Tech stack detail API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to fetch technology details',
          code: 'FETCH_ERROR',
        },
      },
      { status: 500 }
    )
  }
}

