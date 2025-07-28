'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Folder, ExternalLink, Calendar, TrendingUp, ArrowLeft, Download, Trash2, Star, StarOff, Search, ArrowUpDown, ArrowUp, ArrowDown, Upload, FileText, Plus, X, Navigation, BookOpen, User, Hash } from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast'

interface Project {
  id: number
  name: string
  description: string
  group_id: number | null
  group_name: string | null
  group_color: string | null
  backlinks_count: number
  avg_authority: number
  follow_links_count: number
  created_at: string
}

interface Backlink {
  id: number
  source_url: string
  source_domain: string
  target_url: string
  page_ascore: number
  external_links: number
  is_nofollow: boolean
  first_seen: string
  last_seen: string
  created_at: string
  project_id: number
}

interface GroupProjectsProps {
  groupId: number
  groupName: string
  groupColor: string
  onProjectSelect: (projectId: number, projectName: string) => void
  onBack: () => void
  isLoading?: boolean
}

interface SourceUrlItem {
  url: string
  domain: string
  maxScore: number
  count: number
  projects: string[]
}

interface UploadedFile {
  file: File
  preview: string[]
}

// 标签配置
const TAG_CONFIG = {
  nav: { label: 'Navigation', icon: Navigation, color: 'bg-blue-100 text-blue-800' },
  blog: { label: 'Blog', icon: BookOpen, color: 'bg-green-100 text-green-800' },
  profile: { label: 'Profile', icon: User, color: 'bg-purple-100 text-purple-800' },
  other: { label: 'Other', icon: Hash, color: 'bg-gray-100 text-gray-800' }
} as const

export default function GroupProjects({ 
  groupId, 
  groupName, 
  groupColor, 
  onProjectSelect, 
  onBack,
  isLoading = false 
}: GroupProjectsProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [groupBacklinks, setGroupBacklinks] = useState<Backlink[]>([])
  const [loading, setLoading] = useState(true)
  const [statisticsLoading, setStatisticsLoading] = useState(true)
  const [deletingProjectId, setDeletingProjectId] = useState<number | null>(null)
  
  const [sourceUrls, setSourceUrls] = useState<SourceUrlItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<'url' | 'domain' | 'maxScore' | 'count'>('maxScore')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [starredUrls, setStarredUrls] = useState<Set<string>>(new Set())
  const [starringUrl, setStarringUrl] = useState<string | null>(null)
  
  // Star dialog states
  const [starDialogOpen, setStarDialogOpen] = useState(false)
  const [pendingStarUrl, setPendingStarUrl] = useState<{ url: string, domain: string } | null>(null)
  const [starTag, setStarTag] = useState<'nav' | 'blog' | 'profile' | 'other'>('other')
  const [starComment, setStarComment] = useState('')
  
  // Upload related states
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const { toast } = useToast()

  const loadProjects = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/backlink-analyzer/projects')
      const result = await response.json()
      
      if (result.success) {
        // Filter projects for this specific group
        const groupProjects = groupId === 0 
          ? (result.data || []).filter((p: Project) => !p.group_id)
          : (result.data || []).filter((p: Project) => p.group_id === groupId)
        setProjects(groupProjects)
        
        // Load backlinks for all projects in this group
        await loadGroupBacklinks(groupProjects.map((p: Project) => p.id), groupProjects)
      } else {
        console.error('Failed to load projects:', result.message)
      }
    } catch (error) {
      console.error('Failed to load projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadGroupBacklinks = async (projectIds: number[], projectsData: Project[]) => {
    if (projectIds.length === 0) {
      setStatisticsLoading(false)
      return
    }

    setStatisticsLoading(true)
    try {
      // Load backlinks for all projects in the group
      const allBacklinks: Backlink[] = []
      
      for (const projectId of projectIds) {
        const response = await fetch(`/api/backlink-analyzer/projects/${projectId}`)
        const result = await response.json()
        
        if (result.success && result.data) {
          // Add project_id to each backlink for tracking
          const backlinkWithProjectId = result.data.map((b: any) => ({
            ...b,
            project_id: projectId
          }))
          allBacklinks.push(...backlinkWithProjectId)
        }
      }
      
      setGroupBacklinks(allBacklinks)
      
      // Process source URLs for All Source URLs view
      const projectMap = new Map()
      projectsData.forEach((p: Project) => {
        projectMap.set(p.id, p.name)
      })

      const sourceUrlMap = new Map<string, {
        url: string
        domain: string
        maxScore: number
        count: number
        projectIds: Set<number>
      }>()

      allBacklinks.forEach(backlink => {
        const existing = sourceUrlMap.get(backlink.source_url)
        if (existing) {
          existing.count++
          existing.projectIds.add(backlink.project_id)
          if (backlink.page_ascore > existing.maxScore) {
            existing.maxScore = backlink.page_ascore
          }
        } else {
          sourceUrlMap.set(backlink.source_url, {
            url: backlink.source_url,
            domain: backlink.source_domain,
            maxScore: backlink.page_ascore,
            count: 1,
            projectIds: new Set([backlink.project_id])
          })
        }
      })

      // Convert to array and add project names
      const sourceUrlsArray = Array.from(sourceUrlMap.values()).map(item => ({
        url: item.url,
        domain: item.domain,
        maxScore: item.maxScore,
        count: item.count,
        projects: Array.from(item.projectIds).map(id => projectMap.get(id)).filter(Boolean)
      })).sort((a, b) => b.maxScore - a.maxScore)

      setSourceUrls(sourceUrlsArray)
      
    } catch (error) {
      console.error('Failed to load group backlinks:', error)
    } finally {
      setStatisticsLoading(false)
    }
  }

  // 加载已星标的 URL
  const loadStarredUrls = async () => {
    try {
      const response = await fetch('/api/daily-urls?type=better_link')
      const result = await response.json()
      
      if (result.success) {
        const urls: string[] = result.data.map((item: any) => item.url as string)
        const starred = new Set<string>(urls)
        setStarredUrls(starred)
      }
    } catch (error) {
      console.error('Failed to load starred URLs:', error)
    }
  }

  // 切换星标状态
  const toggleStar = async (url: string, domain: string) => {
    const isCurrentlyStarred = starredUrls.has(url)
    
    if (isCurrentlyStarred) {
      // 取消星标 - 需要先找到对应的记录ID然后删除
      setStarringUrl(url)
      
      try {
        const response = await fetch('/api/daily-urls?type=better_link')
        const result = await response.json()
        
        if (result.success) {
          const record = result.data.find((item: any) => item.url === url)
          if (record) {
            const deleteResponse = await fetch(`/api/daily-urls/${record.id}`, {
              method: 'DELETE'
            })
            
            if (deleteResponse.ok) {
              const newStarredUrls = new Set(starredUrls)
              newStarredUrls.delete(url)
              setStarredUrls(newStarredUrls)
              
              toast({
                title: "Removed from Better Links",
                description: "URL has been removed from your better links collection.",
              })
            }
          }
        }
      } catch (error) {
        console.error('Failed to remove star:', error)
        toast({
          title: "Error",
          description: "Failed to remove from better links",
          variant: "destructive",
        })
      } finally {
        setStarringUrl(null)
      }
    } else {
      // 添加星标 - 打开对话框
      setPendingStarUrl({ url, domain })
      setStarTag('other')
      setStarComment('')
      setStarDialogOpen(true)
    }
  }

  // 确认添加星标
  const handleConfirmStar = async () => {
    if (!pendingStarUrl) return
    
    setStarringUrl(pendingStarUrl.url)
    
    try {
      const response = await fetch('/api/daily-urls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: pendingStarUrl.url,
          date: new Date().toISOString().split('T')[0],
          type: 'better_link',
          tag: starTag,
          comment: starComment || `Starred from ${groupName} group`
        })
      })
      
      if (response.ok) {
        const newStarredUrls = new Set(starredUrls)
        newStarredUrls.add(pendingStarUrl.url)
        setStarredUrls(newStarredUrls)
        
        toast({
          title: "Added to Better Links",
          description: "URL has been added to your better links collection.",
        })
        
        // 关闭对话框并重置状态
        setStarDialogOpen(false)
        setPendingStarUrl(null)
        setStarTag('other')
        setStarComment('')
      } else {
        throw new Error('Failed to add to better links')
      }
    } catch (error) {
      console.error('Failed to add star:', error)
      toast({
        title: "Error",
        description: "Failed to add to better links",
        variant: "destructive",
      })
    } finally {
      setStarringUrl(null)
    }
  }

  // 删除项目
  const handleDeleteProject = async (projectId: number, projectName: string) => {
    setDeletingProjectId(projectId)
    try {
      const response = await fetch(`/api/backlink-analyzer/projects/${projectId}`, {
        method: 'DELETE',
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "Project Deleted",
          description: `Project "${projectName}" and all its data have been deleted successfully.`,
        })
        // 重新加载项目列表
        await loadProjects()
      } else {
        toast({
          title: "Delete Failed",
          description: result.message || "Failed to delete project",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "An error occurred while deleting the project",
        variant: "destructive",
      })
    } finally {
      setDeletingProjectId(null)
    }
  }

  // File upload related functions
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragOver(false)
    
    const file = event.dataTransfer.files[0]
    if (file) {
      processFile(file)
    }
  }

  const processFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: "Invalid File Type",
        description: "Please select a CSV file",
        variant: "destructive",
      })
      return
    }

    try {
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      const preview = lines.slice(0, 5) // Show first 5 lines as preview
      
      setUploadedFile({ file, preview })
      setProjectName(file.name.replace('.csv', ''))
    } catch (error) {
      toast({
        title: "File Read Error",
        description: "Failed to read the CSV file",
        variant: "destructive",
      })
    }
  }

  const handleFileUpload = async () => {
    if (!uploadedFile || !projectName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a file and enter a project name",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('file', uploadedFile.file)
      formData.append('type', 'backlinks')
      formData.append('projectName', projectName)
      if (groupId && groupId !== 0) {
        formData.append('groupId', groupId.toString())
      }
      
      const response = await fetch('/api/backlink-analyzer/upload', {
        method: 'POST',
        body: formData
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "Upload Successful",
          description: result.message,
        })
        
        // Reset upload state and close dialog
        setUploadedFile(null)
        setProjectName('')
        setIsUploadDialogOpen(false)
        
        // Reload projects
        await loadProjects()
      } else {
        toast({
          title: "Upload Failed",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "An error occurred during file upload",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const resetUpload = () => {
    setUploadedFile(null)
    setProjectName('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  useEffect(() => {
    loadProjects()
    loadStarredUrls()
  }, [groupId])

  // 计算统计数据
  const getGroupStatistics = () => {
    if (groupBacklinks.length === 0) {
      return {
        uniqueSourceUrls: [],
        uniqueSourceUrlsWithScore: [],
        totalBacklinks: 0,
        totalProjects: projects.length
      }
    }

    // 去重后的所有 source URL 集合（用于外链提交参考）
    const uniqueSourceUrls = Array.from(new Set(groupBacklinks.map(b => b.source_url)))
    
    // 包含 authority score 的去重 source URL（用于 CSV 导出）
    const sourceUrlMap = new Map<string, { url: string, domain: string, maxScore: number }>()
    groupBacklinks.forEach(backlink => {
      const existing = sourceUrlMap.get(backlink.source_url)
      if (!existing || backlink.page_ascore > existing.maxScore) {
        sourceUrlMap.set(backlink.source_url, {
          url: backlink.source_url,
          domain: backlink.source_domain,
          maxScore: backlink.page_ascore
        })
      }
    })
    
    const uniqueSourceUrlsWithScore = Array.from(sourceUrlMap.values())
      .sort((a, b) => b.maxScore - a.maxScore)

    return {
      uniqueSourceUrls,
      uniqueSourceUrlsWithScore,
      totalBacklinks: groupBacklinks.length,
      totalProjects: projects.length
    }
  }

  const statistics = getGroupStatistics()

  // CSV 导出功能 - All Source URLs
  const exportSourceUrlsToCSV = () => {
    if (filteredAndSortedSourceUrls.length === 0) return
    
    const headers = ['Source URL', 'Domain', 'Authority Score', 'Count', 'Projects']
    
    const csvContent = [
      headers.join(','),
      ...filteredAndSortedSourceUrls.map((item: SourceUrlItem) => [
        `"${item.url}"`,
        `"${item.domain}"`,
        item.maxScore,
        item.count,
        `"${item.projects.join(', ')}"`
      ].join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${groupName.replace(/[^a-zA-Z0-9]/g, '_')}_all_source_urls.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Filter and sort source URLs
  const filteredAndSortedSourceUrls = useMemo(() => {
    let filtered = sourceUrls
    
    // Filter based on search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = sourceUrls.filter(item => 
        item.url.toLowerCase().includes(query) ||
        item.domain.toLowerCase().includes(query)
      )
    }

    // Sort based on current sort field and direction
    const sorted = [...filtered].sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

      switch (sortField) {
        case 'url':
          aValue = a.url.toLowerCase()
          bValue = b.url.toLowerCase()
          break
        case 'domain':
          aValue = a.domain.toLowerCase()
          bValue = b.domain.toLowerCase()
          break
        case 'maxScore':
          aValue = a.maxScore
          bValue = b.maxScore
          break
        case 'count':
          aValue = a.count
          bValue = b.count
          break
        default:
          aValue = a.maxScore
          bValue = b.maxScore
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return sorted
  }, [sourceUrls, searchQuery, sortField, sortDirection])

  // Handle sort
  const handleSort = (field: 'url' | 'domain' | 'maxScore' | 'count') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  // Get sort icon
  const getSortIcon = (field: 'url' | 'domain' | 'maxScore' | 'count') => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4" />
    }
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
  }

  if (loading || isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading projects...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Groups
        </Button>
        <div className="flex items-center gap-3">
          <div
            className="w-6 h-6 rounded-full"
            style={{ backgroundColor: groupColor }}
          />
          <div>
            <h2 className="text-2xl font-bold">{groupName}</h2>
            <p className="text-muted-foreground">
              {projects.length} {projects.length === 1 ? 'Project' : 'Projects'}
            </p>
          </div>
        </div>
      </div>

      {/* Group Statistics */}
      {!statisticsLoading && groupBacklinks.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{statistics.totalBacklinks}</div>
              <p className="text-xs text-muted-foreground">Total Backlinks</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{statistics.uniqueSourceUrls.length}</div>
              <p className="text-xs text-muted-foreground">Unique Source URLs</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* All Source URLs Table - Direct Integration */}
      {!statisticsLoading && groupBacklinks.length > 0 && (
        <div className="space-y-4">
          {/* Search and Export */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">All Source URLs</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportSourceUrlsToCSV}
                  disabled={filteredAndSortedSourceUrls.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV ({filteredAndSortedSourceUrls.length})
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by URL or domain (e.g., 'example.com' or 'https://example.com/page')"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Tip: You can search by domain name only (e.g., "example.com") to find all URLs from that domain
              </p>
            </CardContent>
          </Card>

          {/* Source URLs Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Source URLs ({filteredAndSortedSourceUrls.length} of {sourceUrls.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredAndSortedSourceUrls.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    {searchQuery ? 'No URLs found matching your search' : 'No source URLs found'}
                  </p>
                </div>
              ) : (
                <div className="max-h-[600px] overflow-auto border rounded-lg">
                  <Table className="table-fixed w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead style={{ width: '5%' }} className="text-center">Star</TableHead>
                        <TableHead style={{ width: '25%' }}>
                          <Button
                            variant="ghost"
                            onClick={() => handleSort('url')}
                            className="h-auto p-0 font-semibold"
                          >
                            Source URL {getSortIcon('url')}
                          </Button>
                        </TableHead>
                        <TableHead style={{ width: '20%' }}>
                          <Button
                            variant="ghost"
                            onClick={() => handleSort('domain')}
                            className="h-auto p-0 font-semibold"
                          >
                            Domain {getSortIcon('domain')}
                          </Button>
                        </TableHead>
                        <TableHead style={{ width: '15%' }} className="text-center">
                          <Button
                            variant="ghost"
                            onClick={() => handleSort('maxScore')}
                            className="h-auto p-0 font-semibold"
                          >
                            Authority Score {getSortIcon('maxScore')}
                          </Button>
                        </TableHead>
                        <TableHead style={{ width: '10%' }} className="text-center">
                          <Button
                            variant="ghost"
                            onClick={() => handleSort('count')}
                            className="h-auto p-0 font-semibold"
                          >
                            Count {getSortIcon('count')}
                          </Button>
                        </TableHead>
                        <TableHead style={{ width: '25%' }}>Projects</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAndSortedSourceUrls.map((item: SourceUrlItem, index: number) => (
                        <TableRow key={index} className="hover:bg-muted/50">
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => toggleStar(item.url, item.domain)}
                              disabled={starringUrl === item.url}
                            >
                              {starredUrls.has(item.url) ? (
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              ) : (
                                <StarOff className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 min-w-0 truncate" title={item.url}>
                                {item.url}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 flex-shrink-0"
                                onClick={() => window.open(item.url, '_blank')}
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-muted-foreground">
                              {item.domain}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">
                              {item.maxScore}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {item.count > 1 ? (
                              <Badge variant="default">
                                {item.count}x
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">1</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {item.projects.slice(0, 2).map((project: string, idx: number) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {project}
                                </Badge>
                              ))}
                              {item.projects.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{item.projects.length - 2}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {statisticsLoading && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center space-y-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground">Loading group statistics...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Projects Grid with Upload Placeholder */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Add Project Placeholder Card */}
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-dashed border-2 border-muted-foreground/25 hover:border-primary/50">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <Plus className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Add New Project</h3>
                    <p className="text-sm text-muted-foreground">Upload CSV file to create project</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Upload Project Data</DialogTitle>
              <DialogDescription>
                Upload a CSV file containing backlink data to create a new project in "{groupName}".
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* File Upload Area */}
              <div className="space-y-2">
                <Label>CSV File</Label>
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragOver(true)
                  }}
                  onDragLeave={() => setDragOver(false)}
                >
                  {uploadedFile ? (
                    <div className="space-y-2">
                      <FileText className="h-8 w-8 mx-auto text-green-600" />
                      <p className="font-medium">{uploadedFile.file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(uploadedFile.file.size / 1024).toFixed(1)} KB
                      </p>
                      <Button variant="outline" size="sm" onClick={resetUpload}>
                        <X className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p>Drag and drop your CSV file here, or click to browse</p>
                      <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                        Browse Files
                      </Button>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Project Name */}
              <div className="space-y-2">
                <Label htmlFor="projectName">Project Name</Label>
                <Input
                  id="projectName"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Enter project name"
                />
              </div>

              {/* File Preview */}
              {uploadedFile && (
                <div className="space-y-2">
                  <Label>File Preview</Label>
                  <div className="bg-muted p-3 rounded-lg text-sm font-mono">
                    {uploadedFile.preview.map((line, index) => (
                      <div key={index} className="truncate">
                        {line}
                      </div>
                    ))}
                    {uploadedFile.preview.length >= 5 && (
                      <div className="text-muted-foreground">...</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleFileUpload} disabled={!uploadedFile || !projectName.trim() || isUploading}>
                {isUploading ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border border-current border-t-transparent" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Project
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Existing Projects */}
        {projects.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center space-y-2">
                  <Folder className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">No projects in this group</p>
                  <p className="text-sm text-muted-foreground">Click the "Add New Project" card to upload your first CSV file</p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          projects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg line-clamp-2">{project.name}</CardTitle>
                    {project.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                    )}
                  </div>
                  <Folder className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 统计信息 */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" />
                      <span className="text-muted-foreground">Backlinks</span>
                    </div>
                    <div className="font-semibold">{project.backlinks_count || 0}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      <span className="text-muted-foreground">Avg Authority</span>
                    </div>
                    <div className="font-semibold">{Math.round(project.avg_authority || 0)}</div>
                  </div>
                </div>

                {/* Follow链接统计 */}
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="text-xs">
                    Follow: {project.follow_links_count || 0}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    NoFollow: {(project.backlinks_count || 0) - (project.follow_links_count || 0)}
                  </Badge>
                </div>

                {/* Created date */}
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>Created {new Date(project.created_at).toLocaleDateString('en-US')}</span>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <Button 
                    onClick={() => onProjectSelect(project.id, project.name)}
                    className="flex-1"
                    size="sm"
                  >
                    View Details
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={deletingProjectId === project.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Project</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete the project "{project.name}"? This will permanently delete the project and all its backlink data. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteProject(project.id, project.name)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {deletingProjectId === project.id ? 'Deleting...' : 'Delete Project'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Star Dialog */}
      <Dialog open={starDialogOpen} onOpenChange={setStarDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add to Better Links</DialogTitle>
            <DialogDescription>
              Configure the details for this better link entry.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* URL Display */}
            <div className="space-y-2">
              <Label>URL</Label>
              <div className="text-sm bg-muted p-2 rounded border break-all">
                {pendingStarUrl?.url}
              </div>
            </div>

            {/* Type Selection */}
            <div className="space-y-2">
              <Label htmlFor="star-tag">Type</Label>
              <Select value={starTag} onValueChange={(value: 'nav' | 'blog' | 'profile' | 'other') => setStarTag(value)}>
                <SelectTrigger id="star-tag">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TAG_CONFIG).map(([key, config]) => {
                    const IconComponent = config.icon
                    return (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4" />
                          <span>{config.label}</span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <Label htmlFor="star-comment">Comment (Optional)</Label>
              <Textarea
                id="star-comment"
                placeholder={`Starred from ${groupName} group`}
                value={starComment}
                onChange={(e) => setStarComment(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setStarDialogOpen(false)
                setPendingStarUrl(null)
                setStarTag('other')
                setStarComment('')
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmStar}
              disabled={starringUrl === pendingStarUrl?.url}
            >
              {starringUrl === pendingStarUrl?.url ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border border-current border-t-transparent" />
                  Adding...
                </>
              ) : (
                <>
                  <Star className="h-4 w-4 mr-2" />
                  Add to Better Links
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 