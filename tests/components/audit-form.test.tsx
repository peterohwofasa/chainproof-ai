import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuditForm } from '@/components/audit-form'

// Mock the hooks and utilities
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}))

// Mock fetch
global.fetch = jest.fn()

describe('AuditForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        audit: { id: 'test-audit-id' },
      }),
    })
  })

  it('should render the audit form', () => {
    render(<AuditForm />)
    
    expect(screen.getByText(/create new audit/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contract name/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /start audit/i })).toBeInTheDocument()
  })

  it('should allow switching between code and address input', async () => {
    const user = userEvent.setup()
    render(<AuditForm />)
    
    // Should show code input by default
    expect(screen.getByLabelText(/contract code/i)).toBeInTheDocument()
    
    // Switch to address input
    const addressTab = screen.getByText(/contract address/i)
    await user.click(addressTab)
    
    expect(screen.getByLabelText(/contract address/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/contract code/i)).not.toBeInTheDocument()
  })

  it('should validate required fields', async () => {
    const user = userEvent.setup()
    render(<AuditForm />)
    
    const submitButton = screen.getByRole('button', { name: /start audit/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/contract name is required/i)).toBeInTheDocument()
    })
  })

  it('should submit form with contract code', async () => {
    const user = userEvent.setup()
    render(<AuditForm />)
    
    // Fill in the form
    const nameInput = screen.getByLabelText(/contract name/i)
    const codeInput = screen.getByLabelText(/contract code/i)
    
    await user.type(nameInput, 'TestContract')
    await user.type(codeInput, 'pragma solidity ^0.8.0; contract Test {{}}')
    
    const submitButton = screen.getByRole('button', { name: /start audit/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractName: 'TestContract',
          contractCode: 'pragma solidity ^0.8.0; contract Test {{}}',
        }),
      })
    })
  })

  it('should submit form with contract address', async () => {
    const user = userEvent.setup()
    render(<AuditForm />)
    
    // Switch to address input
    const addressTab = screen.getByText(/contract address/i)
    await user.click(addressTab)
    
    // Fill in the form
    const nameInput = screen.getByLabelText(/contract name/i)
    const addressInput = screen.getByLabelText(/contract address/i)
    const networkSelect = screen.getByLabelText(/network/i)
    
    await user.type(nameInput, 'TestContract')
    await user.type(addressInput, '0x1234567890123456789012345678901234567890')
    await user.selectOptions(networkSelect, 'ethereum')
    
    const submitButton = screen.getByRole('button', { name: /start audit/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractName: 'TestContract',
          contractAddress: '0x1234567890123456789012345678901234567890',
          network: 'ethereum',
        }),
      })
    })
  })

  it('should validate contract address format', async () => {
    const user = userEvent.setup()
    render(<AuditForm />)
    
    // Switch to address input
    const addressTab = screen.getByText(/contract address/i)
    await user.click(addressTab)
    
    // Fill in invalid address
    const nameInput = screen.getByLabelText(/contract name/i)
    const addressInput = screen.getByLabelText(/contract address/i)
    
    await user.type(nameInput, 'TestContract')
    await user.type(addressInput, 'invalid-address')
    
    const submitButton = screen.getByRole('button', { name: /start audit/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/invalid ethereum address/i)).toBeInTheDocument()
    })
  })

  it('should handle API errors', async () => {
    const user = userEvent.setup()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({
        success: false,
        error: 'API Error',
      }),
    })
    
    render(<AuditForm />)
    
    // Fill in the form
    const nameInput = screen.getByLabelText(/contract name/i)
    const codeInput = screen.getByLabelText(/contract code/i)
    
    await user.type(nameInput, 'TestContract')
    await user.type(codeInput, 'pragma solidity ^0.8.0; contract Test {{}}')
    
    const submitButton = screen.getByRole('button', { name: /start audit/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/api error/i)).toBeInTheDocument()
    })
  })

  it('should show loading state during submission', async () => {
    const user = userEvent.setup()
    
    // Mock a delayed response
    ;(global.fetch as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ success: true, audit: { id: 'test' } }),
      }), 100))
    )
    
    render(<AuditForm />)
    
    // Fill in the form
    const nameInput = screen.getByLabelText(/contract name/i)
    const codeInput = screen.getByLabelText(/contract code/i)
    
    await user.type(nameInput, 'TestContract')
    await user.type(codeInput, 'pragma solidity ^0.8.0; contract Test {{}}')
    
    const submitButton = screen.getByRole('button', { name: /start audit/i })
    await user.click(submitButton)
    
    // Should show loading state
    expect(screen.getByText(/creating audit/i)).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
    
    // Wait for completion
    await waitFor(() => {
      expect(screen.queryByText(/creating audit/i)).not.toBeInTheDocument()
    }, { timeout: 200 })
  })

  it('should reset form after successful submission', async () => {
    const user = userEvent.setup()
    render(<AuditForm />)
    
    // Fill in the form
    const nameInput = screen.getByLabelText(/contract name/i)
    const codeInput = screen.getByLabelText(/contract code/i)
    
    await user.type(nameInput, 'TestContract')
    await user.type(codeInput, 'pragma solidity ^0.8.0; contract Test {{}}')
    
    const submitButton = screen.getByRole('button', { name: /start audit/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect((nameInput as HTMLInputElement).value).toBe('')
      expect((codeInput as HTMLTextAreaElement).value).toBe('')
    })
  })
})