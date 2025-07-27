'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Plus, Edit, Trash2, Folder, FolderOpen } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"

interface Group {
  id: number
  name: string
  description: string
  color: string
  projects_count: number
  created_at: string
}

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

interface GroupManagerProps {
  onGroupsChange?: () => void
  onGroupSelect?: (groupId: number, groupName: string, groupColor: string) => void
}

const COLOR_OPTIONS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#10b981' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Yellow', value: '#eab308' },
]

export default function GroupManager({ onGroupsChange, onGroupSelect }: GroupManagerProps) {
  const [groups, setGroups] = useState<Group[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3b82f6'
  })
  const { toast } = useToast()

  const loadGroups = async () => {
    try {
      const response = await fetch('/api/backlink-analyzer/groups')
      const result = await response.json()
      
      if (result.success) {
        setGroups(result.data || [])
      } else {
        toast({
          title: "Error",
          description: "Failed to load groups",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Failed to load groups:', error)
      toast({
        title: "Error",
        description: "Failed to load groups",
        variant: "destructive",
      })
    }
  }

  const loadProjects = async () => {
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
    }
  }

  const loadData = async () => {
    setLoading(true)
    await Promise.all([loadGroups(), loadProjects()])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: '#3b82f6'
    })
    setEditingGroup(null)
  }

  const handleCreateGroup = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Group name is required",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch('/api/backlink-analyzer/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success",
          description: "Group created successfully",
        })
        setIsCreateDialogOpen(false)
        resetForm()
        loadData()
        onGroupsChange?.()
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to create group",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Failed to create group:', error)
      toast({
        title: "Error",
        description: "Failed to create group",
        variant: "destructive",
      })
    }
  }

  const handleUpdateGroup = async () => {
    if (!editingGroup || !formData.name.trim()) {
      toast({
        title: "Error",
        description: "Group name is required",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch('/api/backlink-analyzer/groups', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingGroup.id,
          ...formData
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success",
          description: "Group updated successfully",
        })
        resetForm()
        loadData()
        onGroupsChange?.()
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to update group",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Failed to update group:', error)
      toast({
        title: "Error",
        description: "Failed to update group",
        variant: "destructive",
      })
    }
  }

  const handleDeleteGroup = async (groupId: number) => {
    try {
      const response = await fetch(`/api/backlink-analyzer/groups?id=${groupId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success",
          description: "Group deleted successfully",
        })
        loadData()
        onGroupsChange?.()
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to delete group",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Failed to delete group:', error)
      toast({
        title: "Error",
        description: "Failed to delete group",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (group: Group) => {
    setEditingGroup(group)
    setFormData({
      name: group.name,
      description: group.description,
      color: group.color
    })
  }

  // 按分组组织项目，计算每个组的实际项目数量
  const groupedProjects = projects.reduce((acc, project) => {
    const groupId = project.group_id || 0 // 0 for "No Group"
    if (!acc[groupId]) {
      acc[groupId] = []
    }
    acc[groupId].push(project)
    return acc
  }, {} as Record<number, Project[]>)

  // 创建一个虚拟的"No Group"组
  const noGroupProjects = groupedProjects[0] || []
  const hasNoGroupProjects = noGroupProjects.length > 0

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading data...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Groups & Projects</h2>
          <p className="text-muted-foreground">Click on a group to view its projects</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Create Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Group</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="group-name">Group Name *</Label>
                <Input
                  id="group-name"
                  placeholder="Enter group name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="group-description">Description</Label>
                <Textarea
                  id="group-description"
                  placeholder="Enter group description (optional)"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 ${
                        formData.color === color.value ? 'border-gray-800' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => setFormData({ ...formData, color: color.value })}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
              <Button onClick={handleCreateGroup} className="w-full">
                Create Group
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {groups.length === 0 && !hasNoGroupProjects ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <FolderOpen className="h-16 w-16 mx-auto text-muted-foreground" />
              <div className="space-y-2">
                <p className="text-lg font-medium">No groups or projects yet</p>
                <p className="text-sm text-muted-foreground">Create a group to organize your projects, or upload CSV files to create projects</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* 显示有分组的项目 */}
          {groups.map((group) => {
            const groupProjects = groupedProjects[group.id] || []
            
            return (
              <Card 
                key={group.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => onGroupSelect?.(group.id, group.name, group.color)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: group.color }}
                        />
                        <CardTitle className="text-lg line-clamp-1">{group.name}</CardTitle>
                      </div>
                      {group.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{group.description}</p>
                      )}
                    </div>
                    <FolderOpen className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">
                      {groupProjects.length} {groupProjects.length === 1 ? 'Project' : 'Projects'}
                    </Badge>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(group)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Group</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit-group-name">Group Name *</Label>
                              <Input
                                id="edit-group-name"
                                placeholder="Enter group name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-group-description">Description</Label>
                              <Textarea
                                id="edit-group-description"
                                placeholder="Enter group description (optional)"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Color</Label>
                              <div className="flex flex-wrap gap-2">
                                {COLOR_OPTIONS.map((color) => (
                                  <button
                                    key={color.value}
                                    type="button"
                                    className={`w-8 h-8 rounded-full border-2 ${
                                      formData.color === color.value ? 'border-gray-800' : 'border-gray-300'
                                    }`}
                                    style={{ backgroundColor: color.value }}
                                    onClick={() => setFormData({ ...formData, color: color.value })}
                                    title={color.name}
                                  />
                                ))}
                              </div>
                            </div>
                            <Button onClick={handleUpdateGroup} className="w-full">
                              Update Group
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Group</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{group.name}"? This action cannot be undone.
                              Projects in this group will be moved to "No Group".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteGroup(group.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Created {new Date(group.created_at).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {/* 显示没有分组的项目 */}
          {hasNoGroupProjects && (
            <Card 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => onGroupSelect?.(0, 'No Group', '#6b7280')}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-gray-400" />
                      <CardTitle className="text-lg">No Group</CardTitle>
                    </div>
                    <p className="text-sm text-muted-foreground">Projects without a group</p>
                  </div>
                  <FolderOpen className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">
                    {noGroupProjects.length} {noGroupProjects.length === 1 ? 'Project' : 'Projects'}
                  </Badge>
                </div>

                <div className="text-xs text-muted-foreground">
                  Ungrouped projects
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
} 