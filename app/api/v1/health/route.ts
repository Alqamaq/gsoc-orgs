import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * GET /api/v1/health
 * 
 * Health check endpoint for API monitoring
 */
export async function GET() {
  try {
    // Quick database connectivity check
    const startTime = Date.now()
    await prisma.organizations.count({ take: 1 })
    const responseTime = Date.now() - startTime

    return NextResponse.json(
      {
        success: true,
        data: {
          status: 'healthy',
          database: 'connected',
          response_time_ms: responseTime,
          timestamp: new Date().toISOString(),
        },
        meta: {
          version: 'v1',
        },
      },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    )
  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json(
      {
        success: false,
        data: {
          status: 'unhealthy',
          database: 'disconnected',
          timestamp: new Date().toISOString(),
        },
        error: {
          message: 'Service unhealthy',
          code: 'SERVICE_ERROR',
        },
        meta: {
          version: 'v1',
        },
      },
      { status: 503 }
    )
  }
}

