import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * GET /api/v1/tech-stack
 * 
 * Returns list of all technologies used by organizations
 * 
 * Query Parameters:
 * - limit: number (default: 100, max: 500)
 * - q: string (search technology name)
 * - min_usage: number (minimum organization count, default: 1)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = Math.min(500, Number(searchParams.get('limit')) || 100)
    const search = searchParams.get('q') || undefined
    const minUsage = Number(searchParams.get('min_usage')) || 1

    // Build where clause
    const where: any = {}

    if (search) {
      where.name = { contains: search, mode: 'insensitive' }
    }

    // Get all organizations
    const organizations = await prisma.organizations.findMany({
      where: where.name ? where : undefined,
      select: {
        technologies: true,
      },
    })

    // Extract and deduplicate technologies with counts
    const techMap = new Map<string, { name: string; count: number }>()
    
    organizations.forEach((org) => {
      org.technologies.forEach((tech) => {
        const techLower = tech.toLowerCase()
        const existing = techMap.get(techLower)
        if (existing) {
          existing.count++
          // Keep the most common capitalization
          if (tech !== existing.name && Math.random() > 0.5) {
            existing.name = tech
          }
        } else {
          techMap.set(techLower, { name: tech, count: 1 })
        }
      })
    })

    // Filter by min usage and convert to array
    const items = Array.from(techMap.values())
      .filter((tech) => tech.count >= minUsage)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map((tech) => ({
        name: tech.name,
        slug: tech.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        usage_count: tech.count,
      }))

    return NextResponse.json(
      {
        success: true,
        data: {
          technologies: items,
          total: items.length,
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
    console.error('Tech stack API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to fetch tech stack',
          code: 'FETCH_ERROR',
        },
      },
      { status: 500 }
    )
  }
}

