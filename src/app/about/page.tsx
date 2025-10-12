import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Timeline } from '@/components/ui/timeline'
import { 
  Users, 
  Target, 
  Shield, 
  Lightbulb, 
  Rocket, 
  Heart,
  Calendar,
  MapPin,
  Award,
  BookOpen,
  GitBranch
} from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About - ChainProof AI',
  description: 'Learn about ChainProof AI\'s mission, team, and commitment to blockchain security.',
}

export default function AboutPage() {
  const milestones = [
    {
      date: '2023 Q1',
      title: 'ChainProof AI Founded',
      description: 'Founded by blockchain security experts and AI researchers with a vision to democratize smart contract security.',
      icon: 'Rocket'
    },
    {
      date: '2023 Q2',
      title: 'AI Engine Development',
      description: 'Developed proprietary AI models trained on millions of smart contracts and vulnerability patterns.',
      icon: 'Lightbulb'
    },
    {
      date: '2023 Q3',
      title: 'Beta Launch',
      description: 'Launched beta version with 100+ early adopters, processing over 10,000 smart contract audits.',
      icon: 'GitBranch'
    },
    {
      date: '2023 Q4',
      title: 'Series A Funding',
      description: 'Raised $15M Series A led by top VCs to scale operations and expand the team.',
      icon: 'Award'
    },
    {
      date: '2024 Q1',
      title: 'Public Launch',
      description: 'Official public launch with enterprise-grade features and API access for developers.',
      icon: 'Rocket'
    },
    {
      date: '2024 Q2',
      title: '50K Audits Milestone',
      description: 'Reached 50,000 completed audits with 99.9% accuracy rate and zero critical misses.',
      icon: 'Shield'
    }
  ]

  const teamMembers = [
    {
      name: 'John Davidson',
      role: 'CEO & Co-Founder',
      bio: 'Former security lead at ConsenSys with 15+ years in blockchain security and AI research.',
      expertise: ['Blockchain Security', 'AI Research', 'Strategic Vision'],
      avatar: 'JD'
    },
    {
      name: 'Sarah Chen',
      role: 'CTO & Co-Founder',
      bio: 'Ex-Google senior engineer with expertise in distributed systems and machine learning.',
      expertise: ['Distributed Systems', 'Machine Learning', 'Cloud Architecture'],
      avatar: 'SC'
    },
    {
      name: 'Michael Rodriguez',
      role: 'Head of Security',
      bio: 'Former security researcher at Trail of Bits. Discovered 50+ critical vulnerabilities in DeFi protocols.',
      expertise: ['Smart Contract Security', 'DeFi Protocols', 'Penetration Testing'],
      avatar: 'MR'
    },
    {
      name: 'Emily Watson',
      role: 'VP of Engineering',
      bio: 'Former principal engineer at Amazon Web Services with 12 years in scalable infrastructure.',
      expertise: ['Cloud Infrastructure', 'DevOps', 'System Design'],
      avatar: 'EW'
    },
    {
      name: 'David Kim',
      role: 'Head of AI Research',
      bio: 'PhD in Machine Learning from Stanford. Published 20+ papers on AI security applications.',
      expertise: ['Machine Learning', 'Natural Language Processing', 'AI Ethics'],
      avatar: 'DK'
    },
    {
      name: 'Lisa Anderson',
      role: 'VP of Product',
      bio: 'Former product lead at Stripe. Expert in building developer-focused security products.',
      expertise: ['Product Strategy', 'User Experience', 'Developer Tools'],
      avatar: 'LA'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4 py-24">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-4 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
              Since 2023
            </Badge>
            <h1 className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">
              About ChainProof AI
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              We're on a mission to make blockchain security accessible to everyone through 
              the power of artificial intelligence, ensuring a safer future for decentralized applications.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/audit">Try Our Platform</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/contact">Get in Touch</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                  Our Story
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                  ChainProof AI was born from a simple observation: smart contract security was 
                  too expensive, too slow, and too inaccessible for most developers.
                </p>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                  Our founders, having witnessed countless security breaches in the blockchain space, 
                  came together with a radical idea: What if AI could make security audits instant, 
                  affordable, and available to everyone?
                </p>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                  Today, we're proud to serve thousands of developers and companies, protecting 
                  billions of dollars in digital assets with our AI-powered security platform.
                </p>
                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                  <Heart className="w-5 h-5" />
                  <span className="font-semibold">Built by developers, for developers</span>
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 p-8 rounded-2xl">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Why We Exist
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Shield className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Security Crisis</h4>
                      <p className="text-gray-600 dark:text-gray-300">Over $3B lost to smart contract hacks in 2023 alone</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Users className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Accessibility Gap</h4>
                      <p className="text-gray-600 dark:text-gray-300">Traditional audits cost $10K-$100K, out of reach for most</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Target className="w-6 h-6 text-purple-600 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Speed Matters</h4>
                      <p className="text-gray-600 dark:text-gray-300">Traditional audits take weeks, we deliver in minutes</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 bg-gray-50 dark:bg-slate-800">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Our Journey
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Key milestones in our mission to secure blockchain
              </p>
            </div>
            <Timeline items={milestones} />
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Meet Our Team
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                World-class experts united by a passion for blockchain security
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {teamMembers.map((member, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-xl font-bold">
                      {member.avatar}
                    </div>
                    <CardTitle className="text-xl">{member.name}</CardTitle>
                    <CardDescription className="text-blue-600 dark:text-blue-400">
                      {member.role}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                      {member.bio}
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {member.expertise.map((skill, skillIndex) => (
                        <Badge key={skillIndex} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Company Culture */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-700">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Our Culture
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                The values that define how we work and innovate
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Card className="text-center">
                <CardHeader>
                  <Lightbulb className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
                  <CardTitle className="text-lg">Innovation First</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    We push boundaries and challenge conventions to create breakthrough solutions.
                  </p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardHeader>
                  <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <CardTitle className="text-lg">Collaborative</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    We believe diverse perspectives create the strongest solutions.
                  </p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardHeader>
                  <Shield className="w-12 h-12 text-green-600 mx-auto mb-4" />
                  <CardTitle className="text-lg">Security Obsessed</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Security isn't just what we do—it's who we are.
                  </p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardHeader>
                  <Heart className="w-12 h-12 text-red-600 mx-auto mb-4" />
                  <CardTitle className="text-lg">Customer Focused</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Our success is measured by the security and success of our customers.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Office Locations */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Our Global Presence
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Serving customers worldwide from our strategic locations
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="text-center">
                <CardHeader>
                  <MapPin className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <CardTitle>San Francisco</CardTitle>
                  <CardDescription>Headquarters</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Our main office and engineering hub in the heart of Silicon Valley.
                  </p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardHeader>
                  <MapPin className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                  <CardTitle>New York</CardTitle>
                  <CardDescription>East Coast Office</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Sales, marketing, and customer success team serving the financial sector.
                  </p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardHeader>
                  <MapPin className="w-12 h-12 text-green-600 mx-auto mb-4" />
                  <CardTitle>Berlin</CardTitle>
                  <CardDescription>European Office</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Research and development team focused on European markets and compliance.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Join Us CTA */}
      <section className="py-20 bg-blue-600 dark:bg-blue-800">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-4">
              Want to Be Part of Our Story?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              We're always looking for talented individuals who share our passion for 
              blockchain security and innovation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/careers">View Open Positions</Link>
              </Button>
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-blue-600" asChild>
                <Link href="/contact">Send Us a Message</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}