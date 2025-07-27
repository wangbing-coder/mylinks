import { NextRequest, NextResponse } from 'next/server'
import { TursoHelper } from '@/lib/turso'
import { parseBacklinksCSV } from '@/lib/csv-parser'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string
    const projectName = formData.get('projectName') as string
    const groupId = formData.get('groupId') as string

    if (!file) {
      return NextResponse.json({ 
        success: false, 
        message: 'No file received' 
      }, { status: 400 })
    }

    if (!projectName) {
      return NextResponse.json({ 
        success: false, 
        message: 'Please enter project name' 
      }, { status: 400 })
    }

    if (!type || type !== 'backlinks') {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid file type' 
      }, { status: 400 })
    }

    // 确保数据库表已初始化
    await TursoHelper.initializeTables()

    // 创建或获取项目
    const groupIdNumber = groupId ? parseInt(groupId) : undefined
    const projectResult = await TursoHelper.createOrGetProject(projectName, '', groupIdNumber)
    if (!projectResult.success) {
      return NextResponse.json({
        success: false,
        message: 'Failed to create project',
        error: projectResult.error
      }, { status: 500 })
    }

    const project = projectResult.data as any
    console.log(`使用项目: ${project.name} (ID: ${project.id})`)

    let processedCount = 0

    // 处理反向链接CSV
    const backlinks = await parseBacklinksCSV(file)
    console.log(`解析到 ${backlinks.length} 条反向链接数据`)
    
    for (const backlink of backlinks) {
      console.log('处理反向链接:', {
        source_domain: backlink.source_domain,
        source_url: backlink.source_url?.substring(0, 50) + '...',
        page_ascore: backlink.page_ascore,
        external_links: backlink.external_links,
        is_nofollow: backlink.is_nofollow
      })
      
      if (backlink.source_domain && backlink.source_url) {
        try {
          const result = await TursoHelper.insertBacklink({
            project_id: project.id,
            source_url: backlink.source_url || '',
            source_domain: backlink.source_domain,
            target_url: backlink.target_url || '',
            page_ascore: backlink.page_ascore || 0,
            external_links: backlink.external_links || 0,
            is_nofollow: backlink.is_nofollow || false,
            first_seen: backlink.first_seen || new Date().toISOString().split('T')[0],
            last_seen: backlink.last_seen || new Date().toISOString().split('T')[0]
          })
          
          if (result.success) {
            processedCount++
            console.log(`成功插入第 ${processedCount} 条数据`)
          } else {
            console.error('插入失败:', result.error)
          }
        } catch (error) {
          console.error('插入反向链接数据失败:', error)
        }
      } else {
        console.log('跳过无效数据:', {
          source_domain: backlink.source_domain,
          source_url: backlink.source_url
        })
      }
    }

    console.log(`总共处理了 ${processedCount} 条数据`)

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${processedCount} backlink records`,
      processedCount
    })

  } catch (error) {
    console.error('File processing failed:', error)
    return NextResponse.json({
      success: false,
      message: 'File processing failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 