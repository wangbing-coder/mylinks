import { NextRequest, NextResponse } from 'next/server'
import { TursoHelper } from '@/lib/turso'

// GET - 获取每日URL统计数据
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as 'url' | 'better_link' | null

    // 确保数据库表已初始化
    await TursoHelper.initializeTables()

    const result = await TursoHelper.getDailyUrlStats(type || undefined)
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: 'Failed to get daily URL stats',
        error: result.error
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: result.data
    })

  } catch (error) {
    console.error('Failed to get daily URL stats:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to get daily URL stats',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 