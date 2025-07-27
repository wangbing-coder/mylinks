import { NextResponse } from 'next/server'
import { TursoHelper } from '@/lib/turso'

export async function GET() {
  try {
    const [backlinkResult, domainResult] = await Promise.all([
      TursoHelper.getAllBacklinks(),
      TursoHelper.getAllReferringDomains()
    ])

    if (!backlinkResult.success || !domainResult.success) {
      return NextResponse.json({
        success: false,
        message: '获取数据失败',
        error: backlinkResult.error || domainResult.error
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        backlinks: backlinkResult.data || [],
        referringDomains: domainResult.data || []
      }
    })

  } catch (error) {
    console.error('获取数据失败:', error)
    return NextResponse.json({
      success: false,
      message: '获取数据失败',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
} 