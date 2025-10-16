import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { AuditResults } from '@/components/audit-results'

// Mock the hooks and utilities
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}))

const mockAuditData = {
  id: 'test-audit-id',
  contractName: 'TestContract',
  status: 'completed',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T01:00:00Z'),
  contractCode: 'pragma solidity ^0.8.0; contract Test {{}}',
  contractAddress: null,
  network: null,
  vulnerabilities: [
    {
      id: 'vuln-1',
      type: 'reentrancy',
      severity: 'high',
      title: 'Reentrancy Vulnerability',
      description: 'Potential reentrancy attack vector found',
      location: 'line 15-20',
      recommendation: 'Use reentrancy guard',
      confidence: 0.9,
    },
    {
      id: 'vuln-2',
      type: 'unchecked-call',
      severity: 'medium',
      title: 'Unchecked External Call',
      description: 'External call without checking return value',
      location: 'line 25',
      recommendation: 'Check return value',
      confidence: 0.8,
    },
    {
      id: 'vuln-3',
      type: 'access-control',
      severity: 'low',
      title: 'Missing Access Control',
      description: 'Function lacks proper access control',
      location: 'line 30',
      recommendation: 'Add onlyOwner modifier',
      confidence: 0.7,
    },
  ],
  gasOptimizations: [
    {
      id: 'gas-1',
      type: 'storage-optimization',
      title: 'Storage Optimization',
      description: 'Pack struct variables to save gas',
      location: 'line 10',
      recommendation: 'Reorder struct fields',
      gasSaved: 2000,
    },
  ],
  score: 75,
  aiAnalysis: {
    summary: 'Contract has moderate security issues',
    recommendations: ['Fix reentrancy vulnerability', 'Add access controls'],
  },
}

describe('AuditResults', () => {
  it('should render audit results with vulnerabilities', () => {
    render(<AuditResults audit={mockAuditData} />)
    
    expect(screen.getByText('TestContract')).toBeInTheDocument()
    expect(screen.getByText('Security Score: 75/100')).toBeInTheDocument()
    expect(screen.getByText('3 vulnerabilities found')).toBeInTheDocument()
    expect(screen.getByText('1 gas optimization found')).toBeInTheDocument()
  })

  it('should display vulnerabilities by severity', () => {
    render(<AuditResults audit={mockAuditData} />)
    
    // Check high severity vulnerability
    expect(screen.getByText('Reentrancy Vulnerability')).toBeInTheDocument()
    expect(screen.getByText('HIGH')).toBeInTheDocument()
    
    // Check medium severity vulnerability
    expect(screen.getByText('Unchecked External Call')).toBeInTheDocument()
    expect(screen.getByText('MEDIUM')).toBeInTheDocument()
    
    // Check low severity vulnerability
    expect(screen.getByText('Missing Access Control')).toBeInTheDocument()
    expect(screen.getByText('LOW')).toBeInTheDocument()
  })

  it('should show vulnerability details when expanded', () => {
    render(<AuditResults audit={mockAuditData} />)
    
    const vulnerabilityCard = screen.getByText('Reentrancy Vulnerability').closest('div')
    expect(vulnerabilityCard).toBeInTheDocument()
    
    // Click to expand
    fireEvent.click(vulnerabilityCard!)
    
    expect(screen.getByText('Potential reentrancy attack vector found')).toBeInTheDocument()
    expect(screen.getByText('line 15-20')).toBeInTheDocument()
    expect(screen.getByText('Use reentrancy guard')).toBeInTheDocument()
    expect(screen.getByText('Confidence: 90%')).toBeInTheDocument()
  })

  it('should display gas optimizations', () => {
    render(<AuditResults audit={mockAuditData} />)
    
    expect(screen.getByText('Storage Optimization')).toBeInTheDocument()
    expect(screen.getByText('Pack struct variables to save gas')).toBeInTheDocument()
    expect(screen.getByText('Gas Saved: 2000')).toBeInTheDocument()
  })

  it('should show AI analysis summary', () => {
    render(<AuditResults audit={mockAuditData} />)
    
    expect(screen.getByText('AI Analysis')).toBeInTheDocument()
    expect(screen.getByText('Contract has moderate security issues')).toBeInTheDocument()
    expect(screen.getByText('Fix reentrancy vulnerability')).toBeInTheDocument()
    expect(screen.getByText('Add access controls')).toBeInTheDocument()
  })

  it('should handle audit without vulnerabilities', () => {
    const cleanAudit = {
      ...mockAuditData,
      vulnerabilities: [],
      gasOptimizations: [],
      score: 100,
    }
    
    render(<AuditResults audit={cleanAudit} />)
    
    expect(screen.getByText('Security Score: 100/100')).toBeInTheDocument()
    expect(screen.getByText('No vulnerabilities found')).toBeInTheDocument()
    expect(screen.getByText('No gas optimizations found')).toBeInTheDocument()
  })

  it('should show contract address when available', () => {
    const auditWithAddress = {
      ...mockAuditData,
      contractAddress: '0x1234567890123456789012345678901234567890',
      network: 'ethereum',
    }
    
    render(<AuditResults audit={auditWithAddress} />)
    
    expect(screen.getByText('0x1234567890123456789012345678901234567890')).toBeInTheDocument()
    expect(screen.getByText('ethereum')).toBeInTheDocument()
  })

  it('should filter vulnerabilities by severity', () => {
    render(<AuditResults audit={mockAuditData} />)
    
    // Click on high severity filter
    const highFilter = screen.getByText('High (1)')
    fireEvent.click(highFilter)
    
    // Should only show high severity vulnerability
    expect(screen.getByText('Reentrancy Vulnerability')).toBeInTheDocument()
    expect(screen.queryByText('Unchecked External Call')).not.toBeInTheDocument()
    expect(screen.queryByText('Missing Access Control')).not.toBeInTheDocument()
  })

  it('should export audit results', () => {
    // Mock URL.createObjectURL
    global.URL.createObjectURL = jest.fn(() => 'mock-url')
    global.URL.revokeObjectURL = jest.fn()
    
    // Mock document.createElement and click
    const mockLink = {
      href: '',
      download: '',
      click: jest.fn(),
    }
    jest.spyOn(document, 'createElement').mockReturnValue(mockLink as any)
    
    render(<AuditResults audit={mockAuditData} />)
    
    const exportButton = screen.getByText('Export Report')
    fireEvent.click(exportButton)
    
    expect(mockLink.click).toHaveBeenCalled()
    expect(mockLink.download).toBe('TestContract-audit-report.json')
  })

  it('should show loading state for pending audit', () => {
    const pendingAudit = {
      ...mockAuditData,
      status: 'pending',
      vulnerabilities: [],
      gasOptimizations: [],
      score: 0,
    }
    
    render(<AuditResults audit={pendingAudit} />)
    
    expect(screen.getByText('Audit in Progress')).toBeInTheDocument()
    expect(screen.getByText('Analyzing contract...')).toBeInTheDocument()
  })

  it('should show error state for failed audit', () => {
    const failedAudit = {
      ...mockAuditData,
      status: 'failed',
      vulnerabilities: [],
      gasOptimizations: [],
      score: 0,
    }
    
    render(<AuditResults audit={failedAudit} />)
    
    expect(screen.getByText('Audit Failed')).toBeInTheDocument()
    expect(screen.getByText('An error occurred during analysis')).toBeInTheDocument()
  })

  it('should calculate severity distribution correctly', () => {
    render(<AuditResults audit={mockAuditData} />)
    
    expect(screen.getByText('High (1)')).toBeInTheDocument()
    expect(screen.getByText('Medium (1)')).toBeInTheDocument()
    expect(screen.getByText('Low (1)')).toBeInTheDocument()
  })

  it('should show confidence levels for vulnerabilities', () => {
    render(<AuditResults audit={mockAuditData} />)
    
    // Expand first vulnerability
    const vulnerabilityCard = screen.getByText('Reentrancy Vulnerability').closest('div')
    fireEvent.click(vulnerabilityCard!)
    
    expect(screen.getByText('Confidence: 90%')).toBeInTheDocument()
  })
})