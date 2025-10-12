import { withErrorHandler, ExternalServiceError } from './error-handler'

export interface ContractSourceCode {
  sourceCode: string
  abi: any[]
  compilerVersion: string
  optimizationEnabled: boolean
  contractName: string
  networkId: number
}

export interface NetworkConfig {
  name: string
  chainId: number
  explorerUrl: string
  apiUrl: string
}

export const SUPPORTED_NETWORKS: Record<string, NetworkConfig> = {
  ethereum: {
    name: 'Ethereum Mainnet',
    chainId: 1,
    explorerUrl: 'https://etherscan.io',
    apiUrl: 'https://api.etherscan.io/api'
  },
  base: {
    name: 'Base Mainnet',
    chainId: 8453,
    explorerUrl: 'https://basescan.org',
    apiUrl: 'https://api.basescan.org/api'
  },
  polygon: {
    name: 'Polygon Mainnet',
    chainId: 137,
    explorerUrl: 'https://polygonscan.com',
    apiUrl: 'https://api.polygonscan.com/api'
  },
  arbitrum: {
    name: 'Arbitrum One',
    chainId: 42161,
    explorerUrl: 'https://arbiscan.io',
    apiUrl: 'https://api.arbiscan.io/api'
  },
  optimism: {
    name: 'Optimism Mainnet',
    chainId: 10,
    explorerUrl: 'https://optimistic.etherscan.io',
    apiUrl: 'https://api-optimistic.etherscan.io/api'
  },
  sepolia: {
    name: 'Sepolia Testnet',
    chainId: 11155111,
    explorerUrl: 'https://sepolia.etherscan.io',
    apiUrl: 'https://api-sepolia.etherscan.io/api'
  },
  baseSepolia: {
    name: 'Base Sepolia Testnet',
    chainId: 84532,
    explorerUrl: 'https://sepolia.basescan.org',
    apiUrl: 'https://api-sepolia.basescan.org/api'
  }
}

export class BlockchainExplorer {
  private network: string

  constructor(network: string = 'ethereum') {
    this.network = network
    
    if (!SUPPORTED_NETWORKS[network]) {
      throw new Error(`Unsupported network: ${network}`)
    }
  }

  private getNetworkConfig(): NetworkConfig {
    return SUPPORTED_NETWORKS[this.network]
  }

  private getApiKey(): string {
    const keyMap: Record<string, string> = {
      ethereum: process.env.ETHERSCAN_API_KEY || '',
      base: process.env.BASESCAN_API_KEY || process.env.ETHERSCAN_API_KEY || '',
      polygon: process.env.POLYGONSCAN_API_KEY || process.env.ETHERSCAN_API_KEY || '',
      arbitrum: process.env.ARBISCAN_API_KEY || process.env.ETHERSCAN_API_KEY || '',
      optimism: process.env.OPTIMISM_API_KEY || process.env.ETHERSCAN_API_KEY || '',
      sepolia: process.env.ETHERSCAN_API_KEY || '',
      baseSepolia: process.env.BASESCAN_API_KEY || process.env.ETHERSCAN_API_KEY || '',
    }
    
    return keyMap[this.network] || ''
  }

  async getContractSourceCode(contractAddress: string): Promise<ContractSourceCode> {
    const config = this.getNetworkConfig()
    
    // Validate address format
    if (!this.isValidAddress(contractAddress)) {
      throw new ExternalServiceError('Invalid contract address format')
    }

    const url = `${config.apiUrl}?module=contract&action=getsourcecode&address=${contractAddress}&apikey=${this.getApiKey()}`
    
    try {
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new ExternalServiceError(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.status !== '1') {
        throw new ExternalServiceError(data.message || 'Contract source code not found')
      }

      const result = data.result[0]
      
      if (!result.SourceCode || result.SourceCode === '') {
        throw new ExternalServiceError('Contract source code not available or not verified')
      }

      // Parse source code (handle both single file and multi-file contracts)
      let sourceCode = result.SourceCode
      if (sourceCode.startsWith('{{')) {
        // Multi-file contract - extract main contract source
        sourceCode = this.parseMultiFileSource(sourceCode, result.ContractName)
      }

      // Parse ABI
      let abi: any[] = []
      try {
        abi = JSON.parse(result.ABI || '[]')
      } catch (error) {
        console.warn('Failed to parse ABI:', error)
      }

      return {
        sourceCode,
        abi,
        compilerVersion: result.CompilerVersion,
        optimizationEnabled: result.OptimizationUsed === '1',
        contractName: result.ContractName,
        networkId: config.chainId
      }
    } catch (error) {
      if (error instanceof ExternalServiceError) {
        throw error
      }
      throw new ExternalServiceError('Failed to fetch contract source code')
    }
  }

  async getContractBytecode(contractAddress: string): Promise<string> {
    const config = this.getNetworkConfig()
    
    const url = `${config.apiUrl}?module=proxy&action=eth_getCode&address=${contractAddress}&tag=latest&apikey=${this.getApiKey()}`
    
    try {
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new ExternalServiceError(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.status !== '1') {
        throw new ExternalServiceError(data.message || 'Failed to fetch contract bytecode')
      }

      return data.result
    } catch (error) {
      if (error instanceof ExternalServiceError) {
        throw error
      }
      throw new ExternalServiceError('Failed to fetch contract bytecode')
    }
  }

  async verifyContractExists(contractAddress: string): Promise<boolean> {
    try {
      const bytecode = await this.getContractBytecode(contractAddress)
      return bytecode !== '0x' && bytecode !== '0x0'
    } catch (error) {
      return false
    }
  }

  private isValidAddress(address: string): boolean {
    // Basic Ethereum address validation
    return /^0x[a-fA-F0-9]{40}$/.test(address)
  }

  private parseMultiFileSource(sourceCode: string, contractName: string): string {
    try {
      // Parse JSON structure for multi-file contracts
      const parsed = JSON.parse(sourceCode.slice(1, -1)) // Remove outer braces
      
      // Find the main contract file
      const mainFile = Object.keys(parsed.sources).find(key => 
        key.includes(contractName) || key.endsWith('.sol')
      )
      
      if (mainFile && parsed.sources[mainFile]) {
        return parsed.sources[mainFile].content
      }
      
      // Fallback: return first available source
      const firstSource = Object.values(parsed.sources)[0] as any
      return firstSource?.content || sourceCode
    } catch (error) {
      console.warn('Failed to parse multi-file source:', error)
      return sourceCode
    }
  }

  async getContractCreationInfo(contractAddress: string): Promise<{
    transactionHash: string
    creatorAddress: string
    blockNumber: number
  }> {
    const config = this.getNetworkConfig()
    
    const url = `${config.apiUrl}?module=contract&action=getcontractcreation&contractaddresses=${contractAddress}&apikey=${this.getApiKey()}`
    
    try {
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new ExternalServiceError(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.status !== '1') {
        throw new ExternalServiceError(data.message || 'Failed to fetch contract creation info')
      }

      const result = data.result[0]
      
      return {
        transactionHash: result.txHash,
        creatorAddress: result.contractCreator,
        blockNumber: parseInt(result.blockNumber, 16)
      }
    } catch (error) {
      if (error instanceof ExternalServiceError) {
        throw error
      }
      throw new ExternalServiceError('Failed to fetch contract creation info')
    }
  }

  async analyzeContractDependencies(contractAddress: string): Promise<string[]> {
    try {
      const sourceCode = await this.getContractSourceCode(contractAddress)
      
      // Extract import statements from source code
      const importRegex = /import\s+.*?from\s+["']([^"']+)["']/g
      const imports: string[] = []
      let match
      
      while ((match = importRegex.exec(sourceCode.sourceCode)) !== null) {
        imports.push(match[1])
      }
      
      return imports
    } catch (error) {
      console.warn('Failed to analyze contract dependencies:', error)
      return []
    }
  }
}

// Factory function to create explorer instances
export function createBlockchainExplorer(network: string = 'ethereum'): BlockchainExplorer {
  return new BlockchainExplorer(network)
}

// Utility function to detect network from address
export async function detectNetwork(contractAddress: string): Promise<string> {
  const networks = Object.keys(SUPPORTED_NETWORKS)
  
  for (const network of networks) {
    try {
      const explorer = createBlockchainExplorer(network)
      const exists = await explorer.verifyContractExists(contractAddress)
      if (exists) {
        return network
      }
    } catch (error) {
      // Continue to next network
    }
  }
  
  throw new ExternalServiceError('Contract not found on any supported network')
}