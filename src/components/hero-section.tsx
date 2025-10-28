'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, Zap, BarChart3, Lock, CheckCircle2, ArrowRight, Code, Search, AlertTriangle, Star, Users, TrendingUp, Award } from 'lucide-react'
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
            Protect Your Smart Contracts
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600">
              Before Hackers Do
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto leading-relaxed">
            AI-powered security audits in under 2 minutes. Save $50,000+ in traditional audit costs while 
            protecting millions in user funds. Get comprehensive vulnerability detection with blockchain-verified results.
          </p>
          
          <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-4 mb-8 max-w-md mx-auto border border-green-200 dark:border-green-800">
            <p className="text-lg font-semibold text-green-800 dark:text-green-300">
              🎉 7-Day Free Trial - Unlimited Audits
            </p>
            <p className="text-sm text-green-700 dark:text-green-400">
              No credit card required. Start protecting your contracts today.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8 py-3 text-lg shadow-lg hover:shadow-xl transition-all duration-300" asChild>
              <Link href="/audit">
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="px-8 py-3 text-lg border-2 hover:bg-gray-50 dark:hover:bg-gray-800" asChild>
              <Link href="/pricing">
                View Pricing
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

export function SocialProofSection() {
  const testimonials = [
    {
      name: "Alex Chen",
      role: "Lead Developer at DeFiProtocol",
      content: "ChainProof saved us $75,000 in audit costs and caught 3 critical vulnerabilities our team missed. The AI analysis is incredibly thorough.",
      rating: 5,
      avatar: "AC"
    },
    {
      name: "Sarah Martinez",
      role: "Security Engineer at CryptoVault",
      content: "The 2-minute audit time is game-changing. We can now audit every deployment before going live. The blockchain verification gives us complete confidence.",
      rating: 5,
      avatar: "SM"
    },
    {
      name: "David Kim",
      role: "CTO at TokenLabs",
      content: "Best investment we've made. ChainProof's AI found vulnerabilities that traditional auditors missed. The detailed reports are excellent.",
      rating: 5,
      avatar: "DK"
    }
  ]

  const trustBadges = [
    { icon: <Shield className="w-6 h-6" />, text: "SOC 2 Compliant" },
    { icon: <Lock className="w-6 h-6" />, text: "256-bit Encryption" },
    { icon: <Award className="w-6 h-6" />, text: "ISO 27001 Certified" },
    { icon: <CheckCircle2 className="w-6 h-6" />, text: "99.9% Uptime SLA" }
  ]

  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4">
        {/* Trust Indicators */}
        <div className="text-center mb-12">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Trusted by 500+ DeFi protocols and developers</p>
          <div className="flex flex-wrap justify-center items-center gap-8 mb-8">
            {trustBadges.map((badge, index) => (
              <div key={index} className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <div className="text-green-600 dark:text-green-400">
                  {badge.icon}
                </div>
                <span className="text-sm font-medium">{badge.text}</span>
              </div>
            ))}
          </div>
          
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto mb-12">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">2,500+</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Contracts Audited</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">$50M+</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Funds Protected</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">99.8%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Accuracy Rate</div>
            </div>
          </div>
        </div>

        {/* Testimonials */}
        <div className="max-w-6xl mx-auto">
          <h3 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">
            What Developers Are Saying
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-4 italic">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">{testimonial.name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export function FeaturesSection() {
  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "2-Minute Audits",
      description: "Save 6-8 weeks of waiting time. Deploy faster and beat competitors to market while maintaining security.",
      benefit: "Save $50,000+ in audit costs",
      color: "text-yellow-600 dark:text-yellow-400"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "50+ Vulnerability Types",
      description: "AI detects reentrancy, access control, gas optimization, and advanced attack vectors that manual audits miss.",
      benefit: "99.8% accuracy rate",
      color: "text-blue-600 dark:text-blue-400"
    },
    {
      icon: <Lock className="w-6 h-6" />,
      title: "Blockchain Verification",
      description: "Immutable audit proofs on Base blockchain. Prove compliance to investors and users with cryptographic certainty.",
      benefit: "Regulatory compliance ready",
      color: "text-green-600 dark:text-green-400"
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Risk-Based Prioritization",
      description: "Get actionable security scores and fix critical issues first. Clear remediation steps for every vulnerability.",
      benefit: "Reduce security debt by 90%",
      color: "text-purple-600 dark:text-purple-400"
    },
    {
      icon: <Code className="w-6 h-6" />,
      title: "Solidity 0.8.x Support",
      description: "Advanced AST analysis and pattern matching. Works with all major frameworks including Hardhat and Foundry.",
      benefit: "Zero integration effort",
      color: "text-orange-600 dark:text-orange-400"
    },
    {
      icon: <Search className="w-6 h-6" />,
      title: "Continuous Monitoring",
      description: "Real-time alerts for new vulnerabilities in deployed contracts. Stay protected as threat landscape evolves.",
      benefit: "24/7 protection",
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
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
                  {feature.description}
                </p>
                <div className={`text-sm font-semibold ${feature.color} bg-gray-50 dark:bg-gray-800 px-3 py-1 rounded-full inline-block`}>
                  {feature.benefit}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

export function DemoSection() {
  return (
    <section className="py-20 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            See ChainProof in Action
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Watch how our AI analyzes smart contracts and identifies vulnerabilities in real-time
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <Card className="border-0 shadow-2xl overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-gray-900 text-white p-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="ml-4 text-sm text-gray-400">ChainProof AI Audit Terminal</span>
                </div>
                <div className="font-mono text-sm">
                  <div className="text-green-400">$ chainproof audit MyToken.sol</div>
                  <div className="text-gray-400 mt-2">🔍 Analyzing contract structure...</div>
                  <div className="text-gray-400">🧠 Running AI vulnerability detection...</div>
                  <div className="text-gray-400">⚡ Checking for reentrancy attacks...</div>
                  <div className="text-gray-400">🔐 Validating access controls...</div>
                  <div className="text-yellow-400 mt-2">⚠️  Found 2 medium-risk vulnerabilities</div>
                  <div className="text-red-400">🚨 Found 1 high-risk vulnerability</div>
                  <div className="text-green-400 mt-2">✅ Audit complete in 1.8 seconds</div>
                  <div className="text-blue-400">📊 Generating detailed report...</div>
                  <div className="text-purple-400">🔗 Storing proof on Base blockchain...</div>
                  <div className="text-green-400 mt-2">🎉 Report available at: chainproof.ai/audit/abc123</div>
                </div>
              </div>
              
              <div className="p-8 bg-white dark:bg-gray-800">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      What You Get:
                    </h3>
                    <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        Detailed vulnerability report
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        Risk severity scoring
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        Fix recommendations
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        Blockchain verification
                      </li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Try It Now:
                    </h3>
                    <div className="space-y-4">
                      <Button className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white" asChild>
                        <Link href="/audit">
                          Upload Your Contract
                          <ArrowRight className="ml-2 w-4 h-4" />
                        </Link>
                      </Button>
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                        Connect your Base wallet to get started • Free trial available
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
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

export function PricingPreviewSection() {
  return (
    <section className="py-20 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Start Your Free Trial Today
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Get unlimited audits for 7 days, then choose the plan that fits your needs
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Free Trial */}
          <Card className="border-2 border-green-500 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 bg-green-500 text-white text-center py-2 text-sm font-semibold">
              🎉 FREE TRIAL
            </div>
            <CardContent className="p-6 pt-12">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Free Trial</h3>
                <div className="text-4xl font-bold text-green-600 mb-2">$0</div>
                <p className="text-gray-600 dark:text-gray-300">7 days</p>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-gray-600 dark:text-gray-300">Unlimited audits</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-gray-600 dark:text-gray-300">Full AI analysis</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-gray-600 dark:text-gray-300">Detailed reports</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-gray-600 dark:text-gray-300">Blockchain verification</span>
                </li>
              </ul>
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white" asChild>
                <Link href="/login">Connect Base Wallet</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Professional */}
          <Card className="border-2 border-blue-500 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 bg-blue-500 text-white text-center py-2 text-sm font-semibold">
              ⭐ MOST POPULAR
            </div>
            <CardContent className="p-6 pt-12">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Professional</h3>
                <div className="text-4xl font-bold text-blue-600 mb-2">$49</div>
                <p className="text-gray-600 dark:text-gray-300">per month</p>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-500" />
                  <span className="text-gray-600 dark:text-gray-300">50 audit credits/month</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-500" />
                  <span className="text-gray-600 dark:text-gray-300">Priority support</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-500" />
                  <span className="text-gray-600 dark:text-gray-300">API access</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-500" />
                  <span className="text-gray-600 dark:text-gray-300">Team collaboration</span>
                </li>
              </ul>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" asChild>
                <Link href="/pricing">Choose Professional</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Enterprise */}
          <Card className="border border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Enterprise</h3>
                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Custom</div>
                <p className="text-gray-600 dark:text-gray-300">pricing</p>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600 dark:text-gray-300">Unlimited audits</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600 dark:text-gray-300">Dedicated support</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600 dark:text-gray-300">Custom integrations</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600 dark:text-gray-300">SLA guarantees</span>
                </li>
              </ul>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/contact">Contact Sales</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <div className="text-center mt-12">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            All plans include our core AI-powered security analysis and blockchain verification
          </p>
          <Button variant="link" asChild>
            <Link href="/pricing" className="text-blue-600 hover:text-blue-700">
              View detailed pricing comparison →
            </Link>
          </Button>
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