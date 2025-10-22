import { createBaseAccountSDK, pay, getPaymentStatus } from '@base-org/account';

// Base Account SDK configuration
export const baseAccountConfig = {
  appName: process.env.NEXT_PUBLIC_BASE_APP_NAME || process.env.BASE_APP_NAME || 'ChainProof AI',
  appLogoUrl: process.env.NEXT_PUBLIC_BASE_APP_LOGO_URL || process.env.BASE_APP_LOGO_URL || '/chainproof-logo.png',
  appChainIds: [8453], // Base mainnet
  // Use testnet for development, set to false for production
  testnet: process.env.NEXT_PUBLIC_BASE_TESTNET === 'true' || process.env.BASE_TESTNET === 'true' || process.env.NODE_ENV !== 'production',
};

// Initialize Base Account SDK with error handling
let baseAccountSDKInstance: any = null;

function getBaseAccountSDK() {
  if (!baseAccountSDKInstance && typeof window !== 'undefined') {
    try {
      baseAccountSDKInstance = createBaseAccountSDK(baseAccountConfig);
    } catch (error) {
      console.warn('Failed to initialize Base Account SDK:', error);
      throw new Error('Base Account SDK initialization failed');
    }
  }
  return baseAccountSDKInstance;
}

// Export for backward compatibility
export const baseAccountSDK = {
  getProvider: () => {
    const sdk = getBaseAccountSDK();
    if (!sdk) {
      throw new Error('Base Account SDK not available');
    }
    return sdk.getProvider();
  }
};

// Base Pay integration
export interface BasePaymentOptions {
  amount: string; // USD amount
  to: string; // Recipient address
  description?: string;
  testnet?: boolean;
}

export interface BasePaymentResult {
  id: string;
  status: 'pending' | 'completed' | 'failed';
  transactionHash?: string;
}

/**
 * Process payment using Base Pay
 */
export async function processBasePayment(options: BasePaymentOptions): Promise<BasePaymentResult> {
  try {
    const recipientAddress = process.env.BASE_RECIPIENT_ADDRESS
    if (!recipientAddress) {
      throw new Error('Base recipient address not configured')
    }

    const { id } = await pay({
      amount: options.amount,
      to: recipientAddress,
      testnet: options.testnet ?? baseAccountConfig.testnet,
    });

    return {
      id,
      status: 'pending',
    };
  } catch (error) {
    console.error('Base payment failed:', error);
    throw new Error('Payment processing failed');
  }
}

/**
 * Check Base payment status
 */
export async function checkBasePaymentStatus(paymentId: string): Promise<BasePaymentResult> {
  try {
    const { status } = await getPaymentStatus({ id: paymentId });
    
    return {
      id: paymentId,
      status: status as 'pending' | 'completed' | 'failed',
      // transactionHash is not available from the Base SDK getPaymentStatus response
      // It would need to be obtained through other means if required
    };
  } catch (error) {
    console.error('Failed to check payment status:', error);
    throw new Error('Failed to check payment status');
  }
}

/**
 * Sign in with Base Account
 */
export async function signInWithBase(): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('Base Account requires a browser environment')
  }

  try {
    // Use our locally installed SDK instance
    const sdk = getBaseAccountSDK()
    if (!sdk) {
      throw new Error('Base Account SDK not initialized')
    }

    // Get the provider
    const provider = sdk.getProvider()
    if (!provider) {
      throw new Error('Base Account provider not available')
    }

    // Request account access
    let accounts: string[]
    try {
      accounts = await provider.request({ method: 'eth_requestAccounts' })
    } catch (error: any) {
      console.error('Provider request error:', error)
      if (error.code === 4001) {
        throw new Error('Connection was cancelled. Please try again and approve the connection.')
      } else if (error.code === -32002) {
        throw new Error('Connection request is already pending. Please check your wallet.')
      } else {
        throw new Error(`Failed to connect to Base Account: ${error.message || 'Unknown error'}`)
      }
    }

    if (!accounts || accounts.length === 0) {
      throw new Error('No Base accounts found. Please make sure you have a Base wallet set up.')
    }

    return accounts[0]
  } catch (error) {
    console.error('Base sign-in error:', error)
    throw error
  }
}

/**
 * Get current Base account connection status
 */
export async function getBaseAccountStatus(): Promise<{ address?: string; isConnected: boolean }> {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return { isConnected: false };
    }

    const sdk = getBaseAccountSDK();
    if (!sdk) {
      return { isConnected: false };
    }

    const provider = sdk.getProvider();
    if (!provider) {
      return { isConnected: false };
    }

    const accounts = await provider.request({ 
      method: 'eth_accounts' 
    }) as string[];
    
    return {
      address: accounts[0],
      isConnected: accounts.length > 0,
    };
  } catch (error) {
    console.error('Failed to get account status:', error);
    return { isConnected: false };
  }
}

/**
 * Disconnect Base account
 */
export async function disconnectBaseAccount(): Promise<void> {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      throw new Error('Base Account SDK requires browser environment');
    }

    // Base Account SDK doesn't have a direct disconnect method
    // The disconnection is typically handled by the wallet itself
    // We can clear any local state or session data here
    console.log('Base account disconnection requested');
    
    // Note: The actual disconnection depends on the Base wallet implementation
    // Users would need to disconnect from their Base wallet directly
  } catch (error) {
    console.error('Failed to disconnect:', error);
    throw new Error('Disconnect failed');
  }
}