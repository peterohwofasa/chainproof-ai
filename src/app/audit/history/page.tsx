'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { 
  Search, 
  Filter, 
  Calendar, 
  Download, 
  Eye,
  TrendingUp,
  TrendingDown,
  Activity,
  Shield,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react'
import { toast } from 'sonner'

interface Audit {
  id: string
  contractName: string
  overallScore: number
  riskLevel: string
  status: string
  createdAt: string
  completedAt?: string
  auditDuration?: number
  vulnerabilities: {
    severity: string
    count: number
  }[]
  project?: {
    name: string
  }
}

export default function AuditHistoryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [audits, setAudits] = useState<Audit[]>([])
  const [filteredAudits, setFilteredAudits] = useState<Audit[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterRiskLevel, setFilterRiskLevel] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchAudits()
    }
  }, [session])

  useEffect(() => {
    filterAndSortAudits()
  }, [audits, searchTerm, filterStatus, filterRiskLevel, sortBy, sortOrder])

  const fetchAudits = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/audits')
      if (response.ok) {
        const data = await response.json()
        setAudits(data.audits)
      } else {
        throw new Error('Failed to fetch audits')
      }
    } catch (error) {
      toast.error('Failed to fetch audit history')
    } finally {
      setIsLoading(false)
    }
  }

  const filterAndSortAudits = () => {
    let filtered = [...audits]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(audit =>
        audit.contractName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        audit.project?.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(audit => audit.status === filterStatus)
    }

    // Apply risk level filter
    if (filterRiskLevel !== 'all') {
      filtered = filtered.filter(audit => audit.riskLevel === filterRiskLevel)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy as keyof Audit]
      let bValue: any = b[sortBy as keyof Audit]

      if (sortBy === 'createdAt' || sortBy === 'completedAt') {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredAudits(filtered)
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
      case 'HIGH': return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20'
      case 'MEDIUM': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
      case 'LOW': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      case 'RUNNING': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
      case 'FAILED': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
      case 'CANCELLED': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
      default: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  const exportAuditHistory = async () => {
    try {
      const response = await fetch('/api/audits/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auditIds: filteredAudits.map(a => a.id) })
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `audit-history-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('Audit history exported successfully!')
      } else {
        throw new Error('Failed to export audit history')
      }
    } catch (error) {
      toast.error('Failed to export audit history')
    }
  }

  // Calculate statistics
  const stats = {
    totalAudits: filteredAudits.length,
    completedAudits: filteredAudits.filter(a => a.status === 'COMPLETED').length,
    averageScore: filteredAudits
      .filter(a => a.status === 'COMPLETED' && a.overallScore)
      .reduce((acc, a) => acc + a.overallScore, 0) / 
      filteredAudits.filter(a => a.status === 'COMPLETED' && a.overallScore).length || 0,
    criticalIssues: filteredAudits
      .filter(a => a.status === 'COMPLETED')
      .reduce((acc, a) => acc + (a.vulnerabilities.find(v => v.severity === 'CRITICAL')?.count || 0), 0)
  }

  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Audit History
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Track and analyze your smart contract audit history over time
            </p>
          </div>
          <Button onClick={exportAuditHistory} disabled={filteredAudits.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export History
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Audits
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalAudits}
                  </p>
                </div>
                <Activity className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Completed
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.completedAudits}
                  </p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Average Score
                  </p>
                  <p className={`text-2xl font-bold ${getScoreColor(Math.round(stats.averageScore))}`}>
                    {Math.round(stats.averageScore)}
                  </p>
                </div>
                <Shield className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Critical Issues
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {stats.criticalIssues}
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search contracts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="RUNNING">Running</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterRiskLevel} onValueChange={setFilterRiskLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by risk level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risk Levels</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Date Created</SelectItem>
                  <SelectItem value="completedAt">Date Completed</SelectItem>
                  <SelectItem value="overallScore">Security Score</SelectItem>
                  <SelectItem value="contractName">Contract Name</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Audit Table */}
        <Card>
          <CardHeader>
            <CardTitle>Audit History</CardTitle>
            <CardDescription>
              Showing {filteredAudits.length} of {audits.length} audits
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredAudits.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No audits found
                </h3>
                <p className="text-gray-500 mb-4">
                  {audits.length === 0 
                    ? "You haven't run any audits yet. Start your first audit to see it here."
                    : "Try adjusting your filters to find the audits you're looking for."
                  }
                </p>
                {audits.length === 0 && (
                  <Button onClick={() => router.push('/audit')}>
                    Start Your First Audit
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Contract</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Risk Level</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAudits.map((audit) => (
                      <TableRow key={audit.id}>
                        <TableCell className="font-medium">
                          {audit.contractName}
                        </TableCell>
                        <TableCell>
                          {audit.project?.name || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(audit.status)}>
                            {audit.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {audit.status === 'COMPLETED' && audit.overallScore ? (
                            <div className="flex items-center gap-2">
                              <span className={`font-medium ${getScoreColor(audit.overallScore)}`}>
                                {audit.overallScore}/100
                              </span>
                              <Progress value={audit.overallScore} className="w-12 h-2" />
                            </div>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {audit.status === 'COMPLETED' ? (
                            <Badge className={getRiskLevelColor(audit.riskLevel)}>
                              {audit.riskLevel}
                            </Badge>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">
                              {new Date(audit.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {audit.auditDuration ? (
                            <span className="text-sm">
                              {Math.round(audit.auditDuration / 60)}s
                            </span>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/audit/${audit.id}`)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
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
    </div>
  )
}