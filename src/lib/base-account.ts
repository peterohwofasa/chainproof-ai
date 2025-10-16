import { createBaseAccountSDK, pay, getPaymentStatus } from '@base-org/account';

// Base Account SDK configuration
export const baseAccountConfig = {
  appName: process.env.BASE_APP_NAME || 'ChainProof AI',
  appLogoUrl: process.env.BASE_APP_LOGO_URL || '/chainproof-logo.png',
  // Use testnet for development, set to false for production
  testnet: process.env.BASE_TESTNET === 'true' || process.env.NODE_ENV !== 'production',
};

// Initialize Base Account SDK
export const baseAccountSDK = createBaseAccountSDK(baseAccountConfig);

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
export async function signInWithBase(): Promise<{ address: string; isConnected: boolean }> {
  try {
    const provider = baseAccountSDK.getProvider();
    const accounts = await provider.request({ 
      method: 'wallet_connect' 
    }) as string[];
    
    if (accounts && accounts.length > 0) {
      return {
        address: accounts[0],
        isConnected: true,
      };
    }
    
    throw new Error('No accounts found');
  } catch (error) {
    console.error('Base sign-in failed:', error);
    throw new Error('Sign-in failed');
  }
}

/**
 * Get current Base account connection status
 */
export async function getBaseAccountStatus(): Promise<{ address?: string; isConnected: boolean }> {
  try {
    const provider = baseAccountSDK.getProvider();
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
    const provider = baseAccountSDK.getProvider();
    await provider.request({ method: 'wallet_disconnect' });
  } catch (error) {
    console.error('Failed to disconnect:', error);
    throw new Error('Disconnect failed');
  }
}