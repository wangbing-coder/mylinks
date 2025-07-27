import { NextRequest, NextResponse } from 'next/server'
import { TursoHelper } from '@/lib/turso'

// POST - 检查 better link 在反向链接中的匹配项目数量
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url } = body

    if (!url) {
      return NextResponse.json({
        success: false,
        message: 'URL is required'
      }, { status: 400 })
    }

    // 确保数据库表已初始化
    await TursoHelper.initializeTables()

    // 从数据库中查找该 URL 对应的域名
    const urlResult = await TursoHelper.getDailyUrlByUrl(url)
    
    if (!urlResult.success || !urlResult.data) {
      return NextResponse.json({
        success: false,
        message: 'URL not found in database'
      }, { status: 404 })
    }

    const domain = urlResult.data.domain
    if (!domain) {
      return NextResponse.json({
        success: false,
        message: 'Domain not available for this URL'
      }, { status: 400 })
    }

    // 查询匹配的项目数量
    const result = await TursoHelper.checkBacklinkProjects(domain)
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: 'Failed to check backlink projects',
        error: result.error
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        domain,
        projectCount: result.data?.projectCount || 0,
        backlinkCount: result.data?.backlinkCount || 0
      }
    })

  } catch (error) {
    console.error('Failed to check backlink projects:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to check backlink projects',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 