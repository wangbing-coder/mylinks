import { NextResponse } from 'next/server'
import { TursoHelper } from '@/lib/turso'

export async function GET() {
  try {
    const result = await TursoHelper.getAllProjects()

    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: 'Failed to get project list',
        error: result.error
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: result.data || []
    })

  } catch (error) {
    console.error('Failed to get project list:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to get project list',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 