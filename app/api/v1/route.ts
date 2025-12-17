import { NextResponse } from 'next/server'

/**
 * GET /api/v1
 * 
 * API root endpoint - returns welcome message and quick links
 */
export async function GET() {
  return NextResponse.json(
    {
      success: true,
      message: 'Welcome to GSoC Organizations API v1',
      data: {
        version: 'v1',
        status: 'stable',
        description: 'A comprehensive public API for Google Summer of Code organizations, projects, and statistics.',
        documentation: '/api/v1/meta',
        health_check: '/api/v1/health',
        quick_links: {
          organizations: '/api/v1/organizations',
          years: '/api/v1/years',
          projects: '/api/v1/projects',
          tech_stack: '/api/v1/tech-stack',
          stats: '/api/v1/stats',
        },
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=86400',
      },
    }
  )
}

