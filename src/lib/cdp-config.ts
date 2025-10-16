import { type Config } from '@coinbase/cdp-react';

// CDP Embedded Wallet Configuration
export const cdpConfig: Config = {
  projectId: process.env.NEXT_PUBLIC_CDP_PROJECT_ID || '',
  appName: process.env.NEXT_PUBLIC_CDP_APP_NAME || 'ChainProof AI',
  appLogoUrl: process.env.NEXT_PUBLIC_CDP_APP_LOGO_URL || '/chainproof-logo.png',
  // Supported networks - Base and Ethereum
  supportedNetworks: ['base', 'ethereum'],
  // Account type - EVM EOA (Regular Accounts)
  accountType: 'evm-eoa',
};

// CDP Theme Configuration
export const cdpTheme = {
  // Primary colors matching ChainProof AI brand
  primaryColor: '#3b82f6', // Blue-500
  primaryColorHover: '#2563eb', // Blue-600
  primaryColorPressed: '#1d4ed8', // Blue-700
  
  // Background colors
  backgroundColor: '#ffffff',
  backgroundColorSecondary: '#f8fafc', // Slate-50
  backgroundColorTertiary: '#f1f5f9', // Slate-100
  
  // Text colors
  textColor: '#0f172a', // Slate-900
  textColorSecondary: '#475569', // Slate-600
  textColorTertiary: '#64748b', // Slate-500
  
  // Border colors
  borderColor: '#e2e8f0', // Slate-200
  borderColorSecondary: '#cbd5e1', // Slate-300
  
  // Error colors
  errorColor: '#ef4444', // Red-500
  errorColorHover: '#dc2626', // Red-600
  
  // Success colors
  successColor: '#10b981', // Emerald-500
  successColorHover: '#059669', // Emerald-600
  
  // Border radius
  borderRadius: '0.5rem', // 8px
  borderRadiusSecondary: '0.375rem', // 6px
  
  // Font family
  fontFamily: 'Inter, system-ui, sans-serif',
};

// CDP Wallet Configuration
export const cdpWalletConfig = {
  // Wallet connection options
  autoConnect: false,
  // Supported wallet features
  features: {
    sendTransaction: true,
    signMessage: true,
    getBalance: true,
    getTransactionHistory: true,
  },
  // Network preferences
  defaultNetwork: 'base',
  // UI preferences
  showBalance: true,
  showTransactionHistory: true,
  showNetworkSwitcher: true,
};

// Validation function for CDP configuration
export function validateCDPConfig(): boolean {
  if (!cdpConfig.projectId) {
    console.warn('CDP Project ID is not configured. Please set NEXT_PUBLIC_CDP_PROJECT_ID environment variable.');
    return false;
  }
  
  return true;
}

// Helper function to get CDP configuration with validation
export function getCDPConfig(): Config {
  if (!validateCDPConfig()) {
    throw new Error('CDP configuration is invalid. Please check your environment variables.');
  }
  
  return cdpConfig;
}