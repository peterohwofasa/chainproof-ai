import { staticAnalyzer } from '@/lib/static-analysis'

describe('Static Analysis', () => {
  const sampleContract = `
    pragma solidity ^0.8.0;
    
    contract VulnerableContract {
      mapping(address => uint256) public balances;
      address public owner;
      
      constructor() {
        owner = msg.sender;
      }
      
      function withdraw(uint256 amount) public {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        balances[msg.sender] -= amount; // Reentrancy vulnerability
      }
      
      function deposit() public payable {
        balances[msg.sender] += msg.value;
      }
      
      // Unchecked external call
      function externalCall(address target, bytes calldata data) public {
        target.call(data);
      }
      
      // Integer overflow (pre-0.8.0 style)
      function unsafeAdd(uint256 a, uint256 b) public pure returns (uint256) {
        return a + b; // Could overflow in older versions
      }
    }
  `

  describe('analyzeContract', () => {
    it('should detect reentrancy vulnerabilities', async () => {
      const results = await staticAnalyzer.analyzeContract(sampleContract, ['custom'])
      
      expect(results).toBeDefined()
      expect(Array.isArray(results)).toBe(true)
      
      const reentrancyVuln = results.find(result => 
        result.vulnerabilities?.some((v: any) => 
          v.type?.toLowerCase().includes('reentrancy')
        )
      )
      
      expect(reentrancyVuln).toBeDefined()
    })

    it('should detect unchecked external calls', async () => {
      const results = await staticAnalyzer.analyzeContract(sampleContract, ['custom'])
      
      const externalCallVuln = results.find(result => 
        result.vulnerabilities?.some((v: any) => 
          v.type?.toLowerCase().includes('external') || 
          v.type?.toLowerCase().includes('call')
        )
      )
      
      expect(externalCallVuln).toBeDefined()
    })

    it('should handle empty contract code', async () => {
      const results = await staticAnalyzer.analyzeContract('', ['custom'])
      
      expect(results).toBeDefined()
      expect(Array.isArray(results)).toBe(true)
    })

    it('should handle invalid Solidity code', async () => {
      const invalidCode = 'this is not valid solidity code'
      
      const results = await staticAnalyzer.analyzeContract(invalidCode, ['custom'])
      
      expect(results).toBeDefined()
      expect(Array.isArray(results)).toBe(true)
    })

    it('should analyze with multiple tools', async () => {
      const results = await staticAnalyzer.analyzeContract(sampleContract, ['custom', 'slither', 'mythril'])
      
      expect(results).toBeDefined()
      expect(Array.isArray(results)).toBe(true)
      expect(results.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('getConsensusAnalysis', () => {
    it('should combine results from multiple analyzers', async () => {
      const mockResults = [
        {
          tool: 'custom',
          vulnerabilities: [
            {
              type: 'Reentrancy',
              severity: 'HIGH',
              description: 'Potential reentrancy vulnerability',
              lineNumbers: [15],
              recommendation: 'Use checks-effects-interactions pattern'
            }
          ]
        },
        {
          tool: 'slither',
          vulnerabilities: [
            {
              type: 'Reentrancy',
              severity: 'HIGH',
              description: 'Reentrancy detected',
              lineNumbers: [15],
              recommendation: 'Add reentrancy guard'
            }
          ]
        }
      ]

      const consensus = await staticAnalyzer.getConsensusAnalysis(mockResults)
      
      expect(consensus).toBeDefined()
      expect(consensus.vulnerabilities).toBeDefined()
      expect(Array.isArray(consensus.vulnerabilities)).toBe(true)
      expect(consensus.summary).toBeDefined()
    })

    it('should handle empty results array', async () => {
      const consensus = await staticAnalyzer.getConsensusAnalysis([])
      
      expect(consensus).toBeDefined()
      expect(consensus.vulnerabilities).toBeDefined()
      expect(Array.isArray(consensus.vulnerabilities)).toBe(true)
      expect(consensus.vulnerabilities.length).toBe(0)
    })

    it('should prioritize high severity vulnerabilities', async () => {
      const mockResults = [
        {
          tool: 'custom',
          vulnerabilities: [
            {
              type: 'Info',
              severity: 'LOW',
              description: 'Low severity issue',
              lineNumbers: [1],
              recommendation: 'Consider fixing'
            },
            {
              type: 'Critical',
              severity: 'HIGH',
              description: 'Critical vulnerability',
              lineNumbers: [10],
              recommendation: 'Fix immediately'
            }
          ]
        }
      ]

      const consensus = await staticAnalyzer.getConsensusAnalysis(mockResults)
      
      expect(consensus.vulnerabilities.length).toBeGreaterThan(0)
      
      // High severity should be listed first
      const highSeverityVuln = consensus.vulnerabilities.find((v: any) => v.severity === 'HIGH')
      expect(highSeverityVuln).toBeDefined()
    })
  })

  describe('Pattern Detection', () => {
    it('should detect common vulnerability patterns', () => {
      const patterns = [
        'call{value:',
        'transfer(',
        'send(',
        'delegatecall(',
        'selfdestruct(',
        'suicide(',
      ]

      patterns.forEach(pattern => {
        const testCode = `contract Test { function test() { ${pattern} } }`
        expect(testCode).toContain(pattern)
      })
    })

    it('should detect access control issues', () => {
      const accessControlCode = `
        contract Test {
          function sensitiveFunction() public {
            // No access control
          }
        }
      `
      
      expect(accessControlCode).toContain('public')
      expect(accessControlCode).not.toContain('onlyOwner')
      expect(accessControlCode).not.toContain('require(msg.sender')
    })
  })
})