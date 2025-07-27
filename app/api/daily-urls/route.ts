import { NextRequest, NextResponse } from 'next/server'
import { TursoHelper } from '@/lib/turso'

// GET - 获取每日URL列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const type = searchParams.get('type') as 'url' | 'better_link' | null
    const tag = searchParams.get('tag') as 'nav' | 'blog' | 'profile' | 'other' | null

    // 确保数据库表已初始化
    await TursoHelper.initializeTables()

    const result = await TursoHelper.getDailyUrls(date || undefined, type || undefined, tag || undefined)
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: 'Failed to get daily URLs',
        error: result.error
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: result.data
    })

  } catch (error) {
    console.error('Failed to get daily URLs:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to get daily URLs',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST - 添加新的每日URL
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, date, comment, type, tag } = body

    if (!url) {
      return NextResponse.json({
        success: false,
        message: 'URL is required'
      }, { status: 400 })
    }

    // URL格式验证
    try {
      new URL(url)
    } catch {
      return NextResponse.json({
        success: false,
        message: 'Invalid URL format'
      }, { status: 400 })
    }

    // 验证 tag 值
    if (tag && !['nav', 'blog', 'profile', 'other'].includes(tag)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid tag value. Must be one of: nav, blog, profile, other'
      }, { status: 400 })
    }

    // 确保数据库表已初始化
    await TursoHelper.initializeTables()

    const result = await TursoHelper.addDailyUrl(url, date, comment, type || 'url', tag || 'nav')
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: 'Failed to add daily URL',
        error: result.error
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'URL added successfully',
      data: result.data
    })

  } catch (error) {
    console.error('Failed to add daily URL:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to add daily URL',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 