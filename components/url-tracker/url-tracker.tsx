"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Copy, ExternalLink, Trash2, Star, Navigation, BookOpen, User, Hash, Search } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface DailyUrl {
  id: number
  url: string
  date: string
  type: 'url' | 'better_link'
  tag: 'nav' | 'blog' | 'profile' | 'other'
  comment?: string
  created_at: string
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
  const [isLoading, setIsLoading] = useState(false)
  const [checkingUrls, setCheckingUrls] = useState<Set<number>>(new Set())
  const [checkedResults, setCheckedResults] = useState<Map<number, { projectCount: number; backlinkCount: number }>>(new Map())
  const [isBatchChecking, setIsBatchChecking] = useState(false)
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
                          <TableRow>
                            <TableHead style={{ width: '50%' }}>URL</TableHead>
                            <TableHead style={{ width: '30%' }}>Comment</TableHead>
                            <TableHead style={{ width: '20%' }}>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tagUrls.map((urlItem) => (
                            <TableRow key={urlItem.id}>
                              <TableCell>
                                <div className="space-y-1">
                                  <p className="text-sm font-mono break-all" title={urlItem.url}>
                                    {urlItem.url}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {urlItem.date}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                {urlItem.comment ? (
                                  <p className="text-sm text-muted-foreground break-words">
                                    {urlItem.comment}
                                  </p>
                                ) : (
                                  <span className="text-sm text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {/* Check Backlinks */}
                                  {checkedResults.has(urlItem.id) ? (
                                    <Badge variant="secondary" className="text-xs">
                                      {checkedResults.get(urlItem.id)?.backlinkCount || 0} backlinks
                                    </Badge>
                                  ) : (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleCheckBacklinks(urlItem.id, urlItem.url)}
                                      disabled={checkingUrls.has(urlItem.id)}
                                      className="h-8 px-2"
                                    >
                                      {checkingUrls.has(urlItem.id) ? (
                                        <div className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                                      ) : (
                                        <Search className="h-3 w-3" />
                                      )}
                                    </Button>
                                  )}
                                  
                                  {/* Action Buttons */}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCopyUrl(urlItem.url)}
                                    className="h-8 w-8 p-0"
                                    title="Copy URL"
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleOpenUrl(urlItem.url)}
                                    className="h-8 w-8 p-0"
                                    title="Open URL"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteUrl(urlItem.id)}
                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                    title="Delete"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
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