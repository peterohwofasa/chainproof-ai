'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BookOpen, Clock, ChevronRight, Search, Menu, X } from 'lucide-react'
import { Input } from '@/components/ui/input'

export default function Documentation() {
  const [searchTerm, setSearchTerm] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const gettingStartedDocs = [
    {
      id: 'introduction',
      title: 'Introduction to ChainProof',
      description: 'Overview of ChainProof and its AI-powered smart contract auditing capabilities.',
      level: 'Beginner',
      readTime: '5 min read',
      href: '/docs/getting-started/introduction',
      icon: <BookOpen className="w-5 h-5" />
    },
    {
      id: 'quick-start',
      title: 'Quick Start Guide',
      description: 'Get up and running with ChainProof in just a few minutes.',
      level: 'Beginner',
      readTime: '10 min read',
      href: '/docs/getting-started/quick-start',
      icon: <BookOpen className="w-5 h-5" />
    },
    {
      id: 'understanding-reports',
      title: 'Understanding Audit Reports',
      description: 'Learn how to interpret and act on audit findings.',
      level: 'Beginner',
      readTime: '8 min read',
      href: '/docs/getting-started/understanding-reports',
      icon: <BookOpen className="w-5 h-5" />
    },
    {
      id: 'dashboard-overview',
      title: 'Dashboard Overview',
      description: 'Tour of the ChainProof dashboard and its features.',
      level: 'Beginner',
      readTime: '6 min read',
      href: '/docs/getting-started/dashboard-overview',
      icon: <BookOpen className="w-5 h-5" />
    }
  ]

  const apiDocs = [
    {
      id: 'api-authentication',
      title: 'API Authentication',
      description: 'How to authenticate with the ChainProof API.',
      level: 'Intermediate',
      readTime: '5 min read',
      href: '/docs/api/authentication',
      icon: <BookOpen className="w-5 h-5" />
    },
    {
      id: 'submit-audit',
      title: 'Submit Audit Request',
      description: 'Submit smart contracts for auditing via API.',
      level: 'Intermediate',
      readTime: '10 min read',
      href: '/docs/api/submit-audit',
      icon: <BookOpen className="w-5 h-5" />
    },
    {
      id: 'retrieve-results',
      title: 'Retrieve Audit Results',
      description: 'Fetch and process audit results programmatically.',
      level: 'Intermediate',
      readTime: '8 min read',
      href: '/docs/api/retrieve-results',
      icon: <BookOpen className="w-5 h-5" />
    },
    {
      id: 'webhooks',
      title: 'Webhooks Integration',
      description: 'Set up webhooks to receive real-time audit notifications.',
      level: 'Advanced',
      readTime: '12 min read',
      href: '/docs/api/webhooks',
      icon: <BookOpen className="w-5 h-5" />
    },
    {
      id: 'rate-limits',
      title: 'Rate Limits & Quotas',
      description: 'Understanding API rate limits and usage quotas.',
      level: 'Intermediate',
      readTime: '5 min read',
      href: '/docs/api/rate-limits',
      icon: <BookOpen className="w-5 h-5" />
    }
  ]

  const allDocs = [...gettingStartedDocs, ...apiDocs]

  const filteredDocs = allDocs.filter(doc =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      case 'Intermediate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
      case 'Advanced':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-blue-600 mr-2" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Documentation
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Comprehensive guides to help you get the most out of ChainProof AI
          </p>
        </div>

        {/* Search */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search documentation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 text-lg"
            />
          </div>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden mb-6">
          <Button
            variant="outline"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-full justify-between"
          >
            <span>Navigation</span>
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className={`${mobileMenuOpen ? 'block' : 'hidden'} md:block lg:col-span-1`}>
            <nav className="sticky top-8 space-y-8">
              {/* Getting Started */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Getting Started
                </h3>
                <ul className="space-y-2">
                  {gettingStartedDocs.map((doc) => (
                    <li key={doc.id}>
                      <Link
                        href={doc.href}
                        className="block p-3 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                      >
                        <div className="font-medium">{doc.title}</div>
                        <div className="flex items-center mt-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3 mr-1" />
                          {doc.readTime}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* API Documentation */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <BookOpen className="w-4 h-4 mr-2" />
                  API Documentation
                </h3>
                <ul className="space-y-2">
                  {apiDocs.map((doc) => (
                    <li key={doc.id}>
                      <Link
                        href={doc.href}
                        className="block p-3 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                      >
                        <div className="font-medium">{doc.title}</div>
                        <div className="flex items-center mt-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3 mr-1" />
                          {doc.readTime}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {searchTerm && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Search Results ({filteredDocs.length})
                </h2>
              </div>
            )}

            {/* Getting Started Section */}
            {!searchTerm && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Getting Started
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-8">
                  Learn the basics of ChainProof and how to get started with smart contract auditing.
                </p>
                <div className="grid gap-6">
                  {gettingStartedDocs.map((doc) => (
                    <Card key={doc.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                              {doc.icon}
                            </div>
                            <div>
                              <CardTitle className="text-lg">{doc.title}</CardTitle>
                              <div className="flex items-center space-x-2 mt-2">
                                <Badge className={getLevelColor(doc.level)}>
                                  {doc.level}
                                </Badge>
                                <div className="flex items-center text-sm text-gray-500">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {doc.readTime}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                          {doc.description}
                        </p>
                        <Button asChild className="group">
                          <Link href={doc.href}>
                            Read More
                            <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* API Documentation Section */}
            {!searchTerm && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  API Documentation
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-8">
                  Complete API reference for integrating ChainProof into your workflow.
                </p>
                <div className="grid gap-6">
                  {apiDocs.map((doc) => (
                    <Card key={doc.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg text-green-600 dark:text-green-400">
                              {doc.icon}
                            </div>
                            <div>
                              <CardTitle className="text-lg">{doc.title}</CardTitle>
                              <div className="flex items-center space-x-2 mt-2">
                                <Badge className={getLevelColor(doc.level)}>
                                  {doc.level}
                                </Badge>
                                <div className="flex items-center text-sm text-gray-500">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {doc.readTime}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                          {doc.description}
                        </p>
                        <Button asChild className="group">
                          <Link href={doc.href}>
                            Read More
                            <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Search Results */}
            {searchTerm && (
              <div className="grid gap-6">
                {filteredDocs.map((doc) => (
                  <Card key={doc.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                            {doc.icon}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{doc.title}</CardTitle>
                            <div className="flex items-center space-x-2 mt-2">
                              <Badge className={getLevelColor(doc.level)}>
                                {doc.level}
                              </Badge>
                              <div className="flex items-center text-sm text-gray-500">
                                <Clock className="w-3 h-3 mr-1" />
                                {doc.readTime}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 dark:text-gray-300 mb-4">
                        {doc.description}
                      </p>
                      <Button asChild className="group">
                        <Link href={doc.href}>
                          Read More
                          <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}