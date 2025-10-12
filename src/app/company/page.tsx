import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Target, Shield, Globe, Award, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Company - ChainProof AI',
  description: 'Learn about ChainProof AI - The leading AI-powered smart contract security auditing platform.',
}

export default function CompanyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4 py-24">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-4 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              Trusted by 1000+ Projects
            </Badge>
            <h1 className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">
              Securing the Future of
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                {' '}Blockchain
              </span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              ChainProof AI is pioneering the next generation of smart contract security through 
              advanced artificial intelligence, making blockchain audits faster, more accurate, and accessible to everyone.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/audit">Start Free Audit</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/contact">Contact Us</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-blue-600 dark:bg-blue-800">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="text-white">
              <div className="text-4xl font-bold mb-2">$10B+</div>
              <div className="text-blue-100">Assets Secured</div>
            </div>
            <div className="text-white">
              <div className="text-4xl font-bold mb-2">50K+</div>
              <div className="text-blue-100">Audits Completed</div>
            </div>
            <div className="text-white">
              <div className="text-4xl font-bold mb-2">99.9%</div>
              <div className="text-blue-100">Accuracy Rate</div>
            </div>
            <div className="text-white">
              <div className="text-4xl font-bold mb-2">2min</div>
              <div className="text-blue-100">Average Audit Time</div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                  Our Mission
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                  To democratize smart contract security by making professional-grade audits 
                  accessible, affordable, and instantaneous through the power of artificial intelligence.
                </p>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                  We believe that security shouldn't be a luxury. Every blockchain project, 
                  from startups to enterprises, deserves access to top-tier security analysis.
                </p>
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <Target className="w-5 h-5" />
                  <span className="font-semibold">Security for All</span>
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-700 p-8 rounded-2xl">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Our Vision
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  A world where every smart contract is automatically secured before deployment, 
                  where vulnerabilities are caught instantly, and where blockchain innovation can 
                  flourish without security concerns.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700 dark:text-gray-300">Zero vulnerabilities in production</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-blue-600" />
                    <span className="text-gray-700 dark:text-gray-300">Global blockchain security standard</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    <span className="text-gray-700 dark:text-gray-300">Accelerating Web3 adoption</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 bg-gray-50 dark:bg-slate-800">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Our Core Values
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                The principles that guide everything we do
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="text-center">
                <CardHeader>
                  <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <CardTitle>Security First</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">
                    Security is not just a feature—it's our foundation. Every decision we make 
                    prioritizes the safety and integrity of blockchain ecosystems.
                  </p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardHeader>
                  <Users className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                  <CardTitle>Accessibility</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">
                    We're breaking down barriers to professional security audits, making them 
                    available to projects of all sizes and budgets.
                  </p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardHeader>
                  <Award className="w-12 h-12 text-green-600 mx-auto mb-4" />
                  <CardTitle>Excellence</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">
                    We pursue excellence in every audit, every analysis, and every interaction 
                    with our community and customers.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Leadership Team */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Leadership Team
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Meet the experts behind ChainProof AI
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="text-center">
                <CardHeader>
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
                    JD
                  </div>
                  <CardTitle>John Davidson</CardTitle>
                  <CardDescription>CEO & Co-Founder</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    Former security lead at ConsenSys with 15+ years in blockchain security 
                    and AI research. MIT PhD in Computer Science.
                  </p>
                  <div className="flex justify-center gap-2">
                    <Badge variant="secondary">Blockchain</Badge>
                    <Badge variant="secondary">AI/ML</Badge>
                  </div>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardHeader>
                  <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
                    SC
                  </div>
                  <CardTitle>Sarah Chen</CardTitle>
                  <CardDescription>CTO & Co-Founder</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    Ex-Google senior engineer with expertise in distributed systems and 
                    machine learning. Stanford CS graduate, 12 patents in AI security.
                  </p>
                  <div className="flex justify-center gap-2">
                    <Badge variant="secondary">Engineering</Badge>
                    <Badge variant="secondary">AI Research</Badge>
                  </div>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardHeader>
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
                    MR
                  </div>
                  <CardTitle>Michael Rodriguez</CardTitle>
                  <CardDescription>Head of Security</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    Former security researcher at Trail of Bits. Discovered 50+ critical 
                    vulnerabilities in DeFi protocols. Smart contract security expert.
                  </p>
                  <div className="flex justify-center gap-2">
                    <Badge variant="secondary">Security</Badge>
                    <Badge variant="secondary">DeFi</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 dark:bg-blue-800">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Join Our Mission?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Whether you're a developer, investor, or blockchain enthusiast, 
              there's a place for you in the ChainProof AI ecosystem.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/careers">View Open Positions</Link>
              </Button>
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-blue-600" asChild>
                <Link href="/contact">Partner With Us</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}