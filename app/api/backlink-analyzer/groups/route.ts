import { NextRequest, NextResponse } from 'next/server'
import { TursoHelper } from '@/lib/turso'

// GET - 获取所有分组
export async function GET() {
  try {
    const result = await TursoHelper.getAllGroups()

    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: 'Failed to get groups',
        error: result.error
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: result.data || []
    })

  } catch (error) {
    console.error('Failed to get groups:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to get groups',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST - 创建新分组
export async function POST(request: NextRequest) {
  try {
    const { name, description, color } = await request.json()

    if (!name || !name.trim()) {
      return NextResponse.json({
        success: false,
        message: 'Group name is required'
      }, { status: 400 })
    }

    const result = await TursoHelper.createGroup(name.trim(), description?.trim(), color)

    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: 'Failed to create group',
        error: result.error
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: 'Group created successfully'
    })

  } catch (error) {
    console.error('Failed to create group:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to create group',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// PUT - 更新分组
export async function PUT(request: NextRequest) {
  try {
    const { id, name, description, color } = await request.json()

    if (!id || !name || !name.trim()) {
      return NextResponse.json({
        success: false,
        message: 'Group ID and name are required'
      }, { status: 400 })
    }

    const result = await TursoHelper.updateGroup(id, name.trim(), description?.trim(), color)

    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: 'Failed to update group',
        error: result.error
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Group updated successfully'
    })

  } catch (error) {
    console.error('Failed to update group:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to update group',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// DELETE - 删除分组
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'Group ID is required'
      }, { status: 400 })
    }

    const result = await TursoHelper.deleteGroup(parseInt(id))

    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: 'Failed to delete group',
        error: result.error
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Group deleted successfully'
    })

  } catch (error) {
    console.error('Failed to delete group:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to delete group',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 