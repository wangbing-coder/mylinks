'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, ExternalLink, Filter, Download, ArrowLeft, ArrowUpDown, ArrowUp, ArrowDown, Copy } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"

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

interface DataDisplayProps {
  backlinks: Backlink[]
  isLoading?: boolean
  projectName?: string
  onBack?: () => void
}

export default function DataDisplay({ backlinks, isLoading = false, projectName, onBack }: DataDisplayProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [authorityFilter, setAuthorityFilter] = useState('all')
  const [followFilter, setFollowFilter] = useState('all')
  const [sortField, setSortField] = useState<keyof Backlink>('page_ascore')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const { toast } = useToast()

  // Handle copy to clipboard
  const handleCopyUrl = async (url: string, type: 'source' | 'target') => {
    try {
      await navigator.clipboard.writeText(url)
      toast({
        title: "Copied!",
        description: `${type === 'source' ? 'Source' : 'Target'} URL copied to clipboard`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy URL to clipboard",
        variant: "destructive",
      })
    }
  }

  // Handle sorting
  const handleSort = (field: keyof Backlink) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  // Get sort icon
  const getSortIcon = (field: keyof Backlink) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4" />
    }
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
  }

  // Filter and sort backlinks data
  const filteredAndSortedBacklinks = backlinks
    .filter(backlink => {
    const matchesSearch = 
      backlink.source_domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
      backlink.source_url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      backlink.target_url.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesAuthority = 
      authorityFilter === 'all' ||
      (authorityFilter === 'high' && backlink.page_ascore >= 70) ||
      (authorityFilter === 'medium' && backlink.page_ascore >= 40 && backlink.page_ascore < 70) ||
      (authorityFilter === 'low' && backlink.page_ascore < 40)
    
    const matchesFollow = 
      followFilter === 'all' ||
      (followFilter === 'follow' && !backlink.is_nofollow) ||
      (followFilter === 'nofollow' && backlink.is_nofollow)

      return matchesSearch && matchesAuthority && matchesFollow
    })
    .sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue)
        return sortDirection === 'asc' ? comparison : -comparison
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        const comparison = aValue - bValue
        return sortDirection === 'asc' ? comparison : -comparison
      }
      
      if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
        const comparison = Number(aValue) - Number(bValue)
        return sortDirection === 'asc' ? comparison : -comparison
      }
      
      return 0
    })

  const exportToCSV = (data: Backlink[], filename: string) => {
    if (data.length === 0) return
    
    const headers = [
      'Source Domain', 'Page Authority', 'Follow Status', 'External Links', 
      'First Seen', 'Source URL', 'Target URL', 'Last Seen'
    ]
    
    const csvContent = [
      headers.join(','),
      ...data.map(row => [
        `"${row.source_domain}"`,
        row.page_ascore,
        row.is_nofollow ? 'NoFollow' : 'Follow',
        row.external_links,
        `"${row.first_seen}"`,
        `"${row.source_url}"`,
        `"${row.target_url}"`,
        `"${row.last_seen}"`
      ].join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (isLoading) {
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

  if (backlinks.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">No data available</p>
            <p className="text-sm text-muted-foreground">Please upload a CSV file to start analyzing</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const followLinks = backlinks.filter(b => !b.is_nofollow).length
  const avgAuthority = Math.round(backlinks.reduce((sum, b) => sum + b.page_ascore, 0) / backlinks.length) || 0
  const avgExternalLinks = Math.round(backlinks.reduce((sum, b) => sum + b.external_links, 0) / backlinks.length) || 0

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      {projectName && onBack && (
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Group
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{projectName}</h2>
            <p className="text-muted-foreground">Backlink Data Details</p>
          </div>
        </div>
      )}

      {/* Statistics overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{backlinks.length}</div>
            <p className="text-xs text-muted-foreground">Total Backlinks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{followLinks}</div>
            <p className="text-xs text-muted-foreground">Follow Links</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{avgExternalLinks}</div>
            <p className="text-xs text-muted-foreground">Avg External Links</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{avgAuthority}</div>
            <p className="text-xs text-muted-foreground">Avg Authority Score</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Data Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search domain, source URL, or target URL..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={authorityFilter} onValueChange={setAuthorityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Authority Score" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Scores</SelectItem>
                <SelectItem value="high">High Authority (≥70)</SelectItem>
                <SelectItem value="medium">Medium Authority (40-69)</SelectItem>
                <SelectItem value="low">Low Authority (&lt;40)</SelectItem>
              </SelectContent>
            </Select>
            <Select value={followFilter} onValueChange={setFollowFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Follow Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="follow">Follow</SelectItem>
                <SelectItem value="nofollow">NoFollow</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
                            <CardTitle>Backlinks ({filteredAndSortedBacklinks.length})</CardTitle>
            <Button
              variant="outline"
              size="sm"
                              onClick={() => exportToCSV(filteredAndSortedBacklinks, 'backlinks.csv')}
                disabled={filteredAndSortedBacklinks.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-36">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('source_domain')}
                      className="h-auto p-0 font-semibold hover:bg-transparent text-sm"
                    >
                      Domain {getSortIcon('source_domain')}
                    </Button>
                  </TableHead>
                  <TableHead className="w-20 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('page_ascore')}
                      className="h-auto p-0 font-semibold hover:bg-transparent text-sm"
                    >
                      Authority {getSortIcon('page_ascore')}
                    </Button>
                  </TableHead>
                  <TableHead className="w-20 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('is_nofollow')}
                      className="h-auto p-0 font-semibold hover:bg-transparent text-sm"
                    >
                      Status {getSortIcon('is_nofollow')}
                    </Button>
                  </TableHead>
                  <TableHead className="w-20 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('external_links')}
                      className="h-auto p-0 font-semibold hover:bg-transparent text-sm"
                    >
                      Ext Links {getSortIcon('external_links')}
                    </Button>
                  </TableHead>
                  <TableHead className="w-24">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('first_seen')}
                      className="h-auto p-0 font-semibold hover:bg-transparent text-sm"
                    >
                      First Seen {getSortIcon('first_seen')}
                    </Button>
                  </TableHead>
                  <TableHead className="w-48 max-w-48">
                    <span className="text-sm font-semibold">Source URL</span>
                  </TableHead>
                  <TableHead className="w-40 max-w-40">
                    <span className="text-sm font-semibold">Target URL</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedBacklinks.map((backlink) => (
                  <TableRow key={backlink.id} className="text-sm">
                    <TableCell className="font-medium">
                      <div className="truncate" title={backlink.source_domain}>
                        {backlink.source_domain}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant={
                          backlink.page_ascore >= 70 ? 'default' :
                          backlink.page_ascore >= 40 ? 'secondary' : 'outline'
                        }
                        className="text-xs"
                      >
                        {backlink.page_ascore}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant={backlink.is_nofollow ? 'secondary' : 'default'} 
                        className="text-xs"
                      >
                        {backlink.is_nofollow ? 'NoFollow' : 'Follow'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">{backlink.external_links}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {backlink.first_seen}
                    </TableCell>
                    <TableCell className="w-48 max-w-48">
                      <div className="flex items-center gap-1">
                        <div className="truncate flex-1 text-xs" title={backlink.source_url}>
                          {backlink.source_url}
                        </div>
                        <div className="flex gap-0.5 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyUrl(backlink.source_url, 'source')}
                            className="h-5 w-5 p-0 opacity-70 hover:opacity-100"
                            title="Copy URL"
                          >
                            <Copy className="h-2.5 w-2.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(backlink.source_url, '_blank')}
                            className="h-5 w-5 p-0 opacity-70 hover:opacity-100"
                            title="Open URL"
                          >
                            <ExternalLink className="h-2.5 w-2.5" />
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="w-40 max-w-40">
                      <div className="truncate text-xs text-muted-foreground" title={backlink.target_url}>
                        {backlink.target_url}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 