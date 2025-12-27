import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'

/**
 * Helper to parse comma-separated query parameters into arrays
 */
const parseList = (value: string | null): string[] =>
  value ? value.split(',').map(v => v.trim()).filter(Boolean) : []

/**
 * Helper to parse comma-separated numbers into number arrays
 */
const parseNumberList = (value: string | null): number[] =>
  value
    ? value
        .split(',')
        .map(v => parseInt(v.trim()))
        .filter(n => !isNaN(n))
    : []

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = Math.max(1, Number(searchParams.get('page')) || 1)
    const limit = Math.min(100, Number(searchParams.get('limit')) || 20)
    const skip = (page - 1) * limit
    const search = searchParams.get('q') || undefined

    // Parse plural query parameters (supporting multiple values)
    const years = parseNumberList(searchParams.get('years'))
    const categories = parseList(searchParams.get('categories'))
    const techs = parseList(searchParams.get('techs'))
    const topics = parseList(searchParams.get('topics'))
    const difficulties = parseList(searchParams.get('difficulties'))
    const firstTimeOnly = searchParams.get('firstTimeOnly') === 'true'

    // Build where clause with AND logic across filter groups, OR logic within groups
    const whereConditions: Prisma.organizationsWhereInput[] = []

    // Search filter (name or description)
    if (search) {
      whereConditions.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      })
    }

    // Years filter: OR logic - org must have participated in ANY of the selected years
    if (years.length > 0) {
      whereConditions.push({
        OR: years.map(year => ({
          active_years: { has: year },
        })),
      })
    }

    // Categories filter: OR logic - org must match ANY of the selected categories
    if (categories.length > 0) {
      whereConditions.push({
        OR: categories.map(category => ({
          category: category,
        })),
      })
    }

    // Technologies filter: OR logic - org must have ANY of the selected technologies
    if (techs.length > 0) {
      whereConditions.push({
        OR: techs.map(tech => ({
          technologies: { has: tech },
        })),
      })
    }

    // Topics filter: OR logic - org must have ANY of the selected topics
    if (topics.length > 0) {
      whereConditions.push({
        OR: topics.map(topic => ({
          topics: { has: topic },
        })),
      })
    }

    // First-time organizations filter
    // An org is "first-time" if its first_year matches any of the selected years
    // OR if no years selected, use the computed first_time field
    if (firstTimeOnly) {
      if (years.length > 0) {
        // If years are selected, first_year must match one of them
        // This means the org is first-time for that specific year
        whereConditions.push({
          OR: years.map(year => ({
            first_year: year,
          })),
        })
      } else {
        // If no years selected, use the computed first_time field
        // This field is computed by the /api/admin/compute-first-time endpoint
        whereConditions.push({
          first_time: true,
        })
      }
    }

    // Difficulties filter: Currently not in DB schema
    // TODO: Implement when difficulty field is added to schema
    if (difficulties.length > 0) {
      console.warn('Difficulty filter not yet implemented - requires schema update')
      // whereConditions.push({
      //   OR: difficulties.map(difficulty => ({
      //     difficulty: difficulty,
      //   })),
      // })
    }

    // Build final where clause
    const where: Prisma.organizationsWhereInput =
      whereConditions.length > 0 ? { AND: whereConditions } : {}

    // Fetch organizations with pagination
    const items = await prisma.organizations.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        slug: true,
        name: true,
        category: true,
        description: true,
        image_url: true,
        url: true,
        active_years: true,
        first_year: true,
        last_year: true,
        is_currently_active: true,
        technologies: true,
        topics: true,
        total_projects: true,
        stats: true,
        first_time: true, // Include first_time field when available
      },
    })

    // Get total count
    const total = await prisma.organizations.count({ where })

    return NextResponse.json({
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      items,
    })
  } catch (error) {
    console.error('Organizations API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch organizations' },
      { status: 500 }
    )
  }
}
