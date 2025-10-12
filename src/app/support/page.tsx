import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, Mail, Phone, Clock, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default function Support() {
  const supportChannels = [
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: "Live Chat",
      description: "Get instant help from our support team",
      availability: "24/7",
      responseTime: "< 2 minutes",
      action: "Start Chat",
      href: "#",
      color: "text-green-600"
    },
    {
      icon: <Mail className="w-6 h-6" />,
      title: "Email Support",
      description: "Send detailed questions and documentation",
      availability: "Business hours",
      responseTime: "< 4 hours",
      action: "Send Email",
      href: "mailto:support@chainproof.ai",
      color: "text-blue-600"
    },
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: "Community Discord",
      description: "Get help from our community and team",
      availability: "24/7",
      responseTime: "Varies",
      action: "Join Discord",
      href: "https://discord.gg/chainproof",
      color: "text-purple-600"
    }
  ]

  const commonIssues = [
    {
      title: "API Key Issues",
      description: "Problems with API key generation or authentication",
      solution: "Check your API key in the dashboard and ensure it's properly included in the Authorization header",
      category: "Authentication"
    },
    {
      title: "Audit Timeouts",
      description: "Audits taking longer than expected",
      solution: "Large contracts may take longer. Check the audit status endpoint for progress updates",
      category: "Performance"
    },
    {
      title: "Rate Limiting",
      description: "Receiving 429 error responses",
      solution: "Implement exponential backoff and check your rate limit usage in the dashboard",
      category: "API Usage"
    },
    {
      title: "Webhook Delivery",
      description: "Not receiving webhook notifications",
      solution: "Verify your webhook URL is accessible and check the webhook logs in your dashboard",
      category: "Integration"
    }
  ]

  const resources = [
    {
      title: "Documentation",
      description: "Comprehensive guides and API reference",
      href: "/docs",
      icon: <ExternalLink className="w-4 h-4" />
    },
    {
      title: "Status Page",
      description: "Real-time system status and incident updates",
      href: "/status",
      icon: <ExternalLink className="w-4 h-4" />
    },
    {
      title: "Video Tutorials",
      description: "Step-by-step video guides",
      href: "/tutorials",
      icon: <ExternalLink className="w-4 h-4" />
    },
    {
      title: "Blog",
      description: "Latest features, updates, and best practices",
      href: "/blog",
      icon: <ExternalLink className="w-4 h-4" />
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <MessageCircle className="w-8 h-8 text-blue-600 mr-2" />
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                Support Center
              </h1>
            </div>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Get help from our expert support team and community. We're here to ensure your success with ChainProof AI.
            </p>
          </div>

          {/* Support Channels */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              How Can We Help You?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {supportChannels.map((channel, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className={`flex items-center space-x-3 ${channel.color}`}>
                      {channel.icon}
                      <CardTitle className="text-lg">{channel.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-gray-600 dark:text-gray-300">
                        {channel.description}
                      </p>
                      
                      <div className="space-y-2">
                        <div className="flex items-center text-sm">
                          <Clock className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-400">
                            {channel.availability}
                          </span>
                        </div>
                        <div className="flex items-center text-sm">
                          <CheckCircle className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-400">
                            Response: {channel.responseTime}
                          </span>
                        </div>
                      </div>
                      
                      <Button 
                        className="w-full" 
                        asChild
                        variant={channel.title === "Live Chat" ? "default" : "outline"}
                      >
                        <Link 
                          href={channel.href}
                          target={channel.href.startsWith('http') ? "_blank" : "_self"}
                          rel={channel.href.startsWith('http') ? "noopener noreferrer" : ""}
                        >
                          {channel.action}
                          {channel.href.startsWith('http') && (
                            <ExternalLink className="w-4 h-4 ml-2" />
                          )}
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Common Issues */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Common Issues & Solutions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {commonIssues.map((issue, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{issue.title}</CardTitle>
                      <Badge variant="outline">{issue.category}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-gray-600 dark:text-gray-300">
                        {issue.description}
                      </p>
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                        <div className="flex items-start space-x-2">
                          <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                              Solution
                            </p>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                              {issue.solution}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Emergency Support */}
          <Card className="mb-12 border-orange-200 dark:border-orange-800">
            <CardHeader>
              <CardTitle className="flex items-center text-orange-600">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Emergency Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Security Incidents</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    For security-related emergencies or critical vulnerabilities:
                  </p>
                  <Button variant="outline" asChild>
                    <Link href="mailto:security@chainproof.ai">
                      <Mail className="w-4 h-4 mr-2" />
                      security@chainproof.ai
                    </Link>
                  </Button>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Production Issues</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    For production system outages or critical API failures:
                  </p>
                  <Button variant="outline" asChild>
                    <Link href="mailto:emergency@chainproof.ai">
                      <Mail className="w-4 h-4 mr-2" />
                      emergency@chainproof.ai
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resources */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Self-Service Resources
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {resources.map((resource, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <Link 
                      href={resource.href}
                      className="flex items-center space-x-3 text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      {resource.icon}
                      <div>
                        <h4 className="font-medium">{resource.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {resource.description}
                        </p>
                      </div>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle>Send Us a Message</CardTitle>
              <p className="text-gray-600 dark:text-gray-300">
                Can't find what you're looking for? Send us a detailed message and we'll get back to you.
              </p>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Subject
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                    <option>General Question</option>
                    <option>Technical Support</option>
                    <option>Billing Issue</option>
                    <option>Feature Request</option>
                    <option>Bug Report</option>
                    <option>Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Message
                  </label>
                  <textarea
                    rows={5}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="Describe your issue or question in detail..."
                  />
                </div>
                
                <Button type="submit" className="w-full">
                  <Mail className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}