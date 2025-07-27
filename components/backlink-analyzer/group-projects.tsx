'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Folder, ExternalLink, Calendar, TrendingUp, ArrowLeft, Download, Trash2 } from 'lucide-react'
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
        await loadGroupBacklinks(groupProjects.map((p: Project) => p.id))
      } else {
        console.error('Failed to load projects:', result.message)
      }
    } catch (error) {
      console.error('Failed to load projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadGroupBacklinks = async (projectIds: number[]) => {
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
    } catch (error) {
      console.error('Failed to load group backlinks:', error)
    } finally {
      setStatisticsLoading(false)
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

  useEffect(() => {
    loadProjects()
  }, [groupId])

  // 计算统计数据
  const getGroupStatistics = () => {
    if (groupBacklinks.length === 0) {
      return {
        uniqueSourceUrls: [],
        uniqueSourceUrlsWithScore: [],
        duplicatedSourceUrls: [],
        totalBacklinks: 0,
        totalProjects: projects.length
      }
    }

    // 1. 去重后的所有 source URL 集合（用于外链提交参考）
    const uniqueSourceUrls = Array.from(new Set(groupBacklinks.map(b => b.source_url)))
    
    // 1.1. 包含 authority score 的去重 source URL（用于 CSV 导出）
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

    // 2. 重复2次以上的 source URL（优质外链来源）
    const sourceUrlCountMap = new Map<string, number>()
    groupBacklinks.forEach(backlink => {
      const count = sourceUrlCountMap.get(backlink.source_url) || 0
      sourceUrlCountMap.set(backlink.source_url, count + 1)
    })

    const duplicatedSourceUrls = Array.from(sourceUrlCountMap.entries())
      .filter(([url, count]) => count >= 2)
      .map(([url, count]) => ({
        url,
        count,
        domain: groupBacklinks.find(b => b.source_url === url)?.source_domain || '',
        maxScore: sourceUrlMap.get(url)?.maxScore || 0
      }))
      .sort((a, b) => b.count - a.count)

    return {
      uniqueSourceUrls,
      uniqueSourceUrlsWithScore,
      duplicatedSourceUrls,
      totalBacklinks: groupBacklinks.length,
      totalProjects: projects.length
    }
  }

  const statistics = getGroupStatistics()

  // CSV 导出功能 - All Source URLs
  const exportSourceUrlsToCSV = () => {
    if (statistics.uniqueSourceUrlsWithScore.length === 0) return
    
    const headers = ['Source URL', 'Domain', 'Authority Score']
    
    const csvContent = [
      headers.join(','),
      ...statistics.uniqueSourceUrlsWithScore.map(item => [
        `"${item.url}"`,
        `"${item.domain}"`,
        item.maxScore
      ].join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${groupName.replace(/[^a-zA-Z0-9]/g, '_')}_source_urls.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // CSV 导出功能 - Quality Source URLs
  const exportQualitySourceUrlsToCSV = () => {
    if (statistics.duplicatedSourceUrls.length === 0) return
    
    const headers = ['Source URL', 'Domain', 'Authority Score', 'Frequency']
    
    const csvContent = [
      headers.join(','),
      ...statistics.duplicatedSourceUrls.map(item => [
        `"${item.url}"`,
        `"${item.domain}"`,
        item.maxScore,
        item.count
      ].join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${groupName.replace(/[^a-zA-Z0-9]/g, '_')}_quality_source_urls.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
        <div className="grid gap-4 md:grid-cols-3">
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
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{statistics.duplicatedSourceUrls.length}</div>
              <p className="text-xs text-muted-foreground">Quality Source URLs (≥2)</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Statistics */}
      {!statisticsLoading && groupBacklinks.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Quality Source URLs */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Quality Source URLs</CardTitle>
                  <p className="text-sm text-muted-foreground">Source URLs appearing ≥2 times (good for repeat outreach)</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportQualitySourceUrlsToCSV}
                  disabled={statistics.duplicatedSourceUrls.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {statistics.duplicatedSourceUrls.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No repeated source URLs found</p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {statistics.duplicatedSourceUrls.slice(0, 20).map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" title={item.url}>{item.url}</p>
                        <p className="text-xs text-muted-foreground">{item.domain} • AS: {item.maxScore}</p>
                      </div>
                      <Badge variant="default" className="ml-2">
                        {item.count}x
                      </Badge>
                    </div>
                  ))}
                  {statistics.duplicatedSourceUrls.length > 20 && (
                    <p className="text-xs text-muted-foreground text-center pt-2">
                      And {statistics.duplicatedSourceUrls.length - 20} more...
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* All Source URLs */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">All Source URLs</CardTitle>
                  <p className="text-sm text-muted-foreground">All unique backlink sources for outreach reference</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportSourceUrlsToCSV}
                  disabled={statistics.uniqueSourceUrlsWithScore.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {statistics.uniqueSourceUrlsWithScore.slice(0, 20).map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate" title={item.url}>{item.url}</p>
                      <p className="text-xs text-muted-foreground">{item.domain}</p>
                    </div>
                    <Badge variant="outline" className="ml-2">
                      AS: {item.maxScore}
                    </Badge>
                  </div>
                ))}
                {statistics.uniqueSourceUrlsWithScore.length > 20 && (
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    And {statistics.uniqueSourceUrlsWithScore.length - 20} more...
                  </p>
                )}
              </div>
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

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-2">
              <Folder className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">No projects in this group</p>
              <p className="text-sm text-muted-foreground">Upload CSV files to create projects in this group</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
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
          ))}
        </div>
      )}
    </div>
  )
} 