import { NextRequest, NextResponse } from 'next/server'
import { logger } from './logger'

export interface SecurityHeadersConfig {
  contentSecurityPolicy: {
    enabled: boolean
    directives: Record<string, string[]>
    reportOnly: boolean
    reportUri?: string
  }
  strictTransportSecurity: {
    enabled: boolean
    maxAge: number
    includeSubDomains: boolean
    preload: boolean
  }
  xFrameOptions: {
    enabled: boolean
    value: 'DENY' | 'SAMEORIGIN' | string
  }
  xContentTypeOptions: {
    enabled: boolean
  }
  referrerPolicy: {
    enabled: boolean
    value: string
  }
  permissionsPolicy: {
    enabled: boolean
    directives: Record<string, string[]>
  }
  crossOriginEmbedderPolicy: {
    enabled: boolean
    value: 'require-corp' | 'unsafe-none'
  }
  crossOriginOpenerPolicy: {
    enabled: boolean
    value: 'same-origin' | 'same-origin-allow-popups' | 'unsafe-none'
  }
  crossOriginResourcePolicy: {
    enabled: boolean
    value: 'same-site' | 'same-origin' | 'cross-origin'
  }
  xXSSProtection: {
    enabled: boolean
    value: string
  }
  expectCT: {
    enabled: boolean
    maxAge: number
    enforce: boolean
    reportUri?: string
  }
}

export class SecurityHeadersService {
  private config: SecurityHeadersConfig

  constructor(config?: Partial<SecurityHeadersConfig>) {
    this.config = {
      contentSecurityPolicy: {
        enabled: true,
        reportOnly: false,
        directives: {
          'default-src': ["'self'"],
          'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://vercel.live'],
          'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          'font-src': ["'self'", 'https://fonts.gstatic.com'],
          'img-src': ["'self'", 'data:', 'https:'],
          'connect-src': ["'self'", 'https://api.openai.com', 'wss://ws.pusher.com'],
          'frame-ancestors': ["'none'"],
          'base-uri': ["'self'"],
          'form-action': ["'self'"],
          'upgrade-insecure-requests': []
        }
      },
      strictTransportSecurity: {
        enabled: true,
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
      },
      xFrameOptions: {
        enabled: true,
        value: 'DENY'
      },
      xContentTypeOptions: {
        enabled: true
      },
      referrerPolicy: {
        enabled: true,
        value: 'strict-origin-when-cross-origin'
      },
      permissionsPolicy: {
        enabled: true,
        directives: {
          'camera': [],
          'microphone': [],
          'geolocation': [],
          'payment': [],
          'usb': [],
          'magnetometer': [],
          'gyroscope': [],
          'accelerometer': []
        }
      },
      crossOriginEmbedderPolicy: {
        enabled: true,
        value: 'require-corp'
      },
      crossOriginOpenerPolicy: {
        enabled: true,
        value: 'same-origin'
      },
      crossOriginResourcePolicy: {
        enabled: true,
        value: 'same-origin'
      },
      xXSSProtection: {
        enabled: true,
        value: '1; mode=block'
      },
      expectCT: {
        enabled: true,
        maxAge: 86400, // 24 hours
        enforce: true
      },
      ...config
    }
  }

  /**
   * Generate Content Security Policy header value
   */
  private generateCSPHeader(): string {
    const directives = Object.entries(this.config.contentSecurityPolicy.directives)
      .map(([directive, values]) => {
        if (values.length === 0) {
          return directive
        }
        return `${directive} ${values.join(' ')}`
      })
      .join('; ')

    return directives
  }

  /**
   * Generate Permissions Policy header value
   */
  private generatePermissionsPolicyHeader(): string {
    return Object.entries(this.config.permissionsPolicy.directives)
      .map(([directive, values]) => {
        if (values.length === 0) {
          return `${directive}=()`
        }
        return `${directive}=(${values.join(' ')})`
      })
      .join(', ')
  }

  /**
   * Apply security headers to response
   */
  applyHeaders(response: NextResponse, request?: NextRequest): NextResponse {
    try {
      // Content Security Policy
      if (this.config.contentSecurityPolicy.enabled) {
        const cspHeader = this.config.contentSecurityPolicy.reportOnly 
          ? 'Content-Security-Policy-Report-Only'
          : 'Content-Security-Policy'
        
        let cspValue = this.generateCSPHeader()
        
        if (this.config.contentSecurityPolicy.reportUri) {
          cspValue += `; report-uri ${this.config.contentSecurityPolicy.reportUri}`
        }
        
        response.headers.set(cspHeader, cspValue)
      }

      // Strict Transport Security (HTTPS only)
      if (this.config.strictTransportSecurity.enabled && request?.url.startsWith('https://')) {
        let hstsValue = `max-age=${this.config.strictTransportSecurity.maxAge}`
        
        if (this.config.strictTransportSecurity.includeSubDomains) {
          hstsValue += '; includeSubDomains'
        }
        
        if (this.config.strictTransportSecurity.preload) {
          hstsValue += '; preload'
        }
        
        response.headers.set('Strict-Transport-Security', hstsValue)
      }

      // X-Frame-Options
      if (this.config.xFrameOptions.enabled) {
        response.headers.set('X-Frame-Options', this.config.xFrameOptions.value)
      }

      // X-Content-Type-Options
      if (this.config.xContentTypeOptions.enabled) {
        response.headers.set('X-Content-Type-Options', 'nosniff')
      }

      // Referrer Policy
      if (this.config.referrerPolicy.enabled) {
        response.headers.set('Referrer-Policy', this.config.referrerPolicy.value)
      }

      // Permissions Policy
      if (this.config.permissionsPolicy.enabled) {
        response.headers.set('Permissions-Policy', this.generatePermissionsPolicyHeader())
      }

      // Cross-Origin Embedder Policy
      if (this.config.crossOriginEmbedderPolicy.enabled) {
        response.headers.set('Cross-Origin-Embedder-Policy', this.config.crossOriginEmbedderPolicy.value)
      }

      // Cross-Origin Opener Policy
      if (this.config.crossOriginOpenerPolicy.enabled) {
        response.headers.set('Cross-Origin-Opener-Policy', this.config.crossOriginOpenerPolicy.value)
      }

      // Cross-Origin Resource Policy
      if (this.config.crossOriginResourcePolicy.enabled) {
        response.headers.set('Cross-Origin-Resource-Policy', this.config.crossOriginResourcePolicy.value)
      }

      // X-XSS-Protection
      if (this.config.xXSSProtection.enabled) {
        response.headers.set('X-XSS-Protection', this.config.xXSSProtection.value)
      }

      // Expect-CT (HTTPS only)
      if (this.config.expectCT.enabled && request?.url.startsWith('https://')) {
        let expectCTValue = `max-age=${this.config.expectCT.maxAge}`
        
        if (this.config.expectCT.enforce) {
          expectCTValue += ', enforce'
        }
        
        if (this.config.expectCT.reportUri) {
          expectCTValue += `, report-uri="${this.config.expectCT.reportUri}"`
        }
        
        response.headers.set('Expect-CT', expectCTValue)
      }

      // Additional security headers
      response.headers.set('X-DNS-Prefetch-Control', 'off')
      response.headers.set('X-Download-Options', 'noopen')
      response.headers.set('X-Permitted-Cross-Domain-Policies', 'none')

      logger.debug('Security headers applied', {
        url: request?.url,
        headers: Object.fromEntries(response.headers.entries())
      })

      return response
    } catch (error) {
      logger.error('Failed to apply security headers', { error })
      return response
    }
  }

  /**
   * Middleware function for applying security headers
   */
  middleware() {
    return (request: NextRequest): NextResponse => {
      const response = NextResponse.next()
      return this.applyHeaders(response, request)
    }
  }

  /**
   * Update CSP directives dynamically
   */
  updateCSPDirective(directive: string, values: string[]): void {
    this.config.contentSecurityPolicy.directives[directive] = values
    logger.info('CSP directive updated', { directive, values })
  }

  /**
   * Add CSP source to existing directive
   */
  addCSPSource(directive: string, source: string): void {
    if (!this.config.contentSecurityPolicy.directives[directive]) {
      this.config.contentSecurityPolicy.directives[directive] = []
    }
    
    if (!this.config.contentSecurityPolicy.directives[directive].includes(source)) {
      this.config.contentSecurityPolicy.directives[directive].push(source)
      logger.info('CSP source added', { directive, source })
    }
  }

  /**
   * Remove CSP source from directive
   */
  removeCSPSource(directive: string, source: string): void {
    if (this.config.contentSecurityPolicy.directives[directive]) {
      this.config.contentSecurityPolicy.directives[directive] = 
        this.config.contentSecurityPolicy.directives[directive].filter(s => s !== source)
      logger.info('CSP source removed', { directive, source })
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): SecurityHeadersConfig {
    return { ...this.config }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<SecurityHeadersConfig>): void {
    this.config = { ...this.config, ...newConfig }
    logger.info('Security headers configuration updated')
  }

  /**
   * Generate security headers report
   */
  generateSecurityReport(): {
    enabled: string[]
    disabled: string[]
    configuration: SecurityHeadersConfig
  } {
    const enabled: string[] = []
    const disabled: string[] = []

    Object.entries(this.config).forEach(([key, value]) => {
      if (typeof value === 'object' && 'enabled' in value) {
        if (value.enabled) {
          enabled.push(key)
        } else {
          disabled.push(key)
        }
      }
    })

    return {
      enabled,
      disabled,
      configuration: this.config
    }
  }
}

// Default security headers service instance
export const securityHeaders = new SecurityHeadersService()

/**
 * Higher-order function to wrap API routes with security headers
 */
export function withSecurityHeaders<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const response = await handler(request, ...args)
    return securityHeaders.applyHeaders(response, request)
  }
}