import '@testing-library/jest-dom'

// Mock @auth/prisma-adapter to fix ES module issues
jest.mock('@auth/prisma-adapter', () => ({
  PrismaAdapter: jest.fn(() => ({
    createUser: jest.fn(),
    getUser: jest.fn(),
    getUserByEmail: jest.fn(),
    getUserByAccount: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
    linkAccount: jest.fn(),
    unlinkAccount: jest.fn(),
    createSession: jest.fn(),
    getSessionAndUser: jest.fn(),
    updateSession: jest.fn(),
    deleteSession: jest.fn(),
    createVerificationToken: jest.fn(),
    useVerificationToken: jest.fn(),
  })),
}))

// Mock z-ai-web-dev-sdk to fix ES module issues
jest.mock('z-ai-web-dev-sdk', () => ({
  default: jest.fn(),
  ZAI: jest.fn(),
}), { virtual: true })

// Mock jose library to fix ES module issues
jest.mock('jose', () => ({
  jwtVerify: jest.fn(),
  SignJWT: jest.fn(),
  importSPKI: jest.fn(),
  importPKCS8: jest.fn(),
  EncryptJWT: jest.fn(),
  jwtDecrypt: jest.fn(),
}))

// Mock next-auth/jwt to fix ES module issues
jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn(),
  encode: jest.fn(),
  decode: jest.fn(),
}))

// Polyfill Web APIs for Next.js
global.Request = global.Request || class Request {
  constructor(url, options = {}) {
    this.url = url
    this.method = options.method || 'GET'
    this.headers = new Map(Object.entries(options.headers || {}))
    this.body = options.body
  }
  
  async json() {
    return JSON.parse(this.body || '{}')
  }
}

global.Response = global.Response || class Response {
  constructor(body, options = {}) {
    this.body = body
    this.status = options.status || 200
    this.headers = new Map(Object.entries(options.headers || {}))
  }
  
  static json(data, options = {}) {
    return new Response(JSON.stringify(data), {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers }
    })
  }
  
  async json() {
    return JSON.parse(this.body || '{}')
  }
}

global.Headers = global.Headers || class Headers {
  constructor(init = {}) {
    this.map = new Map(Object.entries(init))
  }
  
  get(name) {
    return this.map.get(name.toLowerCase())
  }
  
  set(name, value) {
    this.map.set(name.toLowerCase(), value)
  }
}

global.ReadableStream = global.ReadableStream || class ReadableStream {}

// Mock NextRequest specifically
jest.mock('next/server', () => ({
  NextRequest: jest.fn().mockImplementation((url, options = {}) => ({
    url,
    method: options.method || 'GET',
    headers: new Map(Object.entries(options.headers || {})),
    body: options.body,
    cookies: {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
    },
    async json() {
      return JSON.parse(options.body || '{}')
    }
  })),
  NextResponse: {
    json: jest.fn((data, options = {}) => ({
      status: options.status || 200,
      headers: options.headers || {},
      json: async () => data
    }))
  }
}))

// Polyfill TextEncoder and TextDecoder for jose library
const { TextEncoder, TextDecoder } = require('util')
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
    }
  },
}))

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock environment variables
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.DATABASE_URL = 'file:./test.db'

// Database mocks will be handled in individual test files

// ZAI SDK mocks will be handled in individual test files

// Socket.IO mocks will be handled in individual test files

// Global test utilities
global.fetch = jest.fn()

// Suppress console warnings in tests
const originalWarn = console.warn
beforeAll(() => {
  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is deprecated')
    ) {
      return
    }
    originalWarn.call(console, ...args)
  }
})

afterAll(() => {
  console.warn = originalWarn
})