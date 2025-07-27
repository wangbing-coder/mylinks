'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import Header from '@/components/header'
import CsvUploader from '@/components/backlink-analyzer/csv-uploader'
import DataDisplay from '@/components/backlink-analyzer/data-display'
import GroupManager from '@/components/backlink-analyzer/group-manager'
import GroupProjects from '@/components/backlink-analyzer/group-projects'
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { FolderOpen, Upload } from 'lucide-react'

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
}

export default function HomePage() {
  const t = useTranslations('home')
  const [backlinks, setBacklinks] = useState<Backlink[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [alert, setAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [currentView, setCurrentView] = useState<'groups' | 'upload' | 'data' | 'group-projects'>('groups')
  const [selectedProject, setSelectedProject] = useState<{ id: number, name: string } | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<{ id: number, name: string, color: string } | null>(null)

  // 加载项目数据
  const loadProjectData = async (projectId: number) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/backlink-analyzer/projects/${projectId}`)
      const result = await response.json()
      
      if (result.success) {
        setBacklinks(result.data || [])
      } else {
        console.error('Failed to load project data:', result.message)
      }
    } catch (error) {
      console.error('Failed to load project data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 处理项目选择
  const handleProjectSelect = async (projectId: number, projectName: string) => {
    setSelectedProject({ id: projectId, name: projectName })
    setCurrentView('data')
    await loadProjectData(projectId)
  }

  // 返回到组项目列表
  const handleBackToGroups = () => {
    setCurrentView('group-projects')
    setSelectedProject(null)
    setBacklinks([])
  }

  // 处理组选择
  const handleGroupSelect = (groupId: number, groupName: string, groupColor: string) => {
    setSelectedGroup({ id: groupId, name: groupName, color: groupColor })
    setCurrentView('group-projects')
  }

  // 从组项目列表返回到组列表
  const handleBackToGroupsList = () => {
    setCurrentView('groups')
    setSelectedGroup(null)
  }

  // 处理文件上传
  const handleFileUpload = async (file: File, projectName: string, groupId?: number) => {
    setIsUploading(true)
    setAlert(null)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'backlinks')
      formData.append('projectName', projectName)
      if (groupId) {
        formData.append('groupId', groupId.toString())
      }
      
      const response = await fetch('/api/backlink-analyzer/upload', {
        method: 'POST',
        body: formData
      })
      
      const result = await response.json()
      
      if (result.success) {
        setAlert({ type: 'success', message: result.message })
        // Switch to groups after successful upload
        setCurrentView('groups')
      } else {
        setAlert({ type: 'error', message: result.message })
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'File upload failed' })
      console.error('File upload failed:', error)
    } finally {
      setIsUploading(false)
    }
  }

  // No need to load data on page load, show project list directly

  return (
    <div className="min-h-screen bg-background flex">
      {/* 真正的侧边栏 - 紧靠左边界 */}
      <div className="w-56 bg-card border-r border-border flex-shrink-0">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Backlink Analyzer</h2>
        </div>
        <div className="p-4">
          <div className="space-y-2">
            <Button
              variant={currentView === 'groups' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setCurrentView('groups')}
            >
              <FolderOpen className="h-4 w-4 mr-2" />
              Groups & Projects
            </Button>
            <Button
              variant={currentView === 'upload' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setCurrentView('upload')}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Data
            </Button>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="flex-1 flex flex-col">
        <Header />
        <div className="flex-1 container mx-auto px-6 py-8">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-4">Backlink Analyzer</h1>
              <p className="text-xl text-muted-foreground">
                Extract and analyze valuable backlinks from Semrush exported CSV files
              </p>
            </div>

            {/* 状态提示 */}
            {alert && (
              <Alert className={alert.type === 'success' ? 'border-green-500' : 'border-red-500'}>
                <AlertDescription>{alert.message}</AlertDescription>
              </Alert>
            )}

            {/* 内容区域 */}
            <div>
              <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as any)} className="w-full">
                <TabsList className="hidden">
                  <TabsTrigger value="groups">Groups</TabsTrigger>
                  <TabsTrigger value="group-projects">Group Projects</TabsTrigger>
                  <TabsTrigger value="upload">Upload Data</TabsTrigger>
                  <TabsTrigger value="data">Data View</TabsTrigger>
                </TabsList>

            <TabsContent value="groups" className="space-y-6">
              <GroupManager onGroupSelect={handleGroupSelect} />
            </TabsContent>

            <TabsContent value="group-projects" className="space-y-6">
              {selectedGroup && (
                <GroupProjects
                  groupId={selectedGroup.id}
                  groupName={selectedGroup.name}
                  groupColor={selectedGroup.color}
                  onProjectSelect={handleProjectSelect}
                  onBack={handleBackToGroupsList}
                />
              )}
            </TabsContent>

            <TabsContent value="upload" className="space-y-6">
              <CsvUploader 
                onFileUpload={handleFileUpload}
                isUploading={isUploading}
              />
            </TabsContent>

            {/* 数据详情页面 - 显示在右侧内容区域 */}
            {currentView === 'data' && selectedProject && (
              <TabsContent value="data" className="space-y-6">
                <DataDisplay 
                  backlinks={backlinks}
                  isLoading={isLoading}
                  projectName={selectedProject.name}
                  onBack={handleBackToGroups}
                />
              </TabsContent>
            )}
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
