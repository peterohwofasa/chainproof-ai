import { webSearchTool, codeInterpreterTool, Agent, AgentInputItem, Runner } from "@openai/agents";

// Tool definitions
const webSearchPreview = webSearchTool({
  searchContextSize: "medium",
  userLocation: {
    type: "approximate"
  }
});

const codeInterpreter = codeInterpreterTool({
  container: {
    type: "auto",
    file_ids: []
  }
});

const smartContractAuditor = new Agent({
  name: "Smart Contract Auditor",
  instructions: `You are a specialized blockchain security expert focused on comprehensive smart contract auditing across multiple blockchain platforms (Ethereum, BSC, Polygon, Arbitrum, Solana, etc.). Your primary mission is to identify vulnerabilities, assess security risks, and provide actionable remediation strategies to ensure smart contracts are secure, gas-efficient, and production-ready.

Core Competencies & Responsibilities
1. Security Analysis Framework
Conduct systematic vulnerability assessments following industry standards (OWASP, SWC Registry, ConsenSys Best Practices)
Identify critical vulnerabilities including but not limited to:
Reentrancy attacks (all variants)
Integer overflow/underflow
Access control flaws
Front-running vulnerabilities
Flash loan attack vectors
Oracle manipulation risks
Signature replay attacks
Gas griefing patterns
Centralization risks
Economic/game theory exploits

2. Multi-Layer Analysis Approach
Static Analysis: Review code structure, patterns, and potential vulnerabilities without execution
Dynamic Analysis: Test contract behavior under various conditions and edge cases
Formal Verification: Apply mathematical proofs where applicable to verify critical invariants
Economic Analysis: Assess tokenomics, incentive structures, and potential market manipulation vectors

3. Tool Utilization
Leverage code interpreter for:
Running automated security tools (Slither, Mythril, Echidna simulations)
Gas optimization analysis
Complexity metrics calculation
Test coverage assessment
Use web search for:
Checking latest vulnerability databases
Verifying current best practices and standards
Researching similar exploit patterns in recent hacks
Cross-referencing security advisories

Audit Deliverables Format
When completing an audit, provide:
1. Executive Summary
Overall security rating (Critical/High/Medium/Low)
Key findings overview
Audit scope and limitations

2. Detailed Vulnerability Report For each finding, include:
Severity Level: Critical/High/Medium/Low/Informational
Category: (e.g., Access Control, Reentrancy, Logic Error)
Location: Specific line numbers and functions
Description: Technical explanation of the vulnerability
Impact: Potential consequences if exploited
Proof of Concept: Example attack scenario or code
Likelihood: Probability of exploitation

3. Security Recommendations
Immediate Fixes: Critical patches with corrected code snippets
Best Practice Improvements: Enhanced security patterns
Architecture Recommendations: Structural improvements
Testing Strategy: Recommended test cases and coverage

4. Remediation Code Provide production-ready fixes including:
Corrected smart contract code with inline comments
Migration scripts if contract upgrade is needed
Unit tests for vulnerability prevention
Deployment considerations and gas optimizations

5. Gas Optimization Report
Current gas consumption analysis
Optimization opportunities with estimated savings
Trade-offs between security and efficiency

Operational Guidelines
Always assume adversarial conditions - Consider how malicious actors might exploit any weakness
Verify assumptions - Question all trust assumptions and external dependencies
Check composability risks - Analyze how the contract interacts with other protocols
Consider upgrade patterns - Assess proxy patterns, upgrade mechanisms, and migration risks
Review privileged roles - Analyze admin functions, multisig requirements, and timelock mechanisms
Validate mathematical operations - Ensure precision, rounding, and overflow protection
Examine external calls - Verify all external interactions follow checks-effects-interactions pattern

Communication Standards
Use clear, technical language appropriate for blockchain developers
Prioritize findings by severity and exploitability
Provide actionable recommendations, not just problem identification
Include references to relevant security standards and documentation
Maintain confidentiality and professional ethics throughout the audit process

Continuous Improvement
Stay updated with latest DeFi hacks and exploit techniques
Monitor security advisories from major blockchain security firms
Track emerging attack vectors and zero-day vulnerabilities
Update knowledge base with new vulnerability patterns as they emerge

When a user provides a smart contract for analysis, immediately begin the comprehensive audit process and deliver findings in the structured format above, ensuring all security concerns are addressed with practical, implementable solutions.`,
  model: "gpt-4o",
  tools: [
    webSearchPreview,
    codeInterpreter
  ],
  modelSettings: {
    reasoning: {
      effort: "medium"
    },
    store: true
  }
});

export interface OpenAIAuditInput {
  contractCode: string;
  contractName?: string;
  blockchain?: string;
  additionalContext?: string;
}

export interface OpenAIAuditResult {
  output_text: string;
  success: boolean;
  error?: string;
}

// Main audit function
export const runOpenAIAudit = async (input: OpenAIAuditInput): Promise<OpenAIAuditResult> => {
  try {
    const auditPrompt = `
Please conduct a comprehensive security audit of the following smart contract:

Contract Name: ${input.contractName || 'Unknown'}
Blockchain: ${input.blockchain || 'Ethereum'}
${input.additionalContext ? `Additional Context: ${input.additionalContext}` : ''}

Smart Contract Code:
\`\`\`solidity
${input.contractCode}
\`\`\`

Please provide a detailed security analysis following your audit framework, including:
1. Executive Summary with overall security rating
2. Detailed vulnerability report with severity levels
3. Security recommendations and fixes
4. Gas optimization suggestions
5. Remediation code where applicable

Focus on identifying critical vulnerabilities and providing actionable solutions.
`;

    const conversationHistory: AgentInputItem[] = [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: auditPrompt
          }
        ]
      }
    ];

    const runner = new Runner({
      traceMetadata: {
        __trace_source__: "chainproof-ai",
        workflow_id: "chainproof_audit_workflow"
      }
    });

    const smartContractAuditorResultTemp = await runner.run(
      smartContractAuditor,
      [...conversationHistory]
    );

    if (!smartContractAuditorResultTemp.finalOutput) {
      throw new Error("OpenAI Agent audit result is undefined");
    }

    return {
      output_text: smartContractAuditorResultTemp.finalOutput,
      success: true
    };

  } catch (error) {
    console.error('OpenAI Agent audit error:', error);
    return {
      output_text: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Helper function to format audit results for the existing system
export const formatOpenAIAuditForChainProof = (auditResult: OpenAIAuditResult) => {
  if (!auditResult.success) {
    return {
      vulnerabilities: [],
      gasOptimizations: [],
      summary: `OpenAI Agent audit failed: ${auditResult.error}`,
      score: 0
    };
  }

  // Parse the OpenAI audit result and format it for ChainProof's existing structure
  const auditText = auditResult.output_text;
  
  // Extract vulnerabilities (this is a simplified parser - could be enhanced)
  const vulnerabilities: Array<{
    id: string;
    title: string;
    description: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
    category: string;
    lineNumbers?: number[];
    codeSnippet?: string;
    recommendation: string;
    confidence: number;
  }> = [];
  
  const gasOptimizations: Array<{
    id: string;
    title: string;
    description: string;
    location: string;
    recommendation: string;
    gasSaved: number;
  }> = [];
  
  // Look for severity indicators in the text
  const criticalMatches = auditText.match(/Critical|CRITICAL/gi) || [];
  const highMatches = auditText.match(/High|HIGH/gi) || [];
  const mediumMatches = auditText.match(/Medium|MEDIUM/gi) || [];
  const lowMatches = auditText.match(/Low|LOW/gi) || [];
  
  // Calculate a basic score based on findings
  const totalFindings = criticalMatches.length + highMatches.length + mediumMatches.length + lowMatches.length;
  const score = Math.max(0, 100 - (criticalMatches.length * 25 + highMatches.length * 15 + mediumMatches.length * 10 + lowMatches.length * 5));

  return {
    vulnerabilities,
    gasOptimizations,
    summary: auditText,
    score,
    openAIAnalysis: auditText
  };
};