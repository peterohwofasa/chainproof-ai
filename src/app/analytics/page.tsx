'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Users, 
  Shield, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  BarChart3,
  PieChart,
  Download,
  Calendar,
  Filter
} from 'lucide-react'
import { toast } from 'sonner'

interface AnalyticsData {
  overview: {
    totalAudits: number
    completedAudits: number
    averageScore: number
    criticalIssues: number
    auditGrowth: number
    userGrowth: number
  }
  trends: {
    daily: Array<{
      date: string
      audits: number
      averageScore: number
    }>
    weekly: Array<{
      week: string
      audits: number
      averageScore: number
    }>
    monthly: Array<{
      month: string
      audits: number
      averageScore: number
    }>
  }
  vulnerabilities: {
    bySeverity: Array<{
      severity: string
      count: number
      percentage: number
    }>
    byCategory: Array<{
      category: string
      count: number
      percentage: number
    }>
    trends: Array<{
      date: string
      critical: number
      high: number
      medium: number
      low: number
    }>
  }
  performance: {
    averageAuditTime: number
    successRate: number
    errorRate: number
    queueLength: number
  }
  users: {
    total: number
    active: number
    new: number
    retention: number
    byPlan: Array<{
      plan: string
      count: number
      percentage: number
    }>
  }
}

export default function AnalyticsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [selectedTab, setSelectedTab] = useState('overview')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchAnalytics()
    }
  }, [session, timeRange])

  const fetchAnalytics = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/analytics?timeRange=${timeRange}`)
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      } else {
        throw new Error('Failed to fetch analytics')
      }
    } catch (error) {
      toast.error('Failed to load analytics data')
    } finally {
      setIsLoading(false)
    }
  }

  const exportAnalytics = async () => {
    try {
      const response = await fetch(`/api/analytics/export?timeRange=${timeRange}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('Analytics exported successfully!')
      } else {
        throw new Error('Failed to export analytics')
      }
    } catch (error) {
      toast.error('Failed to export analytics')
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'text-red-600 dark:text-red-400'
      case 'HIGH': return 'text-orange-600 dark:text-orange-400'
      case 'MEDIUM': return 'text-yellow-600 dark:text-yellow-400'
      case 'LOW': return 'text-green-600 dark:text-green-400'
      default: return 'text-gray-600 dark:text-gray-400'
    }
  }

  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="w-4 h-4 text-green-500" />
    if (value < 0) return <TrendingDown className="w-4 h-4 text-red-500" />
    return <Activity className="w-4 h-4 text-gray-500" />
  }

  const getTrendColor = (value: number) => {
    if (value > 0) return 'text-green-600'
    if (value < 0) return 'text-red-600'
    return 'text-gray-600'
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
              Analytics Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Monitor platform performance and user engagement metrics
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportAnalytics}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {analytics ? (
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="audits">Audits</TabsTrigger>
              <TabsTrigger value="vulnerabilities">Vulnerabilities</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Total Audits
                        </p>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {analytics.overview.totalAudits}
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          {getTrendIcon(analytics.overview.auditGrowth)}
                          <span className={getTrendColor(analytics.overview.auditGrowth)}>
                            {analytics.overview.auditGrowth > 0 ? '+' : ''}{analytics.overview.auditGrowth}%
                          </span>
                        </div>
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
                          Completed Audits
                        </p>
                        <div className="text-2xl font-bold text-green-600">
                          {analytics.overview.completedAudits}
                        </div>
                        <div className="text-sm text-gray-500">
                          {((analytics.overview.completedAudits / analytics.overview.totalAudits) * 100).toFixed(1)}% completion rate
                        </div>
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
                        <div className="text-2xl font-bold text-blue-600">
                          {analytics.overview.averageScore.toFixed(1)}
                        </div>
                        <div className="text-sm text-gray-500">Out of 100</div>
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
                        <div className="text-2xl font-bold text-red-600">
                          {analytics.overview.criticalIssues}
                        </div>
                        <div className="text-sm text-gray-500">Found this period</div>
                      </div>
                      <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Audit Trends
                    </CardTitle>
                    <CardDescription>
                      Number of audits over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                        <p>Chart visualization would go here</p>
                        <p className="text-sm">Data available for integration</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="w-5 h-5" />
                      Vulnerability Distribution
                    </CardTitle>
                    <CardDescription>
                      Breakdown by severity level
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.vulnerabilities.bySeverity.map((vuln) => (
                        <div key={vuln.severity} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className={`font-medium ${getSeverityColor(vuln.severity)}`}>
                              {vuln.severity}
                            </span>
                            <span className="text-sm text-gray-500">
                              {vuln.count} ({vuln.percentage}%)
                            </span>
                          </div>
                          <Progress value={vuln.percentage} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="audits" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Audit Performance</CardTitle>
                    <CardDescription>
                      Key metrics about audit execution
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Average Audit Time</span>
                        <span className="text-sm text-gray-500">
                          {analytics.performance.averageAuditTime}s
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Success Rate</span>
                        <span className="text-sm text-green-600">
                          {analytics.performance.successRate}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Error Rate</span>
                        <span className="text-sm text-red-600">
                          {analytics.performance.errorRate}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Queue Length</span>
                        <span className="text-sm text-blue-600">
                          {analytics.performance.queueLength}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Daily Audit Volume</CardTitle>
                    <CardDescription>
                      Number of audits per day
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                        <p>Daily audit volume chart</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="vulnerabilities" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Vulnerability Trends</CardTitle>
                    <CardDescription>
                      Vulnerability discovery over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <TrendingUp className="w-12 h-12 mx-auto mb-2" />
                        <p>Vulnerability trends chart</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Categories</CardTitle>
                    <CardDescription>
                      Vulnerabilities by category
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.vulnerabilities.byCategory.map((category) => (
                        <div key={category.category} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              {category.category}
                            </span>
                            <span className="text-sm text-gray-500">
                              {category.count} ({category.percentage}%)
                            </span>
                          </div>
                          <Progress value={category.percentage} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Performance</CardTitle>
                  <CardDescription>
                    Real-time system metrics and performance indicators
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {analytics.performance.averageAuditTime}s
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Avg. Audit Time
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {analytics.performance.successRate}%
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Success Rate
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {analytics.performance.errorRate}%
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Error Rate
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {analytics.performance.queueLength}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Queue Length
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>User Metrics</CardTitle>
                    <CardDescription>
                      User engagement and retention statistics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Total Users</span>
                        <span className="text-sm text-gray-500">
                          {analytics.users.total}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Active Users</span>
                        <span className="text-sm text-green-600">
                          {analytics.users.active}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">New Users</span>
                        <span className="text-sm text-blue-600">
                          {analytics.users.new}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Retention Rate</span>
                        <span className="text-sm text-purple-600">
                          {analytics.users.retention}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Users by Plan</CardTitle>
                    <CardDescription>
                      Distribution of users across subscription plans
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.users.byPlan.map((plan) => (
                        <div key={plan.plan} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              {plan.plan}
                            </span>
                            <span className="text-sm text-gray-500">
                              {plan.count} ({plan.percentage}%)
                            </span>
                          </div>
                          <Progress value={plan.percentage} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-12">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
              <div className="h-64 bg-gray-200 rounded mx-auto"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}