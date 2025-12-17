import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * GET /api/v1/years/{year}/stats
 * 
 * Returns statistics for a specific GSoC year
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ year: string }> }
) {
  try {
    const { year } = await params
    const yearNum = parseInt(year)

    if (isNaN(yearNum) || yearNum < 2005 || yearNum > 2030) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Invalid year parameter',
            code: 'INVALID_YEAR',
          },
        },
        { status: 400 }
      )
    }

    const organizations = await prisma.organizations.findMany({
      where: {
        active_years: { has: yearNum },
      },
      select: {
        slug: true,
        name: true,
        category: true,
        technologies: true,
        topics: true,
        stats: true,
      },
    })

    // Aggregate stats for the year
    let totalProjects = 0
    let totalStudents = 0
    const categoryCounts = new Map<string, number>()
    const techCounts = new Map<string, number>()
    const topicCounts = new Map<string, number>()

    const yearKey = `year_${yearNum}` as 'year_2016' | 'year_2017' | 'year_2018' | 'year_2019' | 'year_2020' | 'year_2021' | 'year_2022' | 'year_2023' | 'year_2024' | 'year_2025'

    organizations.forEach((org) => {
      const projectsCount = (org.stats.projects_by_year[yearKey] as number) || 0
      const studentsCount = (org.stats.students_by_year[yearKey] as number) || 0

      totalProjects += projectsCount
      totalStudents += studentsCount

      // Count categories
      categoryCounts.set(
        org.category,
        (categoryCounts.get(org.category) || 0) + 1
      )

      // Count technologies
      org.technologies.forEach((tech) => {
        techCounts.set(tech, (techCounts.get(tech) || 0) + 1)
      })

      // Count topics
      org.topics.forEach((topic) => {
        topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1)
      })
    })

    // Convert to arrays and sort
    const topCategories = Array.from(categoryCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    const topTechnologies = Array.from(techCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20)

    const topTopics = Array.from(topicCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20)

    return NextResponse.json(
      {
        success: true,
        data: {
          year: yearNum,
          overview: {
            total_organizations: organizations.length,
            total_projects: totalProjects,
            total_students: totalStudents,
            avg_projects_per_org: organizations.length > 0 
              ? Math.round((totalProjects / organizations.length) * 100) / 100 
              : 0,
          },
          categories: topCategories,
          technologies: topTechnologies,
          topics: topTopics,
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
    console.error('Year stats API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to fetch year statistics',
          code: 'FETCH_ERROR',
        },
      },
      { status: 500 }
    )
  }
}

