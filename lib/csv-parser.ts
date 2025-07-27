// CSV 解析和数据处理工具函数 - 专门处理 Semrush 反向链接数据

interface BacklinkRow {
  source_url: string
  source_domain: string
  target_url: string
  page_ascore: number
  external_links: number
  is_nofollow: boolean
  first_seen: string
  last_seen: string
}

// 解析CSV文本为数组
export function parseCSV(csvText: string): string[][] {
  const lines = csvText.trim().split('\n')
  const result: string[][] = []
  
  // 检测分隔符类型
  const firstLine = lines[0]
  const delimiter = firstLine.includes('\t') ? '\t' : ','
  console.log(`检测到分隔符: ${delimiter === '\t' ? 'TAB' : 'COMMA'}`)
  
  for (const line of lines) {
    const row: string[] = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === delimiter && !inQuotes) {
        row.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    
    row.push(current.trim())
    result.push(row)
  }
  
  return result
}

// 智能映射CSV列到标准字段 - 基于Semrush导出格式
export function mapBacklinkColumns(headers: string[], row: string[]): Partial<BacklinkRow> | null {
  const headerMap: { [key: string]: string[] } = {
    page_ascore: ['page ascore', 'page_ascore', 'authority score', 'authority_score', 'domain authority', 'da'],
    source_url: ['source url', 'source_url', 'url'],
    target_url: ['target url', 'target_url'],
    external_links: ['external links', 'external_links'],
    is_nofollow: ['nofollow'],
    first_seen: ['first seen', 'first_seen'],
    last_seen: ['last seen', 'last_seen']
  }

  const mappedRow: Partial<BacklinkRow> = {}
  
  for (const [field, possibleHeaders] of Object.entries(headerMap)) {
    const headerIndex = headers.findIndex(header => 
      possibleHeaders.some(possible => 
        header.toLowerCase().replace(/\s+/g, ' ').trim() === possible.toLowerCase()
      )
    )
    
    if (headerIndex !== -1 && row[headerIndex]) {
      const value = row[headerIndex].replace(/"/g, '').trim()
      
      switch (field) {
        case 'page_ascore':
        case 'external_links':
          (mappedRow as any)[field] = parseInt(value) || 0
          break
        case 'is_nofollow':
          // Semrush 使用 TRUE/FALSE
          (mappedRow as any)[field] = value.toUpperCase() === 'TRUE'
          break
        default:
          (mappedRow as any)[field] = value
      }
    }
  }

  // 验证必需字段
  if (!mappedRow.source_url) {
    return null
  }

  // 从URL提取域名
  if (mappedRow.source_url) {
    try {
      const url = new URL(mappedRow.source_url)
      mappedRow.source_domain = url.hostname
    } catch (e) {
      // 如果URL无效，跳过这一行
      return null
    }
  }



  return mappedRow
}

// 过滤SEO垃圾链接和重复的反向链接
export function filterAndDeduplicateBacklinks(backlinks: Partial<BacklinkRow>[]): Partial<BacklinkRow>[] {
  // 首先过滤掉External Links超3000的数据（SEO垃圾链接）
  const filteredBacklinks = backlinks.filter(backlink => {
    const externalLinks = backlink.external_links || 0
    if (externalLinks > 3000) {
      console.log(`过滤SEO垃圾链接: ${backlink.source_domain} (External Links: ${externalLinks})`)
      return false
    }
    return true
  })
  
  console.log(`过滤SEO垃圾链接后剩余: ${filteredBacklinks.length} 条数据`)
  
  // 然后过滤重复的反向链接（同一域名保留权威分数最高的）
  const domainMap = new Map<string, Partial<BacklinkRow>>()
  
  for (const backlink of filteredBacklinks) {
    if (!backlink.source_domain) continue
    
    const existing = domainMap.get(backlink.source_domain)
    
    if (!existing) {
      domainMap.set(backlink.source_domain, backlink)
    } else {
      // 按照你的要求：先按page_ascore高过滤，如果相同按external_links少过滤
      const currentScore = backlink.page_ascore || 0
      const existingScore = existing.page_ascore || 0
      
      if (currentScore > existingScore) {
        domainMap.set(backlink.source_domain, backlink)
      } else if (currentScore === existingScore) {
        // 如果page_ascore相同，选择external_links少的
        const currentExtLinks = backlink.external_links || 0
        const existingExtLinks = existing.external_links || 0
        if (currentExtLinks < existingExtLinks) {
          domainMap.set(backlink.source_domain, backlink)
        }
      }
    }
  }
  
  return Array.from(domainMap.values())
}

// 解析反向链接CSV文件
export async function parseBacklinksCSV(file: File): Promise<Partial<BacklinkRow>[]> {
  const text = await file.text()
  console.log(`CSV文件大小: ${text.length} 字符`)
  
  const rows = parseCSV(text)
  console.log(`解析到 ${rows.length} 行数据`)
  
  if (rows.length === 0) return []
  
  const headers = rows[0]
  console.log('CSV头部字段:', headers)
  
  const dataRows = rows.slice(1)
  console.log(`数据行数: ${dataRows.length}`)
  
  const backlinks: Partial<BacklinkRow>[] = []
  
  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i]
    const mappedRow = mapBacklinkColumns(headers, row)
    if (mappedRow) {
      backlinks.push(mappedRow)
      if (i < 3) { // 只打印前3行作为示例
        console.log(`第 ${i + 1} 行映射结果:`, mappedRow)
      }
    } else {
      if (i < 3) {
        console.log(`第 ${i + 1} 行映射失败:`, row.slice(0, 5))
      }
    }
  }
  
  console.log(`成功映射 ${backlinks.length} 条数据`)
  
  // 过滤SEO垃圾链接和重复域名
  const filtered = filterAndDeduplicateBacklinks(backlinks)
  console.log(`过滤后剩余 ${filtered.length} 条数据`)
  
  return filtered
}

// 数据验证和清理
export function validateAndCleanData<T>(data: Partial<T>[], requiredFields: (keyof T)[]): T[] {
  return data.filter(item => {
    return requiredFields.every(field => item[field] != null && item[field] !== '')
  }) as T[]
} 