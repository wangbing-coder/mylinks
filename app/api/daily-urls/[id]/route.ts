import { NextRequest, NextResponse } from 'next/server'
import { TursoHelper } from '@/lib/turso'

// DELETE - 删除指定ID的每日URL
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await params
    const id = parseInt(paramId)
    
    if (isNaN(id)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid ID format'
      }, { status: 400 })
    }

    const result = await TursoHelper.deleteDailyUrl(id)
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: 'Failed to delete daily URL',
        error: result.error
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'URL deleted successfully'
    })

  } catch (error) {
    console.error('Failed to delete daily URL:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to delete daily URL',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 