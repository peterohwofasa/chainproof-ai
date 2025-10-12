'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, Star, Zap, Shield, Crown } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'

const plans = [
  {
    name: 'Free',
    price: '$0',
    description: 'Perfect for trying out ChainProof',
    icon: Star,
    features: [
      '5 audit credits per month',
      'Basic vulnerability scanning',
      'Standard report format',
      'Community support',
      '7-day report history'
    ],
    notIncluded: [
      'Priority processing',
      'Custom integrations',
      'API access',
      'Advanced analytics'
    ],
    buttonText: 'Get Started',
    buttonVariant: 'outline' as const,
    popular: false
  },
  {
    name: 'Professional',
    price: '$49',
    description: 'For professional developers and teams',
    icon: Zap,
    features: [
      '50 audit credits per month',
      'Advanced vulnerability detection',
      'Detailed reports with recommendations',
      'Priority support (24h response)',
      '30-day report history',
      'Team collaboration (up to 5 users)',
      'Custom report branding',
      'Export to PDF/JSON'
    ],
    notIncluded: [
      'Dedicated account manager',
      'Custom model training',
      'White-label solutions'
    ],
    buttonText: 'Start Free Trial',
    buttonVariant: 'default' as const,
    popular: true
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For large organizations with advanced needs',
    icon: Crown,
    features: [
      'Unlimited audit credits',
      'Custom vulnerability rules',
      'Advanced threat intelligence',
      'Dedicated account manager',
      'Unlimited report history',
      'Unlimited team members',
      'Custom integrations',
      'API access with webhooks',
      'On-premise deployment option',
      'SLA guarantee',
      'Custom training sessions'
    ],
    notIncluded: [],
    buttonText: 'Contact Sales',
    buttonVariant: 'default' as const,
    popular: false
  }
]

export default function PricingPage() {
  const { data: session, status } = useSession()
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')

  const handlePlanSelect = async (planName: string) => {
    if (!session) {
      window.location.href = '/signup'
      return
    }

    if (planName === 'Enterprise') {
      window.location.href = 'mailto:sales@chainproof.ai?subject=Enterprise Plan Inquiry'
      return
    }

    // Map plan names to Stripe price IDs (these should come from your Stripe dashboard)
    const priceIds: { [key: string]: string } = {
      'Professional': 'price_1Oxxxx', // Replace with actual price ID
      'Free': 'price_1Oxxxx' // Replace with actual price ID
    }

    const priceId = priceIds[planName]
    if (!priceId) {
      toast.error('Plan not available')
      return
    }

    try {
      const response = await fetch('/api/subscription/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, planName })
      })

      if (response.ok) {
        const { url } = await response.json()
        window.location.href = url
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create checkout session')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to start checkout')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mb-8">
            Choose the perfect plan for your smart contract security needs. 
            All plans include our core AI-powered vulnerability detection.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-200 dark:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${billingCycle === 'annual' ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500'}`}>
              Annual <span className="text-green-600 dark:text-green-400">(Save 20%)</span>
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon
            const adjustedPrice = billingCycle === 'annual' && plan.price !== '$0' && plan.price !== 'Custom' 
              ? `$${Math.round(parseInt(plan.price.slice(1)) * 0.8)}`
              : plan.price

            return (
              <Card
                key={plan.name}
                className={`relative ${
                  plan.popular
                    ? 'border-2 border-blue-500 shadow-xl scale-105'
                    : 'border border-slate-200 dark:border-slate-700'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    <div className={`p-3 rounded-full ${
                      plan.popular ? 'bg-blue-100 dark:bg-blue-900' : 'bg-slate-100 dark:bg-slate-800'
                    }`}>
                      <Icon className={`h-6 w-6 ${
                        plan.popular ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'
                      }`} />
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">
                    {plan.description}
                  </CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-slate-900 dark:text-slate-100">
                      {adjustedPrice}
                    </span>
                    {plan.price !== 'Custom' && (
                      <span className="text-slate-600 dark:text-slate-400 ml-2">
                        /{billingCycle === 'annual' ? 'month' : 'month'}
                      </span>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-slate-700 dark:text-slate-300">{feature}</span>
                    </div>
                  ))}
                  
                  {plan.notIncluded.map((feature) => (
                    <div key={feature} className="flex items-start gap-3 opacity-50">
                      <div className="h-5 w-5 border-2 border-slate-300 rounded-full mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-slate-500 line-through">{feature}</span>
                    </div>
                  ))}
                </CardContent>

                <CardFooter>
                  <Button
                    variant={plan.buttonVariant}
                    className="w-full"
                    onClick={() => handlePlanSelect(plan.name)}
                  >
                    {plan.buttonText}
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 dark:text-slate-100 mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  What are audit credits?
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  One audit credit allows you to scan one smart contract. Each credit includes comprehensive 
                  vulnerability analysis and a detailed report.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Can I change plans anytime?
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your 
                  next billing cycle.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Do unused credits roll over?
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Paid plan credits roll over for up to 3 months. Free plan credits reset each month.
                </p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  What payment methods do you accept?
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  We accept all major credit cards, PayPal, and cryptocurrency payments (ETH, USDC).
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Is there a free trial?
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Yes! The Professional plan includes a 14-day free trial with full access to all features.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Do you offer discounts for startups?
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Yes, we offer special pricing for startups and open-source projects. Contact us for details.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center bg-slate-900 dark:bg-slate-800 rounded-2xl p-12">
          <Shield className="h-12 w-12 text-blue-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to secure your smart contracts?
          </h2>
          <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
            Join thousands of developers who trust ChainProof for their smart contract security needs.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => window.location.href = '/signup'}>
              Start Free
            </Button>
            <Button size="lg" variant="outline" onClick={() => window.location.href = '/audit'}>
              Try Demo Audit
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}