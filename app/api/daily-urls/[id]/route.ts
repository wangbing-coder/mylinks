import { NextRequest, NextResponse } from 'next/server'
import { TursoHelper } from '@/lib/turso'

// PUT - 更新指定ID的每日URL
export async function PUT(
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

    const body = await request.json()
    const { comment, color, tag } = body

    // 验证 color 值
    if (color && !['green', 'blue', 'red', 'yellow', 'purple', 'gray'].includes(color)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid color value. Must be one of: green, blue, red, yellow, purple, gray'
      }, { status: 400 })
    }

    // 验证 tag 值
    if (tag && !['nav', 'blog', 'profile', 'other'].includes(tag)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid tag value. Must be one of: nav, blog, profile, other'
      }, { status: 400 })
    }

    const updates: { comment?: string; color?: 'green' | 'blue' | 'red' | 'yellow' | 'purple' | 'gray'; tag?: 'nav' | 'blog' | 'profile' | 'other' } = {};

    if (comment !== undefined) updates.comment = comment;
    if (color) updates.color = color;
    if (tag) updates.tag = tag;

    const result = await TursoHelper.updateDailyUrl(id, updates)
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: 'Failed to update daily URL',
        error: result.error
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'URL updated successfully'
    })

  } catch (error) {
    console.error('Failed to update daily URL:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to update daily URL',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

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