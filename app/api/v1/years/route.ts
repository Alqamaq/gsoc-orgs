import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * GET /api/v1/years
 * 
 * Returns list of all GSoC years with basic stats
 */
export async function GET() {
  try {
    // Get all organizations to extract year information
    const organizations = await prisma.organizations.findMany({
      select: {
        active_years: true,
        first_year: true,
        last_year: true,
        stats: true,
      },
    })

    // Build year map with stats
    const yearMap = new Map<number, {
      year: number
      organizations_count: number
      total_projects: number
      total_students: number
    }>()

    organizations.forEach((org) => {
      org.active_years.forEach((year) => {
        const existing = yearMap.get(year)
        
        // Get projects for this specific year from stats
        const yearKey = `year_${year}` as 'year_2016' | 'year_2017' | 'year_2018' | 'year_2019' | 'year_2020' | 'year_2021' | 'year_2022' | 'year_2023' | 'year_2024' | 'year_2025'
        const projectsCount = (org.stats.projects_by_year[yearKey] as number) || 0
        const studentsCount = (org.stats.students_by_year[yearKey] as number) || 0

        if (existing) {
          existing.organizations_count++
          existing.total_projects += projectsCount
          existing.total_students += studentsCount
        } else {
          yearMap.set(year, {
            year,
            organizations_count: 1,
            total_projects: projectsCount,
            total_students: studentsCount,
          })
        }
      })
    })

    // Convert to sorted array
    const years = Array.from(yearMap.values())
      .sort((a, b) => b.year - a.year)

    return NextResponse.json(
      {
        success: true,
        data: {
          years,
          total_years: years.length,
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
    console.error('Years API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to fetch years',
          code: 'FETCH_ERROR',
        },
      },
      { status: 500 }
    )
  }
}

