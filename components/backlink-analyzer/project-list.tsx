'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Folder, ExternalLink, Calendar, TrendingUp } from 'lucide-react'

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

interface ProjectListProps {
  onProjectSelect: (projectId: number, projectName: string) => void
  isLoading?: boolean
}

export default function ProjectList({ onProjectSelect, isLoading = false }: ProjectListProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  const loadProjects = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/backlink-analyzer/projects')
      const result = await response.json()
      
      if (result.success) {
        setProjects(result.data || [])
      } else {
        console.error('Failed to load projects:', result.message)
      }
    } catch (error) {
      console.error('Failed to load projects:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

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

  if (projects.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center space-y-2">
            <Folder className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">No projects yet</p>
            <p className="text-sm text-muted-foreground">Please upload a CSV file to create a project</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // 按分组组织项目
  const groupedProjects = projects.reduce((acc, project) => {
    const groupKey = project.group_name || 'No Group'
    if (!acc[groupKey]) {
      acc[groupKey] = {
        groupName: project.group_name,
        groupColor: project.group_color,
        projects: []
      }
    }
    acc[groupKey].projects.push(project)
    return acc
  }, {} as Record<string, { groupName: string | null, groupColor: string | null, projects: Project[] }>)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Project List</h2>
        <Badge variant="secondary">{projects.length} Projects</Badge>
      </div>

      {Object.entries(groupedProjects).map(([groupKey, groupData]) => (
        <div key={groupKey} className="space-y-4">
          <div className="flex items-center gap-2">
            {groupData.groupColor && (
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: groupData.groupColor }}
              />
            )}
            <h3 className="text-lg font-semibold">{groupKey}</h3>
            <Badge variant="outline">{groupData.projects.length}</Badge>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {groupData.projects.map((project) => (
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

              {/* View details button */}
              <Button 
                onClick={() => onProjectSelect(project.id, project.name)}
                className="w-full"
                size="sm"
              >
                View Details
              </Button>
            </CardContent>
          </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
} 