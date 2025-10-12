'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BookOpen, BarChart, Shield, Clock, Users, FileText, Settings, Search, ArrowRight, Activity, TrendingUp, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default function DashboardOverview() {
  const dashboardFeatures = [
    {
      icon: <BarChart className="w-6 h-6" />,
      title: "Audit Analytics",
      description: "Visualize your audit history, trends, and security improvements over time."
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Security Dashboard",
      description: "Monitor your contract security status and vulnerability trends."
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: "Report Management",
      description: "Access, organize, and compare all your audit reports in one place."
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Team Collaboration",
      description: "Share reports and collaborate with team members on security fixes."
    },
    {
      icon: <Settings className="w-6 h-6" />,
      title: "API Management",
      description: "Manage API keys, webhooks, and integration settings."
    },
    {
      icon: <Activity className="w-6 h-6" />,
      title: "Real-time Monitoring",
      description: "Get instant notifications about audit completions and security alerts."
    }
  ]

  const navigationSections = [
    {
      title: "Main Navigation",
      items: [
        { name: "Dashboard", icon: <BarChart className="w-4 h-4" />, description: "Overview and analytics" },
        { name: "Audits", icon: <Shield className="w-4 h-4" />, description: "View all audit reports" },
        { name: "New Audit", icon: <FileText className="w-4 h-4" />, description: "Start a new audit" },
        { name: "API", icon: <Settings className="w-4 h-4" />, description: "API configuration" }
      ]
    },
    {
      title: "Quick Actions",
      items: [
        { name: "Quick Audit", icon: <Shield className="w-4 h-4" />, description: "Fast contract analysis" },
        { name: "Batch Audit", icon: <FileText className="w-4 h-4" />, description: "Multiple contracts" },
        { name: "API Docs", icon: <BookOpen className="w-4 h-4" />, description: "Developer resources" },
        { name: "Support", icon: <Users className="w-4 h-4" />, description: "Get help" }
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <BarChart className="w-8 h-8 text-purple-600 mr-2" />
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                Dashboard Overview
              </h1>
            </div>
            <div className="flex items-center justify-center space-x-4 mb-6">
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                Beginner
              </Badge>
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="w-4 h-4 mr-1" />
                6 min read
              </div>
            </div>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Tour of the ChainProof dashboard and its features
            </p>
          </div>

          {/* Dashboard Introduction */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart className="w-5 h-5 mr-2 text-purple-600" />
                Welcome to Your Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-300">
                  The ChainProof dashboard is your central hub for managing smart contract security audits. 
                  It provides comprehensive insights into your security posture, audit history, and team collaboration tools.
                </p>
                
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 p-4 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <TrendingUp className="w-5 h-5 text-purple-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-purple-800 dark:text-purple-200">Key Benefits</h4>
                      <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                        Track security improvements over time, manage team access, and integrate with your development workflow.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Dashboard Layout */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2 text-blue-600" />
                Dashboard Layout
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Main Sections</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <h5 className="font-medium mb-2 flex items-center">
                        <BarChart className="w-4 h-4 mr-2" />
                        Overview Panel
                      </h5>
                      <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <li>• Total audits completed</li>
                        <li>• Average risk score trend</li>
                        <li>• Recent audit activity</li>
                        <li>• Security improvement metrics</li>
                      </ul>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <h5 className="font-medium mb-2 flex items-center">
                        <Activity className="w-4 h-4 mr-2" />
                        Recent Activity
                      </h5>
                      <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <li>• Latest audit results</li>
                        <li>• Team member actions</li>
                        <li>• API usage statistics</li>
                        <li>• Security alerts</li>
                      </ul>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <h5 className="font-medium mb-2 flex items-center">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Analytics Charts
                      </h5>
                      <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <li>• Risk score evolution</li>
                        <li>• Vulnerability trends</li>
                        <li>• Audit frequency</li>
                        <li>• Team performance</li>
                      </ul>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <h5 className="font-medium mb-2 flex items-center">
                        <Settings className="w-4 h-4 mr-2" />
                        Quick Actions
                      </h5>
                      <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <li>• Start new audit</li>
                        <li>• View reports</li>
                        <li>• Manage API keys</li>
                        <li>• Team settings</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation Guide */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="w-5 h-5 mr-2 text-green-600" />
                Navigation Guide
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {navigationSections.map((section, index) => (
                  <div key={index}>
                    <h4 className="font-semibold mb-3">{section.title}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {section.items.map((item, i) => (
                        <div key={i} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded text-blue-600 dark:text-blue-400">
                            {item.icon}
                          </div>
                          <div>
                            <h5 className="font-medium text-gray-900 dark:text-white">{item.name}</h5>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Key Features */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2 text-orange-600" />
                Key Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {dashboardFeatures.map((feature, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg text-orange-600 dark:text-orange-400">
                          {feature.icon}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            {feature.title}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-300">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Getting Around */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2 text-blue-600" />
                Getting Around the Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Sidebar Navigation</h4>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    The left sidebar provides quick access to all major sections:
                  </p>
                  
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <span className="text-sm"><strong>Dashboard:</strong> Main overview and analytics</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      <span className="text-sm"><strong>Audits:</strong> Complete audit history and reports</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                      <span className="text-sm"><strong>API:</strong> Developer tools and integration</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                      <span className="text-sm"><strong>Team:</strong> User management and collaboration</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                      <span className="text-sm"><strong>Settings:</strong> Account and billing configuration</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Top Navigation Bar</h4>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    The top bar includes search, notifications, and user account options:
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded text-center">
                      <Search className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                      <h5 className="font-medium text-sm">Search</h5>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Find audits and reports</p>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded text-center">
                      <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                      <h5 className="font-medium text-sm">Notifications</h5>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Security alerts and updates</p>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded text-center">
                      <Users className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                      <h5 className="font-medium text-sm">Account</h5>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Profile and billing</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tips and Tricks */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Pro Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                  <div>
                    <h5 className="font-medium">Use Keyboard Shortcuts</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Press <kbd className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-xs">Ctrl+K</kbd> to quickly search for audits.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                  <div>
                    <h5 className="font-medium">Customize Your Dashboard</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Drag and drop widgets to arrange your dashboard layout according to your preferences.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                  <div>
                    <h5 className="font-medium">Set Up Alerts</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Configure email and webhook notifications for audit completions and critical findings.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</div>
                  <div>
                    <h5 className="font-medium">Export Reports</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Download audit reports in PDF or JSON format for sharing and documentation.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle>Ready to Explore?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button asChild>
                  <Link href="/dashboard">
                    Go to Dashboard
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                
                <Button variant="outline" asChild>
                  <Link href="/docs/api/authentication">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Learn About API
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}