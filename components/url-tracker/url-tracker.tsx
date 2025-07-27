"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Copy, ExternalLink, Trash2, Plus, Calendar, Link, Star, Navigation, BookOpen, User, Hash, Search } from 'lucide-react'
import { format } from 'date-fns'

interface DailyUrl {
  id: number
  url: string
  date: string
  type: 'url' | 'better_link'
  tag: 'nav' | 'blog' | 'profile' | 'other'
  comment?: string
  created_at: string
}

interface DailyStats {
  date: string
  count: number
}

// 标签配置
const TAG_CONFIG = {
  nav: { label: 'Navigation', icon: Navigation, color: 'bg-blue-100 text-blue-800' },
  blog: { label: 'Blog', icon: BookOpen, color: 'bg-green-100 text-green-800' },
  profile: { label: 'Profile', icon: User, color: 'bg-purple-100 text-purple-800' },
  other: { label: 'Other', icon: Hash, color: 'bg-gray-100 text-gray-800' }
} as const

export default function UrlTracker() {
  const [urls, setUrls] = useState<DailyUrl[]>([])
  const [stats, setStats] = useState<DailyStats[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedTag, setSelectedTag] = useState<'nav' | 'blog' | 'profile' | 'other'>('nav')
  const [currentMode, setCurrentMode] = useState<'url' | 'better_link'>('url')
  const [isLoading, setIsLoading] = useState(false)
  const [checkingUrls, setCheckingUrls] = useState<Set<number>>(new Set())
  const [checkedResults, setCheckedResults] = useState<Map<number, { projectCount: number; backlinkCount: number }>>(new Map())
  const [isBatchChecking, setIsBatchChecking] = useState(false)
  const [batchUrls, setBatchUrls] = useState('')
  const [batchComment, setBatchComment] = useState('')
  const [isBatchSubmitting, setIsBatchSubmitting] = useState(false)
  const { toast } = useToast()

  // Load URL list
  const loadUrls = async (date?: string, type?: 'url' | 'better_link') => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (date) params.append('date', date)
      if (type) params.append('type', type)
      const queryString = params.toString()
      const response = await fetch(`/api/daily-urls${queryString ? `?${queryString}` : ''}`)
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
        description: "Unable to load URL list",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Load statistics
  const loadStats = async (type?: 'url' | 'better_link') => {
    try {
      const params = type ? `?type=${type}` : ''
      const response = await fetch(`/api/daily-urls/stats${params}`)
      const result = await response.json()
      
      if (result.success) {
        setStats(result.data || [])
      }
    } catch (error) {
      console.error('Failed to load statistics:', error)
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
          description: "URL has been deleted",
        })
        // Reload data
        await Promise.all([loadUrls(undefined, currentMode), loadStats(currentMode)])
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
        description: "Unable to delete URL",
        variant: "destructive",
      })
    }
  }

  // Check backlinks for better link
  const handleCheckBacklinks = async (urlItem: DailyUrl) => {
    if (urlItem.type !== 'better_link') return

    setCheckingUrls(prev => new Set(prev).add(urlItem.id))
    
    try {
      const response = await fetch('/api/daily-urls/check-backlinks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: urlItem.url
        }),
      })
      
      const result = await response.json()
      
      if (result.success) {
        setCheckedResults(prev => new Map(prev).set(urlItem.id, {
          projectCount: result.data.projectCount,
          backlinkCount: result.data.backlinkCount
        }))
        toast({
          title: "Check Complete",
          description: `Found ${result.data.projectCount} projects with ${result.data.backlinkCount} backlinks`,
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
        newSet.delete(urlItem.id)
        return newSet
      })
    }
  }

  // Batch check all better links
  const handleBatchCheckBacklinks = async () => {
    const betterLinks = urls.filter(url => url.type === 'better_link')
    if (betterLinks.length === 0) {
      toast({
        title: "No Better Links",
        description: "No better links found to check",
        variant: "destructive",
      })
      return
    }

    setIsBatchChecking(true)
    let successCount = 0
    let totalProjects = 0

    try {
      for (const urlItem of betterLinks) {
        // Skip if already checked
        if (checkedResults.has(urlItem.id)) {
          continue
        }

        setCheckingUrls(prev => new Set(prev).add(urlItem.id))
        
        try {
          const response = await fetch('/api/daily-urls/check-backlinks', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: urlItem.url
            }),
          })
          
          const result = await response.json()
          
          if (result.success) {
            setCheckedResults(prev => new Map(prev).set(urlItem.id, {
              projectCount: result.data.projectCount,
              backlinkCount: result.data.backlinkCount
            }))
            successCount++
            totalProjects += result.data.projectCount
          }
        } catch (error) {
          console.error(`Failed to check ${urlItem.url}:`, error)
        } finally {
          setCheckingUrls(prev => {
            const newSet = new Set(prev)
            newSet.delete(urlItem.id)
            return newSet
          })
        }

        // Add small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      toast({
        title: "Batch Check Complete",
        description: `Checked ${successCount} better links, found ${totalProjects} total project connections`,
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

  // Batch add URLs
  const handleBatchAddUrls = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!batchUrls.trim()) {
      toast({
        title: "Please enter URLs",
        description: "Batch URLs cannot be empty",
        variant: "destructive",
      })
      return
    }

    const urls = batchUrls
      .split('\n')
      .map(url => url.trim())
      .filter(url => url.length > 0)

    if (urls.length === 0) {
      toast({
        title: "No valid URLs found",
        description: "Please enter at least one valid URL",
        variant: "destructive",
      })
      return
    }

    setIsBatchSubmitting(true)
    let successCount = 0
    let errorCount = 0
    const errors: string[] = []

    try {
      for (const url of urls) {
        // Validate URL format
        try {
          new URL(url)
        } catch {
          errors.push(`Invalid URL format: ${url}`)
          errorCount++
          continue
        }

        try {
          const response = await fetch('/api/daily-urls', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: url,
              date: selectedDate,
              type: currentMode,
              tag: selectedTag,
              comment: batchComment || undefined
            }),
          })
          
          const result = await response.json()
          
          if (result.success) {
            successCount++
          } else {
            errors.push(`Failed to add ${url}: ${result.message}`)
            errorCount++
          }
        } catch (error) {
          errors.push(`Network error for ${url}`)
          errorCount++
        }

        // Add small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // Show results
      if (successCount > 0) {
        toast({
          title: "Batch Add Complete",
          description: `Successfully added ${successCount} URLs${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
        })
        
        // Clear form and reload data
        setBatchUrls('')
        setBatchComment('') // Clear comment after batch add
        await Promise.all([loadUrls(undefined, currentMode), loadStats(currentMode)])
      }

      if (errors.length > 0 && successCount === 0) {
        toast({
          title: "Batch Add Failed",
          description: `All ${errorCount} URLs failed to add`,
          variant: "destructive",
        })
      }

    } catch (error) {
      toast({
        title: "Batch Add Failed",
        description: "Unable to process batch URLs",
        variant: "destructive",
      })
    } finally {
      setIsBatchSubmitting(false)
    }
  }



  // Initialize loading
  useEffect(() => {
    loadUrls(undefined, currentMode)
    loadStats(currentMode)
  }, [currentMode])

  // Group URLs by tag
  const groupedUrls = urls.reduce((groups, url) => {
    const tag = url.tag || 'other'
    if (!groups[tag]) {
      groups[tag] = []
    }
    groups[tag].push(url)
    return groups
  }, {} as Record<string, DailyUrl[]>)

  // Get today's stats
  const today = new Date().toISOString().split('T')[0]
  const todayStats = stats.find(stat => stat.date === today)
  const todayCount = todayStats ? todayStats.count : 0

  return (
    <div className="space-y-6">
      {/* Page title and mode toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">URL Tracker</h1>
          <p className="text-muted-foreground">
            {currentMode === 'url' ? 'Record and manage daily submitted URLs' : 'Manage high-quality backlink sources'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant={currentMode === 'url' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentMode('url')}
            >
              <Link className="h-4 w-4 mr-2" />
              Add URL
            </Button>
            <Button
              variant={currentMode === 'better_link' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentMode('better_link')}
            >
              <Star className="h-4 w-4 mr-2" />
              Better Link
            </Button>
          </div>
        </div>
      </div>

      {/* Batch Add URLs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Add URLs</CardTitle>
              <CardDescription>
                Add multiple URLs at once, one URL per line
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleBatchAddUrls} className="space-y-4">
            <div className="flex gap-4 items-end">
              <div className="w-32">
                <label className="text-sm font-medium">Tag</label>
                <Select value={selectedTag} onValueChange={(value: 'nav' | 'blog' | 'profile' | 'other') => setSelectedTag(value)}>
                  <SelectTrigger disabled={isBatchSubmitting}>
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
              <div className="w-40">
                <label className="text-sm font-medium">Date</label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  disabled={isBatchSubmitting}
                />
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium">URLs (one per line)</label>
                <Textarea
                  placeholder={`https://example1.com\nhttps://example2.com\nhttps://example3.com`}
                  value={batchUrls}
                  onChange={(e) => setBatchUrls(e.target.value)}
                  disabled={isBatchSubmitting}
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium">Comment (optional)</label>
                <Textarea
                  placeholder="Optional comment for all URLs..."
                  value={batchComment}
                  onChange={(e) => setBatchComment(e.target.value)}
                  disabled={isBatchSubmitting}
                  rows={6}
                  className="text-sm"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button type="submit" disabled={isBatchSubmitting}>
                <Plus className="h-4 w-4 mr-2" />
                {isBatchSubmitting ? 'Adding...' : `Add ${currentMode === 'url' ? 'URLs' : 'Better Links'}`}
              </Button>
              {batchUrls && (
                <span className="text-sm text-muted-foreground">
                  {batchUrls.split('\n').filter(url => url.trim().length > 0).length} URLs ready to add
                </span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* URL list */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {currentMode === 'url' ? 'URL List' : 'Better Links List'}
              </CardTitle>
              <CardDescription>
                {currentMode === 'url' ? 'All URL records' : 'All better link records'} ({urls.length} items)
              </CardDescription>
            </div>
            {currentMode === 'better_link' && urls.some(url => url.type === 'better_link') && (
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
                    Check All Better Links
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : urls.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {currentMode === 'url' ? 'No URL records found' : 'No better link records found'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedUrls).map(([tag, tagUrls]) => {
                const tagConfig = TAG_CONFIG[tag as keyof typeof TAG_CONFIG]
                const IconComponent = tagConfig?.icon || Hash
                
                return (
                  <div key={tag} className="space-y-1">
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
                    {/* URL列表 */}
                    <div className="space-y-1">
                      {tagUrls.map((urlItem) => (
                        <div
                          key={urlItem.id}
                          className="flex items-center gap-3 py-2 px-3 hover:bg-muted/50 rounded-sm group"
                        >
                          <div className="flex-1 min-w-0 grid grid-cols-[auto_2fr_1fr_auto] gap-3 items-center">
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {urlItem.date}
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-mono truncate" title={urlItem.url}>
                                {urlItem.url}
                              </p>
                            </div>
                            <div className="min-w-0">
                              {urlItem.comment ? (
                                <p className="text-xs text-muted-foreground truncate" title={urlItem.comment}>
                                  {urlItem.comment}
                                </p>
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {urlItem.type === 'better_link' && (
                                <Star className="h-3 w-3 text-yellow-500" />
                              )}
                              {urlItem.type === 'better_link' && checkedResults.has(urlItem.id) && (
                                <div className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs">
                                  <span>✓</span>
                                  <span>{checkedResults.get(urlItem.id)?.projectCount}</span>
                                </div>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(urlItem.created_at), 'HH:mm')}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {urlItem.type === 'better_link' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleCheckBacklinks(urlItem)
                                }}
                                disabled={checkingUrls.has(urlItem.id)}
                                title="Check backlinks"
                                type="button"
                              >
                                {checkingUrls.has(urlItem.id) ? (
                                  <div className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                                ) : (
                                  <Search className="h-3 w-3" />
                                )}
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleCopyUrl(urlItem.url)
                              }}
                              title="Copy URL"
                              type="button"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleOpenUrl(urlItem.url)
                              }}
                              title="Open URL"
                              type="button"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleDeleteUrl(urlItem.id)
                              }}
                              title="Delete URL"
                              type="button"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
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