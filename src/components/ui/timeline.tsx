'use client'

import { Card, CardContent } from './card'
import { Badge } from './badge'
import { 
  Rocket, 
  Lightbulb, 
  GitBranch, 
  Award, 
  Shield, 
  Users, 
  Target, 
  Heart,
  Calendar,
  MapPin,
  BookOpen,
  TrendingUp,
  Building
} from 'lucide-react'

interface TimelineItem {
  date: string
  title: string
  description: string
  icon: string
}

interface TimelineProps {
  items: TimelineItem[]
  className?: string
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Rocket,
  Lightbulb,
  GitBranch,
  Award,
  Shield,
  Users,
  Target,
  Heart,
  Calendar,
  MapPin,
  BookOpen,
  TrendingUp,
  Building
}

export function Timeline({ items, className = '' }: TimelineProps) {
  return (
    <div className={`relative ${className}`}>
      {/* Timeline line */}
      <div className="absolute left-8 md:left-1/2 transform md:-translate-x-1/2 w-0.5 h-full bg-gray-200 dark:bg-gray-700" />
      
      <div className="space-y-12">
        {items.map((item, index) => {
          const IconComponent = iconMap[item.icon] || Rocket
          const isEven = index % 2 === 0
          
          return (
            <div
              key={index}
              className={`relative flex items-center ${
                isEven ? 'md:flex-row' : 'md:flex-row-reverse'
              }`}
            >
              {/* Timeline dot */}
              <div className="absolute left-8 md:left-1/2 transform md:-translate-x-1/2 w-16 h-16 bg-white dark:bg-slate-900 border-4 border-blue-600 dark:border-blue-400 rounded-full flex items-center justify-center z-10">
                <IconComponent className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              
              {/* Content */}
              <div className={`ml-24 md:ml-0 md:w-5/12 ${isEven ? 'md:pr-8 md:text-right' : 'md:pl-8 md:ml-auto'}`}>
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className={`flex items-center gap-2 mb-2 ${isEven ? 'md:justify-end' : ''}`}>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {item.date}
                      </Badge>
                    </div>
                    <h3 className={`text-xl font-semibold text-gray-900 dark:text-white mb-2 ${isEven ? 'md:text-right' : ''}`}>
                      {item.title}
                    </h3>
                    <p className={`text-gray-600 dark:text-gray-300 ${isEven ? 'md:text-right' : ''}`}>
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}