'use client'

import Link from 'next/link'
import { Shield, Github, BookOpen, Code, MessageCircle, ExternalLink } from 'lucide-react'

export function Footer() {
  const footerLinks = {
    product: [
      { name: 'Audit', href: '/audit', icon: <Shield className="w-4 h-4" /> },
      { name: 'Dashboard', href: '/dashboard', icon: <Shield className="w-4 h-4" /> },
      { name: 'Teams', href: '/teams', icon: <Shield className="w-4 h-4" /> },
      { name: 'Pricing', href: '/pricing', icon: <Shield className="w-4 h-4" /> },
    ],
    resources: [
      { 
        name: 'API Reference', 
        href: '/docs/api', 
        icon: <BookOpen className="w-4 h-4" />,
        description: 'Complete API docs'
      },
      { 
        name: 'Examples', 
        href: '/docs/examples', 
        icon: <Code className="w-4 h-4" />,
        description: 'Code examples'
      },
      { 
        name: 'Documentation', 
        href: '/docs', 
        icon: <BookOpen className="w-4 h-4" />,
        description: 'Getting started'
      },
      { 
        name: 'Analytics', 
        href: '/analytics', 
        icon: <Shield className="w-4 h-4" />
      },
    ],
    company: [
      { name: 'About', href: '/about', icon: <Shield className="w-4 h-4" /> },
      { name: 'Blog', href: '/blog', icon: <Shield className="w-4 h-4" /> },
      { name: 'Careers', href: '/careers', icon: <Shield className="w-4 h-4" /> },
    ],
    support: [
      { 
        name: 'Support', 
        href: '/support', 
        icon: <MessageCircle className="w-4 h-4" />,
        description: 'Get help'
      },
      { name: 'Contact', href: '/contact', icon: <MessageCircle className="w-4 h-4" /> },
      { name: 'Status', href: '/status', icon: <Shield className="w-4 h-4" /> },
    ]
  }

  const socialLinks = [
    { 
      name: 'GitHub', 
      href: 'https://github.com/chainproof-ai', 
      icon: <Github className="w-5 h-5" />,
      description: 'View source code'
    },
    { 
      name: 'Twitter', 
      href: 'https://twitter.com/chainproofai', 
      icon: <MessageCircle className="w-5 h-5" />,
      description: 'Follow us'
    },
    { 
      name: 'Discord', 
      href: 'https://discord.gg/chainproof', 
      icon: <MessageCircle className="w-5 h-5" />,
      description: 'Join community'
    },
  ]

  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="relative w-8 h-8">
                <img
                  src="/chainproof-logo.png"
                  alt="ChainProof AI"
                  className="w-8 h-8 rounded-lg"
                />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                ChainProof AI
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              AI-powered smart contract security auditing platform with comprehensive vulnerability detection.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <Link
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  title={social.description}
                >
                  {social.icon}
                  <span className="sr-only">{social.name}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
              Product
            </h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    {link.icon}
                    <span>{link.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
              Resources
            </h3>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="group flex flex-col space-y-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      {link.icon}
                      <span>{link.name}</span>
                      {link.href.startsWith('http') && (
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      )}
                    </div>
                    {link.description && (
                      <span className="text-xs text-gray-500 dark:text-gray-500 ml-6">
                        {link.description}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
              Company
            </h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    {link.icon}
                    <span>{link.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
              Support
            </h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="group flex flex-col space-y-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      {link.icon}
                      <span>{link.name}</span>
                      {link.href.startsWith('http') && (
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      )}
                    </div>
                    {link.description && (
                      <span className="text-xs text-gray-500 dark:text-gray-500 ml-6">
                        {link.description}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              © 2024 ChainProof AI. All rights reserved.
            </div>
            <div className="flex space-x-6 text-sm">
              <Link 
                href="/privacy" 
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Privacy Policy
              </Link>
              <Link 
                href="/terms" 
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Terms of Service
              </Link>
              <Link 
                href="/security" 
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Security
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}