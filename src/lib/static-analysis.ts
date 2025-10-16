import { withErrorHandler, ExternalServiceError } from './error-handler'
import { vulnerabilityDatabase } from './vulnerability-database'

export interface StaticAnalysisResult {
  tool: string
  vulnerabilities: Vulnerability[]
  metrics: AnalysisMetrics
  executionTime: number
}

export interface Vulnerability {
  id: string
  title: string
  type: string
  description: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO'
  category: string
  lineNumbers: number[]
  codeSnippet?: string
  recommendation: string
  cweId?: string
  swcId?: string
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
}

export interface AnalysisMetrics {
  totalLines: number
  complexityScore: number
  functionsAnalyzed: number
  contractsAnalyzed: number
  gasEstimate?: number
}

export class StaticAnalyzer {
  private tools: Map<string, AnalysisTool> = new Map()

  constructor() {
    this.initializeTools()
  }

  private initializeTools() {
    // Initialize available analysis tools
    this.tools.set('slither', new SlitherAnalyzer())
    this.tools.set('mythril', new MythrilAnalyzer())
    this.tools.set('custom', new CustomPatternAnalyzer())
  }

  async analyzeContract(sourceCode: string, tools: string[] = ['slither', 'custom']): Promise<StaticAnalysisResult[]> {
    const results: StaticAnalysisResult[] = []

    for (const toolName of tools) {
      const tool = this.tools.get(toolName)
      if (tool) {
        try {
          const result = await tool.analyze(sourceCode)
          results.push(result)
        } catch (error) {
          console.warn(`Static analysis tool ${toolName} failed:`, error)
          // Continue with other tools even if one fails
        }
      }
    }

    return results
  }

  async getConsensusAnalysis(results: StaticAnalysisResult[]): Promise<{
    vulnerabilities: Vulnerability[]
    confidence: number
    metrics: AnalysisMetrics
    summary: {
      overallScore: number
      riskLevel: string
      totalVulnerabilities: number
      toolsUsed: string[]
    }
  }> {
    // Aggregate vulnerabilities from multiple tools
    const vulnerabilityMap = new Map<string, Vulnerability>()
    
    results.forEach(result => {
      result.vulnerabilities.forEach(vuln => {
        const key = `${vuln.title}_${vuln.lineNumbers.join('_')}`
        const existing = vulnerabilityMap.get(key)
        
        if (existing) {
          // Increase confidence if multiple tools detect the same vulnerability
          if (existing.confidence === 'LOW' && vuln.confidence === 'HIGH') {
            existing.confidence = 'HIGH'
          } else if (existing.confidence === 'LOW' && vuln.confidence === 'MEDIUM') {
            existing.confidence = 'MEDIUM'
          }
          
          // Merge recommendations
          if (vuln.recommendation && !existing.recommendation.includes(vuln.recommendation)) {
            existing.recommendation += `\n\nAdditional recommendation: ${vuln.recommendation}`
          }
        } else {
          vulnerabilityMap.set(key, { ...vuln })
        }
      })
    })

    const vulnerabilities = Array.from(vulnerabilityMap.values())
    
    // Calculate overall confidence based on tool agreement
    const totalVulnerabilities = results.reduce((sum, result) => sum + result.vulnerabilities.length, 0)
    const consensusVulnerabilities = vulnerabilities.length
    const confidence = totalVulnerabilities > 0 ? consensusVulnerabilities / totalVulnerabilities : 1

    // Aggregate metrics
    const validResults = results.filter(r => r.metrics)
    const metrics: AnalysisMetrics = {
      totalLines: validResults.length > 0 ? Math.max(...validResults.map(r => r.metrics.totalLines)) : 0,
      complexityScore: validResults.length > 0 ? Math.max(...validResults.map(r => r.metrics.complexityScore)) : 0,
      functionsAnalyzed: validResults.length > 0 ? Math.max(...validResults.map(r => r.metrics.functionsAnalyzed)) : 0,
      contractsAnalyzed: validResults.length > 0 ? Math.max(...validResults.map(r => r.metrics.contractsAnalyzed)) : 0,
      gasEstimate: validResults.find(r => r.metrics.gasEstimate)?.metrics.gasEstimate
    }

    // Generate summary
    const highVulns = vulnerabilities.filter(v => v.severity === 'HIGH').length
    const mediumVulns = vulnerabilities.filter(v => v.severity === 'MEDIUM').length
    const lowVulns = vulnerabilities.filter(v => v.severity === 'LOW').length
    
    // Calculate overall score (0-100, higher is better)
    const overallScore = Math.max(0, 100 - (highVulns * 30 + mediumVulns * 15 + lowVulns * 5))
    
    // Determine risk level
    let riskLevel = 'LOW'
    if (highVulns > 0 || mediumVulns > 2) {
      riskLevel = 'HIGH'
    } else if (mediumVulns > 0 || lowVulns > 3) {
      riskLevel = 'MEDIUM'
    }
    
    const summary = {
      overallScore,
      riskLevel,
      totalVulnerabilities: vulnerabilities.length,
      toolsUsed: results.map(r => r.tool).filter((tool, index, arr) => arr.indexOf(tool) === index)
    }

    return { vulnerabilities, confidence, metrics, summary }
  }
}

interface AnalysisTool {
  analyze(sourceCode: string): Promise<StaticAnalysisResult>
}

class SlitherAnalyzer implements AnalysisTool {
  async analyze(sourceCode: string): Promise<StaticAnalysisResult> {
    const startTime = Date.now()
    
    try {
      // In a real implementation, this would call the actual Slither tool
      // For now, we'll simulate Slither analysis with pattern matching
      const vulnerabilities = this.performSlitherPatternAnalysis(sourceCode)
      const metrics = this.calculateMetrics(sourceCode)
      
      return {
        tool: 'slither',
        vulnerabilities,
        metrics,
        executionTime: Date.now() - startTime
      }
    } catch (error) {
      throw new ExternalServiceError('Slither analysis failed')
    }
  }

  private performSlitherPatternAnalysis(sourceCode: string): Vulnerability[] {
    const vulnerabilities: Vulnerability[] = []
    const lines = sourceCode.split('\n')

    // Use vulnerability database for enhanced pattern detection
    const dbResults = vulnerabilityDatabase.enhanceVulnerabilityDetection(sourceCode)
    
    dbResults.forEach(({ pattern, matches }) => {
      matches.forEach(match => {
        vulnerabilities.push({
          id: `${pattern.id}_${match.line}`,
          title: pattern.title,
          type: pattern.category.toLowerCase().replace(/\s+/g, '_'),
          description: pattern.description,
          severity: pattern.severity,
          category: pattern.category,
          lineNumbers: [match.line],
          codeSnippet: match.snippet,
          recommendation: pattern.recommendations.join('. '),
          cweId: pattern.cweId,
          swcId: pattern.swcId,
          confidence: match.confidence > 0.8 ? 'HIGH' : match.confidence > 0.5 ? 'MEDIUM' : 'LOW'
        })
      })
    })

    // Keep existing specific pattern matching for complex cases
    // Reentrancy detection (more specific than database patterns)
    const reentrancyPattern = /(\w+)\.call\s*\(\s*.*?\s*\)\s*;?\s*\n\s*(\w+)\[\w+\]\s*=/g
    const reentrancyMatches = Array.from(sourceCode.matchAll(reentrancyPattern))
    for (const match of reentrancyMatches) {
      const lineNumber = this.getLineNumber(sourceCode, match.index!)
      vulnerabilities.push({
        id: `reentrancy_complex_${lineNumber}`,
        title: 'Complex Reentrancy Vulnerability',
        type: 'reentrancy',
        description: 'External call followed by state change creates potential for reentrancy attack with complex execution flow',
        severity: 'HIGH',
        category: 'Reentrancy',
        lineNumbers: [lineNumber, lineNumber + 1],
        codeSnippet: lines.slice(Math.max(0, lineNumber - 2), lineNumber + 3).join('\n'),
        recommendation: 'Implement checks-effects-interactions pattern. Use reentrancy guards or OpenZeppelin\'s ReentrancyGuard.',
        cweId: 'CWE-841',
        swcId: 'SWC-107',
        confidence: 'HIGH'
      })
    }

    // Additional complex patterns that go beyond the database
    this.detectComplexVulnerabilities(sourceCode, lines, vulnerabilities)

    return vulnerabilities
  }

  private detectComplexVulnerabilities(sourceCode: string, lines: string[], vulnerabilities: Vulnerability[]) {
    // Detect complex race conditions
    const raceConditionPattern = /require\s*\(\s*\w+\s*>\s*block\.number\s*\)/g
    const raceMatches = Array.from(sourceCode.matchAll(raceConditionPattern))
    for (const match of raceMatches) {
      const lineNumber = this.getLineNumber(sourceCode, match.index!)
      vulnerabilities.push({
        id: `race_condition_${lineNumber}`,
        title: 'Block Number Race Condition',
        type: 'front_running',
        description: 'Using block.number for timing can create race conditions in block propagation',
        severity: 'MEDIUM',
        category: 'Front-Running',
        lineNumbers: [lineNumber],
        codeSnippet: lines[lineNumber - 1],
        recommendation: 'Use commit-reveal schemes or implement proper time-based delays with randomness.',
        cweId: 'CWE-664',
        swcId: 'SWC-120',
        confidence: 'MEDIUM'
      })
    }

    // Detect oracle manipulation
    const oraclePattern = /uint256\s+price\s*=\s*(uniswapV2|chainlink|price)/gi
    const oracleMatches = Array.from(sourceCode.matchAll(oraclePattern))
    for (const match of oracleMatches) {
      const lineNumber = this.getLineNumber(sourceCode, match.index!)
      if (!sourceCode.includes('delay') && !sourceCode.includes('twap')) {
        vulnerabilities.push({
          id: `oracle_manipulation_${lineNumber}`,
          title: 'Potential Oracle Manipulation',
          type: 'oracle_manipulation',
          description: 'Oracle price usage without delay or TWAP mechanism can be manipulated',
          severity: 'HIGH',
          category: 'Oracle Manipulation',
          lineNumbers: [lineNumber],
          codeSnippet: lines[lineNumber - 1],
          recommendation: 'Implement TWAP (Time-Weighted Average Price) or add delay mechanisms for oracle usage.',
          confidence: 'MEDIUM'
        })
      }
    }
  }

  private calculateMetrics(sourceCode: string): AnalysisMetrics {
    const lines = sourceCode.split('\n')
    const contracts = (sourceCode.match(/contract\s+\w+/g) || []).length
    const functions = (sourceCode.match(/function\s+\w+/g) || []).length
    
    // Simple complexity calculation based on control flow
    const complexityKeywords = ['if', 'else', 'for', 'while', 'require', 'assert', 'revert']
    let complexityScore = 0
    complexityKeywords.forEach(keyword => {
      const matches = sourceCode.match(new RegExp(`\\b${keyword}\\b`, 'g'))
      complexityScore += matches?.length || 0
    })

    return {
      totalLines: lines.length,
      complexityScore,
      functionsAnalyzed: functions,
      contractsAnalyzed: contracts
    }
  }

  private getLineNumber(sourceCode: string, index: number): number {
    return sourceCode.substring(0, index).split('\n').length
  }
}

class MythrilAnalyzer implements AnalysisTool {
  async analyze(sourceCode: string): Promise<StaticAnalysisResult> {
    const startTime = Date.now()
    
    try {
      // Simulate Mythril symbolic execution analysis
      const vulnerabilities = this.performMythrilAnalysis(sourceCode)
      const metrics = this.calculateMythrilMetrics(sourceCode)
      
      return {
        tool: 'mythril',
        vulnerabilities,
        metrics,
        executionTime: Date.now() - startTime
      }
    } catch (error) {
      throw new ExternalServiceError('Mythril analysis failed')
    }
  }

  private performMythrilAnalysis(sourceCode: string): Vulnerability[] {
    const vulnerabilities: Vulnerability[] = []
    const lines = sourceCode.split('\n')

    // Selfdestruct detection
    const selfdestructPattern = /selfdestruct\s*\(\s*\w+\s*\)/g
    const selfdestructMatches = Array.from(sourceCode.matchAll(selfdestructPattern))
    for (const match of selfdestructMatches) {
      const lineNumber = this.getLineNumber(sourceCode, match.index!)
      vulnerabilities.push({
        id: `selfdestruct_${lineNumber}`,
        title: 'Selfdestruct Usage Detected',
        type: 'denial_of_service',
        description: 'Selfdestruct can be used maliciously to destroy contracts and drain funds',
        severity: 'CRITICAL',
        category: 'Denial of Service',
        lineNumbers: [lineNumber],
        codeSnippet: lines[lineNumber - 1],
        recommendation: 'Avoid using selfdestruct. Consider using upgrade patterns or pausable contracts instead.',
        cweId: 'CWE-755',
        swcId: 'SWC-106',
        confidence: 'HIGH'
      })
    }

    // Delegatecall to user-supplied address
    const delegatecallPattern = /delegatecall\s*\(\s*[^)]*\w+[^)]*\s*\)/g
    const delegatecallMatches = Array.from(sourceCode.matchAll(delegatecallPattern))
    for (const match of delegatecallMatches) {
      const lineNumber = this.getLineNumber(sourceCode, match.index!)
      if (!match[0].includes('immutable') && !match[0].includes('constant')) {
        vulnerabilities.push({
          id: `delegatecall_${lineNumber}`,
          title: 'Dangerous Delegatecall',
          type: 'delegatecall',
          description: 'Delegatecall to user-supplied address can lead to code injection',
          severity: 'CRITICAL',
          category: 'Delegatecall',
          lineNumbers: [lineNumber],
          codeSnippet: lines[lineNumber - 1],
          recommendation: 'Avoid delegatecall to user-supplied addresses. Use verified implementation contracts.',
          cweId: 'CWE-94',
          swcId: 'SWC-112',
          confidence: 'HIGH'
        })
      }
    }

    // Timestamp dependence
    const timestampPattern = /block\.timestamp|now\s*;/g
    const timestampMatches = Array.from(sourceCode.matchAll(timestampPattern))
    for (const match of timestampMatches) {
      const lineNumber = this.getLineNumber(sourceCode, match.index!)
      vulnerabilities.push({
        id: `timestamp_${lineNumber}`,
        title: 'Timestamp Dependence',
        type: 'bad_randomness',
        description: 'Using block.timestamp for critical logic can be manipulated by miners',
        severity: 'LOW',
        category: 'Bad Randomness',
        lineNumbers: [lineNumber],
        codeSnippet: lines[lineNumber - 1],
        recommendation: 'Avoid using block.timestamp for critical operations. Use block.number or external randomness sources.',
        cweId: 'CWE-642',
        swcId: 'SWC-116',
        confidence: 'MEDIUM'
      })
    }

    return vulnerabilities
  }

  private calculateMythrilMetrics(sourceCode: string): AnalysisMetrics {
    const lines = sourceCode.split('\n')
    const contracts = (sourceCode.match(/contract\s+\w+/g) || []).length
    const functions = (sourceCode.match(/function\s+\w+/g) || []).length
    
    // Symbolic execution complexity estimation
    const storageVariables = (sourceCode.match(/\w+\s+(public|private|internal)\s+\w+/g) || []).length
    const externalCalls = (sourceCode.match(/\.\s*(call|delegatecall|staticcall)/g) || []).length
    
    const complexityScore = storageVariables * 2 + externalCalls * 3

    return {
      totalLines: lines.length,
      complexityScore,
      functionsAnalyzed: functions,
      contractsAnalyzed: contracts
    }
  }

  private getLineNumber(sourceCode: string, index: number): number {
    return sourceCode.substring(0, index).split('\n').length
  }
}

class CustomPatternAnalyzer implements AnalysisTool {
  async analyze(sourceCode: string): Promise<StaticAnalysisResult> {
    const startTime = Date.now()
    
    try {
      const vulnerabilities = this.performCustomPatternAnalysis(sourceCode)
      const metrics = this.calculateCustomMetrics(sourceCode)
      
      return {
        tool: 'custom',
        vulnerabilities,
        metrics,
        executionTime: Date.now() - startTime
      }
    } catch (error) {
      throw new ExternalServiceError('Custom pattern analysis failed')
    }
  }

  private performCustomPatternAnalysis(sourceCode: string): Vulnerability[] {
    const vulnerabilities: Vulnerability[] = []
    const lines = sourceCode.split('\n')

    // Reentrancy vulnerabilities
    const reentrancyIssues = this.detectReentrancy(sourceCode, lines)
    vulnerabilities.push(...reentrancyIssues)

    // External call vulnerabilities
    const externalCallIssues = this.detectExternalCalls(sourceCode, lines)
    vulnerabilities.push(...externalCallIssues)

    // Gas optimization issues
    const gasIssues = this.detectGasIssues(sourceCode, lines)
    vulnerabilities.push(...gasIssues)

    // Logic errors
    const logicErrors = this.detectLogicErrors(sourceCode, lines)
    vulnerabilities.push(...logicErrors)

    // Event logging issues
    const eventIssues = this.detectEventIssues(sourceCode, lines)
    vulnerabilities.push(...eventIssues)

    return vulnerabilities
  }

  private detectReentrancy(sourceCode: string, lines: string[]): Vulnerability[] {
    const vulnerabilities: Vulnerability[] = []

    // Extract functions properly handling nested braces
    const functions = this.extractFunctions(sourceCode)
    
    for (const functionCode of functions) {
      // Check if function has external calls
      const hasExternalCall = /\.call(\{[^}]*\})?\s*\([^)]*\)/.test(functionCode)
      
      // Check if function has state changes (fixed to handle msg.sender)
      const hasStateChange = /balances?\[[^\]]+\]\s*[-+*/]?=|\w+\[[^\]]+\]\s*[-+*/]?=/.test(functionCode)
      
      if (hasExternalCall && hasStateChange) {
        // Find the line number of the external call
        const callMatch = functionCode.match(/\.call(\{[^}]*\})?\s*\([^)]*\)/)
        if (callMatch) {
          const callIndex = sourceCode.indexOf(callMatch[0])
          const lineNumber = this.getLineNumber(sourceCode, callIndex)
          
          vulnerabilities.push({
            id: `reentrancy_${lineNumber}`,
            title: 'Reentrancy Vulnerability',
            type: 'reentrancy',
            description: 'External call made in same function as state update, allowing potential reentrancy attacks',
            severity: 'HIGH',
            category: 'Reentrancy',
            lineNumbers: [lineNumber],
            codeSnippet: lines.slice(Math.max(0, lineNumber - 2), lineNumber + 3).join('\n'),
            recommendation: 'Use the checks-effects-interactions pattern: update state before external calls, or use reentrancy guards.',
            confidence: 'HIGH'
          })
        }
      }
    }

    return vulnerabilities
  }

  private extractFunctions(code: string): string[] {
    const functions: string[] = []
    const functionStarts: { start: number; openBrace: number }[] = []
    let match
    const functionRegex = /function\s+\w+[^{]*\{/g
    
    while ((match = functionRegex.exec(code)) !== null) {
      functionStarts.push({
        start: match.index,
        openBrace: match.index + match[0].length - 1
      })
    }
    
    for (const funcStart of functionStarts) {
      let braceCount = 1
      let i = funcStart.openBrace + 1
      
      while (i < code.length && braceCount > 0) {
        if (code[i] === '{') braceCount++
        else if (code[i] === '}') braceCount--
        i++
      }
      
      if (braceCount === 0) {
        functions.push(code.substring(funcStart.start, i))
      }
    }
    
    return functions
  }

  private detectExternalCalls(sourceCode: string, lines: string[]): Vulnerability[] {
    const vulnerabilities: Vulnerability[] = []

    // Pattern: unchecked external calls
    const uncheckedCallPattern = /(\w+)\.call\s*\([^)]*\)\s*;(?!\s*require)/g
    const matches = Array.from(sourceCode.matchAll(uncheckedCallPattern))
    
    for (const match of matches) {
      const lineNumber = this.getLineNumber(sourceCode, match.index!)
      vulnerabilities.push({
         id: `external_call_${lineNumber}`,
         title: 'Unchecked External Call',
         type: 'external_call',
         description: 'External call without checking return value can fail silently',
         severity: 'MEDIUM',
         category: 'External Call',
         lineNumbers: [lineNumber],
         codeSnippet: lines[lineNumber - 1],
         recommendation: 'Check the return value of external calls or use require() to handle failures.',
         confidence: 'HIGH'
       })
    }

    return vulnerabilities
  }

  private detectGasIssues(sourceCode: string, lines: string[]): Vulnerability[] {
    const vulnerabilities: Vulnerability[] = []

    // Loop with storage operations
    const loopPattern = /for\s*\([^)]*\)\s*{[\s\S]*?\w+\[\w+\]/g
    const loopMatches = Array.from(sourceCode.matchAll(loopPattern))
    for (const match of loopMatches) {
      const lineNumber = this.getLineNumber(sourceCode, match.index!)
      vulnerabilities.push({
        id: `gas_loop_${lineNumber}`,
        title: 'Gas-Intensive Loop with Storage Operations',
        type: 'gas_optimization',
        description: 'Loop that performs storage operations can cause high gas costs',
        severity: 'MEDIUM',
        category: 'Gas Optimization',
        lineNumbers: [lineNumber],
        codeSnippet: lines.slice(Math.max(0, lineNumber - 2), lineNumber + 3).join('\n'),
        recommendation: 'Consider using mappings or batch operations to reduce gas costs.',
        confidence: 'MEDIUM'
      })
    }

    // Unnecessary storage reads
    const storageReadPattern = /\w+\[\w+\]\s*;?\s*\n\s*\w+\[\w+\]/g
    const storageMatches = Array.from(sourceCode.matchAll(storageReadPattern))
    for (const match of storageMatches) {
      const lineNumber = this.getLineNumber(sourceCode, match.index!)
      vulnerabilities.push({
        id: `gas_storage_${lineNumber}`,
        title: 'Duplicate Storage Read',
        type: 'gas_optimization',
        description: 'Same storage variable read multiple times without modification',
        severity: 'LOW',
        category: 'Gas Optimization',
        lineNumbers: [lineNumber],
        codeSnippet: lines.slice(lineNumber - 1, lineNumber + 2).join('\n'),
        recommendation: 'Cache storage reads in local variables to reduce gas costs.',
        confidence: 'HIGH'
      })
    }

    return vulnerabilities
  }

  private detectLogicErrors(sourceCode: string, lines: string[]): Vulnerability[] {
    const vulnerabilities: Vulnerability[] = []

    // Division by zero potential
    const divisionPattern = /\/\s*\w+(?!\s*.*require\s*\(\s*\w+\s*>\s*0)/g
    const divisionMatches = Array.from(sourceCode.matchAll(divisionPattern))
    for (const match of divisionMatches) {
      const lineNumber = this.getLineNumber(sourceCode, match.index!)
      vulnerabilities.push({
        id: `division_${lineNumber}`,
        title: 'Potential Division by Zero',
        type: 'logic_error',
        description: 'Division operation without zero check can cause revert',
        severity: 'MEDIUM',
        category: 'Logic Error',
        lineNumbers: [lineNumber],
        codeSnippet: lines[lineNumber - 1],
        recommendation: 'Add zero check before division operations or use SafeMath.',
        confidence: 'LOW'
      })
    }

    return vulnerabilities
  }

  private detectEventIssues(sourceCode: string, lines: string[]): Vulnerability[] {
    const vulnerabilities: Vulnerability[] = []

    // Missing events for state changes
    const stateChangePattern = /\w+\[\w+\]\s*=\s*\w+/g
    const stateChangeMatches = Array.from(sourceCode.matchAll(stateChangePattern))
    for (const match of stateChangeMatches) {
      const lineNumber = this.getLineNumber(sourceCode, match.index!)
      const functionScope = this.getFunctionScope(sourceCode, lineNumber)
      
      if (functionScope && !functionScope.includes('emit ')) {
        vulnerabilities.push({
          id: `event_${lineNumber}`,
          title: 'Missing Event for State Change',
          type: 'event_logging',
          description: 'State change without corresponding event emission',
          severity: 'LOW',
          category: 'Event Logging',
          lineNumbers: [lineNumber],
          codeSnippet: lines[lineNumber - 1],
          recommendation: 'Emit events for important state changes to improve transparency.',
          confidence: 'MEDIUM'
        })
      }
    }

    return vulnerabilities
  }

  private calculateCustomMetrics(sourceCode: string): AnalysisMetrics {
    const lines = sourceCode.split('\n')
    const contracts = (sourceCode.match(/contract\s+\w+/g) || []).length
    const functions = (sourceCode.match(/function\s+\w+/g) || []).length
    
    // Gas estimation based on operations
    const storageOps = (sourceCode.match(/\w+\[\w+\s*=\s*|=\s*\w+\[\w+\]/g) || []).length
    const externalCalls = (sourceCode.match(/\.\s*(call|delegatecall|staticcall|transfer|send)/g) || []).length
    const gasEstimate = storageOps * 20000 + externalCalls * 5000 + functions * 1000

    return {
      totalLines: lines.length,
      complexityScore: functions + storageOps + externalCalls,
      functionsAnalyzed: functions,
      contractsAnalyzed: contracts,
      gasEstimate
    }
  }

  private getLineNumber(sourceCode: string, index: number): number {
    return sourceCode.substring(0, index).split('\n').length
  }

  private getFunctionScope(sourceCode: string, lineNumber: number): string | null {
    const lines = sourceCode.split('\n')
    let startLine = lineNumber
    let braceCount = 0
    
    // Find function start
    for (let i = lineNumber; i >= 0; i--) {
      if (lines[i].includes('function ')) {
        startLine = i
        break
      }
    }
    
    // Extract function content
    let functionContent = ''
    for (let i = startLine; i < lines.length; i++) {
      functionContent += lines[i] + '\n'
      braceCount += (lines[i].match(/{/g) || []).length
      braceCount -= (lines[i].match(/}/g) || []).length
      
      if (braceCount === 0 && i > startLine) {
        break
      }
    }
    
    return functionContent
  }
}

export const staticAnalyzer = new StaticAnalyzer()