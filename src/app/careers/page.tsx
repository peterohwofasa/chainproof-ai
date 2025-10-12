import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  MapPin, 
  DollarSign, 
  Clock, 
  Users,
  Building,
  Rocket,
  Heart,
  Send,
  Search,
  Filter,
  Briefcase,
  GraduationCap,
  Coffee,
  Laptop,
  Shield
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Careers - ChainProof AI',
  description: 'Join ChainProof AI and help us secure the future of blockchain. Explore career opportunities in AI, security, and blockchain technology.',
}

const jobCategories = [
  { id: 'all', name: 'All Positions', count: 12 },
  { id: 'engineering', name: 'Engineering', count: 5 },
  { id: 'security', name: 'Security', count: 3 },
  { id: 'product', name: 'Product', count: 2 },
  { id: 'operations', name: 'Operations', count: 2 }
]

const jobLocations = [
  { id: 'all', name: 'All Locations' },
  { id: 'remote', name: 'Remote' },
  { id: 'sf', name: 'San Francisco' },
  { id: 'nyc', name: 'New York' },
  { id: 'berlin', name: 'Berlin' }
]

const jobOpenings = [
  {
    id: 1,
    title: "Senior Smart Contract Security Engineer",
    department: "Security",
    location: "Remote",
    type: "Full-time",
    experience: "Senior",
    salary: "$150k - $200k",
    posted: "2 days ago",
    featured: true,
    description: "We're looking for a seasoned security engineer to lead our smart contract security research and vulnerability detection efforts.",
    requirements: [
      "5+ years of smart contract security experience",
      "Expert knowledge of Solidity and EVM",
      "Experience with security tools like Slither, Mythril",
      "Public security research or bug bounty achievements"
    ],
    benefits: ["Equity package", "Flexible work hours", "Security conference budget"]
  },
  {
    id: 2,
    title: "Machine Learning Engineer - Security",
    department: "Engineering",
    location: "San Francisco",
    type: "Full-time",
    experience: "Mid-level",
    salary: "$130k - $170k",
    posted: "3 days ago",
    featured: true,
    description: "Join our AI team to develop cutting-edge machine learning models for vulnerability detection and security analysis.",
    requirements: [
      "3+ years of ML engineering experience",
      "Strong Python and TensorFlow/PyTorch skills",
      "Experience with NLP or code analysis models",
      "Interest in blockchain technology"
    ],
    benefits: ["Equity package", "GPU budget", "Research publication support"]
  },
  {
    id: 3,
    title: "Frontend Engineer - Developer Tools",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
    experience: "Mid-level",
    salary: "$120k - $160k",
    posted: "1 week ago",
    featured: false,
    description: "Build intuitive developer interfaces for our security auditing platform and tools.",
    requirements: [
      "3+ years of React/Next.js experience",
      "Strong TypeScript skills",
      "Experience with developer tools or technical products",
      "Understanding of security concepts"
    ],
    benefits: ["Equity package", "Home office stipend", "Tech conference budget"]
  },
  {
    id: 4,
    title: "Product Manager - Security Platform",
    department: "Product",
    location: "New York",
    type: "Full-time",
    experience: "Senior",
    salary: "$140k - $180k",
    posted: "1 week ago",
    featured: false,
    description: "Drive the product strategy and roadmap for our AI-powered security platform.",
    requirements: [
      "5+ years of product management experience",
      "Experience with security or developer tools",
      "Strong technical background",
      "Excellent communication skills"
    ],
    benefits: ["Equity package", "Product leadership training", "Industry conference budget"]
  },
  {
    id: 5,
    title: "DevOps Engineer",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
    experience: "Mid-level",
    salary: "$125k - $165k",
    posted: "2 weeks ago",
    featured: false,
    description: "Build and maintain scalable infrastructure for our security analysis platform.",
    requirements: [
      "3+ years of DevOps experience",
      "Strong AWS/GCP knowledge",
      "Kubernetes and container orchestration",
      "Infrastructure as Code (Terraform) experience"
    ],
    benefits: ["Equity package", "Certification budget", "Flexible schedule"]
  },
  {
    id: 6,
    title: "Security Researcher",
    department: "Security",
    location: "Berlin",
    type: "Full-time",
    experience: "Mid-level",
    salary: "$110k - $150k",
    posted: "2 weeks ago",
    featured: false,
    description: "Research emerging threats and vulnerabilities in blockchain protocols and smart contracts.",
    requirements: [
      "2+ years of security research experience",
      "Strong analytical and problem-solving skills",
      "Knowledge of blockchain protocols",
      "Publication or bug bounty record preferred"
    ],
    benefits: ["Equity package", "Research budget", "Conference travel"]
  }
]

const benefits = [
  {
    icon: DollarSign,
    title: "Competitive Compensation",
    description: "Top-tier salaries, equity packages, and performance bonuses"
  },
  {
    icon: Heart,
    title: "Health & Wellness",
    description: "Comprehensive health, dental, and vision insurance for you and your family"
  },
  {
    icon: Laptop,
    title: "Remote First",
    description: "Work from anywhere with flexible hours and home office stipend"
  },
  {
    icon: GraduationCap,
    title: "Learning & Development",
    description: "Annual learning budget, conference attendance, and internal training"
  },
  {
    icon: Coffee,
    title: "Work-Life Balance",
    description: "Unlimited PTO, mental health support, and flexible schedules"
  },
  {
    icon: Shield,
    title: "Security Focus",
    description: "Work on cutting-edge security challenges with industry experts"
  }
]

export default function CareersPage() {
  const featuredJobs = jobOpenings.filter(job => job.featured)
  const allJobs = jobOpenings.filter(job => !job.featured)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4 py-24">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-4 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
              We're Hiring!
            </Badge>
            <h1 className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">
              Join Us in Securing the
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                {' '}Future of Blockchain
              </span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Help us build the next generation of AI-powered security tools that protect 
              billions of dollars in digital assets and enable the future of decentralized finance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg">
                View Open Positions
              </Button>
              <Button size="lg" variant="outline">
                Learn About Our Culture
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
              <div className="text-4xl font-bold mb-2">50+</div>
              <div className="text-blue-100">Team Members</div>
            </div>
            <div className="text-white">
              <div className="text-4xl font-bold mb-2">12</div>
              <div className="text-blue-100">Open Positions</div>
            </div>
            <div className="text-white">
              <div className="text-4xl font-bold mb-2">15</div>
              <div className="text-blue-100">Countries</div>
            </div>
            <div className="text-white">
              <div className="text-4xl font-bold mb-2">4.8★</div>
              <div className="text-blue-100">Team Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Positions */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Featured Opportunities
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Our most urgent and exciting roles
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-16">
              {featuredJobs.map((job) => (
                <Card key={job.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-700">
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge className="mb-2 bg-yellow-500 text-white">
                          Featured
                        </Badge>
                        <CardTitle className="text-xl mb-2">{job.title}</CardTitle>
                        <CardDescription className="text-base">
                          {job.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <MapPin className="w-4 h-4" />
                        {job.location}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <DollarSign className="w-4 h-4" />
                        {job.salary}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Briefcase className="w-4 h-4" />
                        {job.experience}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Clock className="w-4 h-4" />
                        {job.posted}
                      </div>
                    </div>
                    <div className="flex gap-2 mb-4">
                      <Badge variant="secondary">{job.department}</Badge>
                      <Badge variant="outline">{job.type}</Badge>
                    </div>
                    <Button className="w-full">
                      Apply Now
                      <Send className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* All Positions */}
      <section className="py-20 bg-gray-50 dark:bg-slate-800">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                All Open Positions
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Explore all available opportunities across our teams
              </p>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 mb-8">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Search className="w-4 h-4" />
                    <label className="text-sm font-medium">Search</label>
                  </div>
                  <Input placeholder="Search positions..." />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Filter className="w-4 h-4" />
                    <label className="text-sm font-medium">Category</label>
                  </div>
                  <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700">
                    {jobCategories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name} ({category.count})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4" />
                    <label className="text-sm font-medium">Location</label>
                  </div>
                  <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700">
                    {jobLocations.map(location => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Job List */}
            <div className="space-y-4">
              {allJobs.map((job) => (
                <Card key={job.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 transition-colors">
                            {job.title}
                          </h3>
                          <Badge variant="secondary">{job.department}</Badge>
                          <Badge variant="outline">{job.type}</Badge>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                          {job.description}
                        </p>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {job.location}
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            {job.salary}
                          </div>
                          <div className="flex items-center gap-1">
                            <Briefcase className="w-4 h-4" />
                            {job.experience}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {job.posted}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Learn More
                        </Button>
                        <Button size="sm">
                          Apply
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Why Work at ChainProof AI?
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                We offer competitive benefits and a culture that values growth and innovation
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon
                return (
                  <Card key={index} className="text-center">
                    <CardHeader>
                      <Icon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                      <CardTitle className="text-xl">{benefit.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 dark:text-gray-300">
                        {benefit.description}
                      </p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Culture Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-700">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                  Our Culture
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                  At ChainProof AI, we're building more than just a company—we're building 
                  a community of passionate security experts and innovators.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Rocket className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Innovation Driven</h4>
                      <p className="text-gray-600 dark:text-gray-300">
                        We encourage experimentation and reward creative solutions to complex security challenges.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Users className="w-6 h-6 text-purple-600 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Collaborative Environment</h4>
                      <p className="text-gray-600 dark:text-gray-300">
                        We believe diverse perspectives create the strongest security solutions.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Heart className="w-6 h-6 text-red-600 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Work-Life Harmony</h4>
                      <p className="text-gray-600 dark:text-gray-300">
                        We support our team's well-being with flexible schedules and unlimited PTO.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Life at ChainProof AI
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                    <span className="font-medium">Team Size</span>
                    <span className="text-blue-600">50+ Members</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                    <span className="font-medium">Average Tenure</span>
                    <span className="text-blue-600">2.5 Years</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                    <span className="font-medium">Remote Team</span>
                    <span className="text-blue-600">70% Remote</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                    <span className="font-medium">Growth Rate</span>
                    <span className="text-blue-600">40% YoY</span>
                  </div>
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
              Ready to Join Our Mission?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Help us secure the future of blockchain and protect billions in digital assets.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary">
                Browse All Positions
              </Button>
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-blue-600">
                Connect on LinkedIn
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}