import { NextRequest, NextResponse } from 'next/server'
import { TursoHelper } from '@/lib/turso'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const projectId = parseInt(id)
    
    if (isNaN(projectId)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid project ID'
      }, { status: 400 })
    }

    const result = await TursoHelper.getBacklinksByProject(projectId)

    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: 'Failed to get project data',
        error: result.error
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: result.data || []
    })

  } catch (error) {
    console.error('Failed to get project data:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to get project data',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 