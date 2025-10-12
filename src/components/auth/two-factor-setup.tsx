'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { QRCodeSVG } from 'qrcode.react'
import { 
  Shield, 
  Smartphone, 
  CheckCircle2, 
  AlertTriangle,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react'
import { toast } from 'sonner'

interface TwoFactorSetupProps {
  isEnabled: boolean
  onSetupComplete: () => void
  onDisable: () => void
}

export function TwoFactorSetup({ isEnabled, onSetupComplete, onDisable }: TwoFactorSetupProps) {
  const [step, setStep] = useState<'setup' | 'verify'>('setup')
  const [secret, setSecret] = useState('')
  const [qrCode, setQrCode] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [verificationCode, setVerificationCode] = useState('')
  const [showBackupCodes, setShowBackupCodes] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!isEnabled) {
      generateTwoFactorSecret()
    }
  }, [isEnabled])

  const generateTwoFactorSecret = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/2fa/generate')
      if (response.ok) {
        const data = await response.json()
        setSecret(data.secret)
        setQrCode(data.qrCode)
        setBackupCodes(data.backupCodes)
      } else {
        throw new Error('Failed to generate 2FA secret')
      }
    } catch (error) {
      toast.error('Failed to generate two-factor authentication setup')
    } finally {
      setIsLoading(false)
    }
  }

  const verifyAndEnable = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/2fa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          secret, 
          token: verificationCode 
        })
      })

      if (response.ok) {
        toast.success('Two-factor authentication enabled successfully!')
        onSetupComplete()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to enable 2FA')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to enable two-factor authentication')
    } finally {
      setIsLoading(false)
    }
  }

  const disableTwoFactor = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/2fa/disable', {
        method: 'POST'
      })

      if (response.ok) {
        toast.success('Two-factor authentication disabled')
        onDisable()
      } else {
        throw new Error('Failed to disable 2FA')
      }
    } catch (error) {
      toast.error('Failed to disable two-factor authentication')
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const downloadBackupCodes = () => {
    const content = backupCodes.join('\n')
    const blob = new Blob([content], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'backup-codes.txt'
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    toast.success('Backup codes downloaded')
  }

  if (isEnabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-500" />
            Two-Factor Authentication Enabled
          </CardTitle>
          <CardDescription>
            Your account is protected with two-factor authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Two-factor authentication is currently active on your account. You'll need to enter a code from your authenticator app when signing in.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <Button 
              variant="destructive" 
              onClick={disableTwoFactor}
              disabled={isLoading}
            >
              {isLoading ? 'Disabling...' : 'Disable Two-Factor Authentication'}
            </Button>
            <p className="text-sm text-gray-500">
              Disabling 2FA will make your account less secure. We recommend keeping it enabled.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="w-5 h-5" />
          Two-Factor Authentication Setup
        </CardTitle>
        <CardDescription>
          Add an extra layer of security to your account with 2FA
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === 'setup' && (
          <div className="space-y-6">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Before continuing, make sure you have an authenticator app installed on your phone (like Google Authenticator, Authy, or 1Password).
              </AlertDescription>
            </Alert>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div>
                    <Label>Scan QR Code</Label>
                    <p className="text-sm text-gray-500 mb-4">
                      Scan this QR code with your authenticator app:
                    </p>
                    <div className="flex justify-center">
                      {qrCode && (
                        <div className="p-4 bg-white rounded-lg">
                          <QRCodeSVG value={qrCode} size={200} />
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label>Or Enter Secret Manually</Label>
                    <p className="text-sm text-gray-500 mb-2">
                      If you can't scan the QR code, enter this secret in your app:
                    </p>
                    <div className="flex items-center gap-2">
                      <Input 
                        value={secret} 
                        readOnly 
                        className="font-mono text-sm"
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => copyToClipboard(secret)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => setStep('verify')}>
                    Continue
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-6">
            <div>
              <Label htmlFor="verification-code">Enter Verification Code</Label>
              <p className="text-sm text-gray-500 mb-4">
                Enter the 6-digit code from your authenticator app:
              </p>
              <Input
                id="verification-code"
                type="text"
                maxLength={6}
                pattern="[0-9]{6}"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                className="text-center text-2xl font-mono tracking-widest"
              />
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('setup')}>
                Back
              </Button>
              <Button 
                onClick={verifyAndEnable}
                disabled={isLoading || verificationCode.length !== 6}
              >
                {isLoading ? 'Enabling...' : 'Enable Two-Factor Authentication'}
              </Button>
            </div>
          </div>
        )}

        {backupCodes.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <div className="space-y-4">
              <div>
                <Label>Backup Codes</Label>
                <p className="text-sm text-gray-500 mb-4">
                  Save these backup codes in a safe place. You can use them to access your account if you lose your authenticator device.
                </p>
              </div>

              <div className="relative">
                <div className={`p-4 bg-gray-50 dark:bg-gray-800 rounded-lg font-mono text-sm ${
                  showBackupCodes ? '' : 'blur-sm'
                }`}>
                  <div className="grid grid-cols-2 gap-2">
                    {backupCodes.map((code, index) => (
                      <div key={index} className="text-center">
                        {code}
                      </div>
                    ))}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => setShowBackupCodes(!showBackupCodes)}
                >
                  {showBackupCodes ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => copyToClipboard(backupCodes.join('\n'))}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Codes
                </Button>
                <Button 
                  variant="outline" 
                  onClick={downloadBackupCodes}
                >
                  Download Codes
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}