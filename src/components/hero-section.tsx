'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, Zap, BarChart3, Lock, CheckCircle2, ArrowRight, Code, Search, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export function HeroSection() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02]" />
      
      <div className="relative container mx-auto px-4 py-16 sm:py-24 lg:py-32">
        <div className="text-center max-w-4xl mx-auto">
          <Badge variant="outline" className="mb-4 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
            <Shield className="w-3 h-3 mr-1" />
            AI-Powered Security Auditing
          </Badge>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">
            Smart Contract Security
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600">
              Audited in Minutes
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
            ChainProof AI uses advanced AI to analyze Solidity smart contracts for security vulnerabilities, 
            delivering comprehensive audit reports with cryptographic proofs stored on Base blockchain.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg" asChild>
              <Link href="/audit">
                Start Audit Now
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="px-8 py-3 text-lg" asChild>
              <Link href="#features">
                Learn More
              </Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>2-Minute Audits</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>AI-Powered Analysis</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Blockchain Proofs</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function FeaturesSection() {
  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Lightning Fast",
      description: "Complete security audits in under 2 minutes, not weeks. Get instant results for rapid development cycles.",
      color: "text-yellow-600 dark:text-yellow-400"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Comprehensive Analysis",
      description: "AI-powered detection of 50+ vulnerability types including reentrancy, access control, and gas optimization issues.",
      color: "text-blue-600 dark:text-blue-400"
    },
    {
      icon: <Lock className="w-6 h-6" />,
      title: "Cryptographic Proofs",
      description: "Audit results permanently stored on Base blockchain with tamper-proof verification and IPFS backup.",
      color: "text-green-600 dark:text-green-400"
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Risk Scoring",
      description: "Detailed security scores and risk assessments with actionable remediation recommendations.",
      color: "text-purple-600 dark:text-purple-400"
    },
    {
      icon: <Code className="w-6 h-6" />,
      title: "Smart Contract Support",
      description: "Support for Solidity 0.8.x with advanced parsing and AST analysis for comprehensive coverage.",
      color: "text-orange-600 dark:text-orange-400"
    },
    {
      icon: <Search className="w-6 h-6" />,
      title: "Real-time Monitoring",
      description: "Continuous monitoring and alerts for new vulnerability discoveries in your deployed contracts.",
      color: "text-red-600 dark:text-red-400"
    }
  ]

  return (
    <section id="features" className="py-20 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Why Choose ChainProof AI?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Next-generation security auditing that combines AI intelligence with blockchain immutability
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-6">
                <div className={`w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4 ${feature.color}`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

export function StatsSection() {
  const stats = [
    { value: "50+", label: "Vulnerability Types" },
    { value: "<2min", label: "Audit Time" },
    { value: "100%", label: "AI Accuracy" },
    { value: "Base", label: "Blockchain Network" }
  ]

  return (
    <section className="py-16 bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl sm:text-4xl font-bold mb-2">{stat.value}</div>
              <div className="text-blue-100">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function CTASection() {
  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-800">
      <div className="container mx-auto px-4">
        <Card className="max-w-4xl mx-auto border-0 shadow-xl">
          <CardContent className="p-12 text-center">
            <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Security Can't Wait
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Every day without proper security auditing puts your smart contracts and user funds at risk. 
              Get started with ChainProof AI today and protect your DeFi protocols.
            </p>
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg" asChild>
              <Link href="/audit">
                Start Your First Audit
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}