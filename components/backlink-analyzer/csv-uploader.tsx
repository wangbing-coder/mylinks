'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, FileText, X, Folder } from 'lucide-react'

interface CsvUploaderProps {
  onFileUpload: (file: File, projectName: string, groupId?: number) => void
  isUploading?: boolean
}

interface Group {
  id: number
  name: string
  color: string
  projects_count: number
}

interface UploadedFile {
  file: File
  preview: string[]
}

export default function CsvUploader({ onFileUpload, isUploading = false }: CsvUploaderProps) {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState<string>('none')
  const [groups, setGroups] = useState<Group[]>([])
  const [loadingGroups, setLoadingGroups] = useState(true)

  const loadGroups = async () => {
    setLoadingGroups(true)
    try {
      const response = await fetch('/api/backlink-analyzer/groups')
      const result = await response.json()
      
      if (result.success) {
        setGroups(result.data || [])
      }
    } catch (error) {
      console.error('Failed to load groups:', error)
    } finally {
      setLoadingGroups(false)
    }
  }

  useEffect(() => {
    loadGroups()
  }, [])

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]
    if (!file.name.endsWith('.csv')) {
      alert('Please select a CSV file')
      return
    }

    // Extract project name from filename (remove .csv extension)
    const extractedProjectName = file.name.replace(/\.csv$/i, '')
    if (!projectName) {
      setProjectName(extractedProjectName)
    }

    // Read file preview
    const text = await file.text()
    const lines = text.split('\n').slice(0, 5) // Show first 5 lines as preview
    
    const newUploadedFile: UploadedFile = {
      file,
      preview: lines
    }

    setUploadedFile(newUploadedFile)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const removeFile = () => {
    // If project name matches the filename, clear it when removing file
    if (uploadedFile && projectName === uploadedFile.file.name.replace(/\.csv$/i, '')) {
      setProjectName('')
    }
    setUploadedFile(null)
  }

  const processFile = () => {
    if (uploadedFile && projectName.trim()) {
      const groupId = selectedGroupId && selectedGroupId !== 'none' ? parseInt(selectedGroupId) : undefined
      onFileUpload(uploadedFile.file, projectName.trim(), groupId)
    }
  }

  const selectFile = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv'
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement
      handleFileSelect(target.files)
    }
    input.click()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          CSV File Upload
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Project name input */}
        <div className="space-y-2">
          <Label htmlFor="project-name">Project Name *</Label>
          <Input
            id="project-name"
            placeholder="Enter project name, e.g.: Website Backlink Analysis"
            value={projectName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProjectName(e.target.value)}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Projects with the same name will be merged
          </p>
        </div>

        {/* Group selection */}
        <div className="space-y-2">
          <Label htmlFor="group-select">Group (Optional)</Label>
          <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
            <SelectTrigger>
              <SelectValue placeholder={loadingGroups ? "Loading groups..." : "Select a group (optional)"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Group</SelectItem>
              {groups.map((group) => (
                <SelectItem key={group.id} value={group.id.toString()}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: group.color }}
                    />
                    <span>{group.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {group.projects_count}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Organize your project by selecting a group
          </p>
        </div>

        {/* Backlinks file upload */}
        <div className="space-y-2">
          <Label>Backlinks CSV File</Label>
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {uploadedFile ? (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <FileText className="h-5 w-5 text-green-600" />
                  <span className="font-medium">{uploadedFile.file.name}</span>
                  <Button variant="ghost" size="sm" onClick={removeFile}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Badge variant="secondary">Backlinks Data</Badge>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Drag & drop backlinks CSV file here, or{' '}
                  <Button variant="link" className="p-0 h-auto" onClick={selectFile}>
                    click to select file
                  </Button>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* File preview */}
        {uploadedFile && (
          <div className="space-y-4">
            <h4 className="font-medium">File Preview</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="default">Backlinks</Badge>
                <span className="text-sm text-muted-foreground">{uploadedFile.file.name}</span>
              </div>
              <div className="bg-muted p-3 rounded text-xs font-mono overflow-auto">
                {uploadedFile.preview.map((line, index) => (
                  <div key={index} className="truncate">
                    {line}
                  </div>
                ))}
                {uploadedFile.preview.length === 5 && <div className="text-muted-foreground">...</div>}
              </div>
            </div>
          </div>
        )}

        {/* Process button */}
        {uploadedFile && (
          <div className="pt-4">
            <Button 
              onClick={processFile} 
              disabled={isUploading || !projectName.trim()}
              className="w-full"
            >
              {isUploading ? 'Processing...' : 'Process File'}
            </Button>
            {!projectName.trim() && (
              <p className="text-xs text-red-500 mt-2">Please enter project name first</p>
            )}
          </div>
        )}

        {/* Usage instructions */}
        <Alert>
          <AlertDescription>
            <div className="space-y-2 text-sm">
              <p><strong>Supported format:</strong> CSV</p>
              <p><strong>Expected fields:</strong> Source URL, Target URL, Domain, Anchor Text, Follow Status, Authority Score, etc.</p>
              <p><strong>Note:</strong> Multiple backlinks from the same domain will be automatically filtered, keeping only the most valuable link</p>
            </div>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
} 