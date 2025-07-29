"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Copy, ExternalLink, Trash2, Star, Navigation, BookOpen, User, Hash, Search, Edit, Save, X, Plus } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface DailyUrl {
  id: number
  url: string
  date: string
  type: 'url' | 'better_link'
  tag: 'nav' | 'blog' | 'profile' | 'other'
  comment?: string
  color: 'green' | 'blue' | 'red' | 'yellow' | 'purple' | 'gray'
  created_at: string
}

// 标签配置
const TAG_CONFIG = {
  nav: { label: 'Navigation', icon: Navigation, color: 'bg-blue-100 text-blue-800' },
  blog: { label: 'Blog', icon: BookOpen, color: 'bg-green-100 text-green-800' },
  profile: { label: 'Profile', icon: User, color: 'bg-purple-100 text-purple-800' },
  other: { label: 'Other', icon: Hash, color: 'bg-gray-100 text-gray-800' }
} as const

// 颜色配置
const COLOR_CONFIG = {
  green: { label: 'Green', class: 'bg-green-500', textClass: 'text-green-700' },
  blue: { label: 'Blue', class: 'bg-blue-500', textClass: 'text-blue-700' },
  red: { label: 'Red', class: 'bg-red-500', textClass: 'text-red-700' },
  yellow: { label: 'Yellow', class: 'bg-yellow-500', textClass: 'text-yellow-700' },
  purple: { label: 'Purple', class: 'bg-purple-500', textClass: 'text-purple-700' },
  gray: { label: 'Gray', class: 'bg-gray-500', textClass: 'text-gray-700' }
} as const

export default function UrlTracker() {
  const [urls, setUrls] = useState<DailyUrl[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [checkingUrls, setCheckingUrls] = useState<Set<number>>(new Set())
  const [checkedResults, setCheckedResults] = useState<Map<number, { projectCount: number; backlinkCount: number }>>(new Map())
  const [isBatchChecking, setIsBatchChecking] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingComment, setEditingComment] = useState('')
  const [editingColor, setEditingColor] = useState<'green' | 'blue' | 'red' | 'yellow' | 'purple' | 'gray'>('green')
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [newUrl, setNewUrl] = useState('')
  const [newComment, setNewComment] = useState('')
  const [newTag, setNewTag] = useState<'nav' | 'blog' | 'profile' | 'other'>('other')
  const [newColor, setNewColor] = useState<'green' | 'blue' | 'red' | 'yellow' | 'purple' | 'gray'>('green')
  const [isAdding, setIsAdding] = useState(false)
  const { toast } = useToast()

  // Load Better Links only
  const loadUrls = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/daily-urls?type=better_link')
      const result = await response.json()
      
      if (result.success) {
        setUrls(result.data || [])
      } else {
        toast({
          title: "Load Failed",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Load Failed",
        description: "Unable to load better links",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Copy URL to clipboard
  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      toast({
        title: "Copy Success",
        description: "URL copied to clipboard",
      })
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy URL",
        variant: "destructive",
      })
    }
  }

  // Open URL in new window
  const handleOpenUrl = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  // Delete URL
  const handleDeleteUrl = async (id: number) => {
    try {
      const response = await fetch(`/api/daily-urls/${id}`, {
        method: 'DELETE',
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "Delete Success",
          description: "Better link deleted successfully",
        })
        await loadUrls()
      } else {
        toast({
          title: "Delete Failed",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Unable to delete better link",
        variant: "destructive",
      })
    }
  }

  // Check single URL backlinks
  const handleCheckBacklinks = async (id: number, url: string) => {
    setCheckingUrls(prev => new Set(prev).add(id))
    
    try {
      const response = await fetch('/api/daily-urls/check-backlinks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      })
      
      const result = await response.json()
      
      if (result.success) {
        setCheckedResults(prev => new Map(prev).set(id, {
          projectCount: result.data.projectCount,
          backlinkCount: result.data.backlinkCount
        }))
        
        toast({
          title: "Check Complete",
          description: `Found ${result.data.backlinkCount} backlinks in ${result.data.projectCount} projects`,
        })
      } else {
        toast({
          title: "Check Failed",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Check Failed",
        description: "Unable to check backlinks",
        variant: "destructive",
      })
    } finally {
      setCheckingUrls(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
  }

  // Start editing
  const handleStartEdit = (urlItem: DailyUrl) => {
    setEditingId(urlItem.id)
    setEditingComment(urlItem.comment || '')
    setEditingColor(urlItem.color)
  }

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingComment('')
    setEditingColor('green')
  }

  // Add new better link manually
  const handleAddBetterLink = async () => {
    if (!newUrl.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a URL",
        variant: "destructive",
      })
      return
    }

    // URL format validation
    try {
      new URL(newUrl)
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL",
        variant: "destructive",
      })
      return
    }

    setIsAdding(true)

    try {
      const response = await fetch('/api/daily-urls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: newUrl,
          date: new Date().toISOString().split('T')[0],
          type: 'better_link',
          tag: newTag,
          comment: newComment || 'Manually added',
          color: newColor
        }),
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "Add Success",
          description: "Better link added successfully",
        })
        setAddDialogOpen(false)
        setNewUrl('')
        setNewComment('')
        setNewTag('other')
        setNewColor('green')
        await loadUrls()
      } else {
        toast({
          title: "Add Failed",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Add Failed",
        description: "Unable to add better link",
        variant: "destructive",
      })
    } finally {
      setIsAdding(false)
    }
  }

  // Save edit
  const handleSaveEdit = async (id: number) => {
    try {
      const response = await fetch(`/api/daily-urls/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comment: editingComment,
          color: editingColor
        }),
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "Update Success",
          description: "Better link updated successfully",
        })
        setEditingId(null)
        setEditingComment('')
        setEditingColor('green')
        await loadUrls()
      } else {
        toast({
          title: "Update Failed",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Unable to update better link",
        variant: "destructive",
      })
    }
  }

  // Batch check backlinks for all better links
  const handleBatchCheckBacklinks = async () => {
    if (urls.length === 0) {
      toast({
        title: "No Better Links",
        description: "No better links found to check",
        variant: "destructive",
      })
      return
    }

    setIsBatchChecking(true)
    let checkedCount = 0
    let totalFound = 0

    try {
      for (const urlItem of urls) {
        // Skip if already checked
        if (checkedResults.has(urlItem.id)) {
          continue
        }

        try {
          const response = await fetch('/api/daily-urls/check-backlinks', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: urlItem.url }),
          })
          
          const result = await response.json()
          
          if (result.success) {
            setCheckedResults(prev => new Map(prev).set(urlItem.id, {
              projectCount: result.data.projectCount,
              backlinkCount: result.data.backlinkCount
            }))
            
            checkedCount++
            totalFound += result.data.backlinkCount
          }
        } catch (error) {
          console.error(`Failed to check ${urlItem.url}:`, error)
        }

        // Add small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      toast({
        title: "Batch Check Complete",
        description: `Checked ${checkedCount} better links, found ${totalFound} total backlinks`,
      })

    } catch (error) {
      toast({
        title: "Batch Check Failed",
        description: "Failed to complete batch check",
        variant: "destructive",
      })
    } finally {
      setIsBatchChecking(false)
    }
  }

  useEffect(() => {
    loadUrls()
  }, [])

  // 按标签分组URLs
  const groupedUrls = urls.reduce((acc, url) => {
    if (!acc[url.tag]) {
      acc[url.tag] = []
    }
    acc[url.tag].push(url)
    return acc
  }, {} as Record<string, DailyUrl[]>)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Better Links</h1>
          <p className="text-muted-foreground">
            Manage your starred better links collection
          </p>
        </div>
      </div>

      {/* Simple Statistics */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Better Links</CardTitle>
          <Star className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{urls.length}</div>
          <p className="text-xs text-muted-foreground">
            Links starred from backlink analysis
          </p>
        </CardContent>
      </Card>

      {/* Better Links List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Better Links</CardTitle>
              <CardDescription>
                Your starred links collection ({urls.length} items)
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Better Link
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add Better Link</DialogTitle>
                    <DialogDescription>
                      Manually add a new better link to your collection.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="url">URL</Label>
                      <Input
                        id="url"
                        placeholder="https://example.com"
                        value={newUrl}
                        onChange={(e) => setNewUrl(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tag">Tag</Label>
                      <Select value={newTag} onValueChange={(value: 'nav' | 'blog' | 'profile' | 'other') => setNewTag(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(TAG_CONFIG).map(([key, config]) => {
                            const IconComponent = config.icon
                            return (
                              <SelectItem key={key} value={key}>
                                <div className="flex items-center gap-2">
                                  <IconComponent className="h-4 w-4" />
                                  {config.label}
                                </div>
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="color">Color</Label>
                      <Select value={newColor} onValueChange={(value: 'green' | 'blue' | 'red' | 'yellow' | 'purple' | 'gray') => setNewColor(value)}>
                        <SelectTrigger className="w-full">
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-full ${COLOR_CONFIG[newColor].class}`} />
                            {COLOR_CONFIG[newColor].label}
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(COLOR_CONFIG).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                <div className={`w-4 h-4 rounded-full ${config.class}`} />
                                {config.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="comment">Comment (Optional)</Label>
                      <Textarea
                        id="comment"
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddBetterLink} disabled={isAdding}>
                      {isAdding ? (
                        <>
                          <div className="h-4 w-4 mr-2 animate-spin rounded-full border border-current border-t-transparent" />
                          Adding...
                        </>
                      ) : (
                        'Add Link'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              {urls.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBatchCheckBacklinks}
                  disabled={isBatchChecking}
                >
                  {isBatchChecking ? (
                    <>
                      <div className="h-4 w-4 mr-2 animate-spin rounded-full border border-current border-t-transparent" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Check All Links
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : urls.length === 0 ? (
            <div className="text-center py-8">
              <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">No better links found</p>
              <p className="text-sm text-muted-foreground">
                Star URLs from the backlink analyzer to add them here
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedUrls).map(([tag, tagUrls]) => {
                const tagConfig = TAG_CONFIG[tag as keyof typeof TAG_CONFIG]
                const IconComponent = tagConfig?.icon || Hash
                
                return (
                  <div key={tag} className="space-y-3">
                    {/* 分组标题 */}
                    <div className="flex items-center gap-2 py-2 px-3 bg-muted/30 rounded-md border-l-4 border-l-primary">
                      <IconComponent className="h-4 w-4" />
                      <span className="font-medium">
                        {tagConfig?.label || 'Other'}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        ({tagUrls.length})
                      </span>
                    </div>
                    
                    {/* 表格 */}
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow className="h-10">
                            <TableHead style={{ width: '40%' }} className="py-2">URL</TableHead>
                            <TableHead style={{ width: '25%' }} className="py-2">Comment</TableHead>
                            <TableHead style={{ width: '10%' }} className="py-2">Color</TableHead>
                            <TableHead style={{ width: '25%' }} className="py-2">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tagUrls.map((urlItem) => (
                            <TableRow key={urlItem.id} className="h-12">
                              <TableCell className="py-2">
                                <p className="text-sm font-mono break-all leading-tight" title={urlItem.url}>
                                  {urlItem.url}
                                </p>
                              </TableCell>
                              <TableCell className="py-2">
                                {editingId === urlItem.id ? (
                                  <Input
                                    value={editingComment}
                                    onChange={(e) => setEditingComment(e.target.value)}
                                    placeholder="Enter comment..."
                                    className="text-sm h-8 py-1"
                                  />
                                ) : urlItem.comment ? (
                                  <p className="text-sm text-muted-foreground break-words leading-tight">
                                    {urlItem.comment}
                                  </p>
                                ) : (
                                  <span className="text-sm text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell className="py-2">
                                {editingId === urlItem.id ? (
                                  <Select value={editingColor} onValueChange={(value: 'green' | 'blue' | 'red' | 'yellow' | 'purple' | 'gray') => setEditingColor(value)}>
                                    <SelectTrigger className="w-12 h-8 p-1">
                                      <div className={`w-6 h-6 rounded-full ${COLOR_CONFIG[editingColor].class} mx-auto`} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {Object.entries(COLOR_CONFIG).map(([key, config]) => (
                                        <SelectItem key={key} value={key}>
                                          <div className={`w-6 h-6 rounded-full ${config.class} mx-auto`} />
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <div className="flex justify-center">
                                    <div className={`w-6 h-6 rounded-full ${COLOR_CONFIG[urlItem.color].class}`} />
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="py-2">
                                <div className="flex items-center gap-1">
                                  {/* Check Backlinks */}
                                  {checkedResults.has(urlItem.id) ? (
                                    <Badge variant="secondary" className="text-xs h-6 px-2">
                                      {checkedResults.get(urlItem.id)?.backlinkCount || 0} backlinks
                                    </Badge>
                                  ) : (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleCheckBacklinks(urlItem.id, urlItem.url)}
                                      disabled={checkingUrls.has(urlItem.id)}
                                      className="h-6 px-2"
                                    >
                                      {checkingUrls.has(urlItem.id) ? (
                                        <div className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                                      ) : (
                                        <Search className="h-3 w-3" />
                                      )}
                                    </Button>
                                  )}
                                  
                                  {/* Edit/Save/Cancel Buttons */}
                                  {editingId === urlItem.id ? (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleSaveEdit(urlItem.id)}
                                        className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
                                        title="Save"
                                      >
                                        <Save className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleCancelEdit}
                                        className="h-6 w-6 p-0 text-gray-600 hover:text-gray-700"
                                        title="Cancel"
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      {/* Edit Button */}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleStartEdit(urlItem)}
                                        className="h-6 w-6 p-0"
                                        title="Edit"
                                      >
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                      
                                      {/* Action Buttons */}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleCopyUrl(urlItem.url)}
                                        className="h-6 w-6 p-0"
                                        title="Copy URL"
                                      >
                                        <Copy className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleOpenUrl(urlItem.url)}
                                        className="h-6 w-6 p-0"
                                        title="Open URL"
                                      >
                                        <ExternalLink className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteUrl(urlItem.id)}
                                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                        title="Delete"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 