import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Calendar, 
  Clock, 
  User, 
  Search,
  TrendingUp,
  Shield,
  Code,
  BookOpen,
  ArrowRight,
  Filter
} from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Blog - ChainProof AI',
  description: 'Stay updated with the latest insights on blockchain security, smart contract auditing, and AI technology.',
}

const blogPosts = [
  {
    id: 1,
    title: "Top 10 Smart Contract Vulnerabilities in 2024",
    excerpt: "Discover the most critical security vulnerabilities affecting smart contracts this year and learn how to protect your DeFi projects from common attack vectors.",
    author: "Michael Rodriguez",
    date: "2024-03-15",
    readTime: "8 min read",
    category: "Security",
    image: "/blog/vulnerabilities.jpg",
    featured: true,
    tags: ["Security", "DeFi", "Vulnerabilities", "Best Practices"]
  },
  {
    id: 2,
    title: "How AI is Revolutionizing Smart Contract Auditing",
    excerpt: "Explore the cutting-edge AI technologies that are transforming traditional security audits, making them faster, more accurate, and accessible to everyone.",
    author: "Sarah Chen",
    date: "2024-03-12",
    readTime: "6 min read",
    category: "AI & ML",
    image: "/blog/ai-auditing.jpg",
    featured: true,
    tags: ["AI", "Machine Learning", "Security", "Innovation"]
  },
  {
    id: 3,
    title: "Understanding Reentrancy Attacks: A Complete Guide",
    excerpt: "Deep dive into reentrancy attacks, one of the most common and dangerous vulnerabilities in smart contracts, with practical prevention strategies.",
    author: "John Davidson",
    date: "2024-03-10",
    readTime: "10 min read",
    category: "Tutorial",
    image: "/blog/reentrancy.jpg",
    featured: false,
    tags: ["Reentrancy", "Security", "Tutorial", "Solidity"]
  },
  {
    id: 4,
    title: "The Future of DeFi Security: Trends and Predictions",
    excerpt: "Expert analysis of emerging security trends in the DeFi space and predictions for how blockchain security will evolve in the coming years.",
    author: "Emily Watson",
    date: "2024-03-08",
    readTime: "7 min read",
    category: "Industry Insights",
    image: "/blog/defi-future.jpg",
    featured: false,
    tags: ["DeFi", "Future", "Trends", "Security"]
  },
  {
    id: 5,
    title: "Gas Optimization Techniques for Secure Smart Contracts",
    excerpt: "Learn how to optimize your smart contracts for gas efficiency without compromising security, with practical examples and best practices.",
    author: "David Kim",
    date: "2024-03-05",
    readTime: "9 min read",
    category: "Development",
    image: "/blog/gas-optimization.jpg",
    featured: false,
    tags: ["Gas", "Optimization", "Development", "Performance"]
  },
  {
    id: 6,
    title: "Case Study: How We Prevented a $2M Flash Loan Attack",
    excerpt: "Real-world analysis of a critical vulnerability we discovered and helped fix, preventing a potential $2 million loss from a flash loan attack.",
    author: "Michael Rodriguez",
    date: "2024-03-01",
    readTime: "12 min read",
    category: "Case Study",
    image: "/blog/flash-loan.jpg",
    featured: false,
    tags: ["Case Study", "Flash Loans", "Real World", "Security"]
  }
]

const categories = [
  { name: "All", count: 24, icon: BookOpen },
  { name: "Security", count: 8, icon: Shield },
  { name: "AI & ML", count: 6, icon: TrendingUp },
  { name: "Tutorial", count: 5, icon: Code },
  { name: "Industry Insights", count: 3, icon: BookOpen },
  { name: "Case Study", count: 2, icon: Shield }
]

export default function BlogPage() {
  const featuredPosts = blogPosts.filter(post => post.featured)
  const recentPosts = blogPosts.filter(post => !post.featured)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4 py-24">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-4 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              Latest Insights
            </Badge>
            <h1 className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">
              ChainProof AI Blog
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Stay updated with the latest insights on blockchain security, smart contract auditing, 
              and the future of AI-powered security solutions.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search articles, topics, or keywords..."
                  className="pl-10 pr-4 py-3 text-lg"
                />
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                <span>24 Articles</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>6 Authors</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Updated Weekly</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Posts */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                Featured Articles
              </h2>
              <Button variant="outline" size="sm">
                View All
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              {featuredPosts.map((post) => (
                <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
                  <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 relative overflow-hidden">
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-yellow-500 text-white">
                        Featured
                      </Badge>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <Badge variant="secondary" className="bg-white/90 text-gray-900">
                        {post.category}
                      </Badge>
                    </div>
                  </div>
                  <CardHeader>
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(post.date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {post.readTime}
                      </div>
                    </div>
                    <CardTitle className="text-xl line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {post.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-3">
                      {post.excerpt}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {post.author.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {post.author}
                        </span>
                      </div>
                      <Button variant="ghost" size="sm">
                        Read More
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Categories and Recent Posts */}
      <section className="py-16 bg-gray-50 dark:bg-slate-800">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-4 gap-8">
              {/* Categories Sidebar */}
              <div className="lg:col-span-1">
                <div className="sticky top-8">
                  <div className="flex items-center gap-2 mb-6">
                    <Filter className="w-5 h-5" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Categories
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {categories.map((category) => {
                      const Icon = category.icon
                      return (
                        <Button
                          key={category.name}
                          variant="ghost"
                          className="w-full justify-between h-auto p-3 hover:bg-gray-100 dark:hover:bg-slate-700"
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            <span>{category.name}</span>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {category.count}
                          </Badge>
                        </Button>
                      )
                    })}
                  </div>

                  {/* Newsletter Signup */}
                  <div className="mt-8 p-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl text-white">
                    <h3 className="text-lg font-semibold mb-2">
                      Stay Updated
                    </h3>
                    <p className="text-sm text-blue-100 mb-4">
                      Get the latest security insights delivered to your inbox weekly.
                    </p>
                    <Input
                      placeholder="Enter your email"
                      className="bg-white/20 border-white/30 text-white placeholder-white/70 mb-3"
                    />
                    <Button size="sm" className="w-full bg-white text-blue-600 hover:bg-gray-100">
                      Subscribe
                    </Button>
                  </div>
                </div>
              </div>

              {/* Recent Posts */}
              <div className="lg:col-span-3">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Recent Articles
                  </h3>
                  <select className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white">
                    <option>Most Recent</option>
                    <option>Most Popular</option>
                    <option>Most Read</option>
                  </select>
                </div>

                <div className="space-y-6">
                  {recentPosts.map((post) => (
                    <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
                      <div className="flex flex-col md:flex-row">
                        <div className="md:w-1/3 aspect-video md:aspect-square bg-gradient-to-br from-gray-400 to-gray-600 relative">
                          <div className="absolute top-4 left-4">
                            <Badge variant="secondary" className="bg-white/90 text-gray-900">
                              {post.category}
                            </Badge>
                          </div>
                        </div>
                        <div className="md:w-2/3 p-6">
                          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-2">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(post.date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {post.readTime}
                            </div>
                          </div>
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                            {post.title}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                            {post.excerpt}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                {post.author.split(' ').map(n => n[0]).join('')}
                              </div>
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {post.author}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex gap-1">
                                {post.tags.slice(0, 2).map((tag, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                              <Button variant="ghost" size="sm">
                                <ArrowRight className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Load More */}
                <div className="text-center mt-8">
                  <Button variant="outline" size="lg">
                    Load More Articles
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 dark:bg-blue-800">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-4">
              Want to Contribute to Our Blog?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              We're always looking for security experts and blockchain enthusiasts to share 
              their insights with our community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary">
                Submit Article
              </Button>
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-blue-600">
                View Guidelines
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}