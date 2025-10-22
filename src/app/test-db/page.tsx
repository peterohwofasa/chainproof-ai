'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

export default function TestDBPage() {
  const { data: session } = useSession()
  const [audits, setAudits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAudits = async () => {
      if (!session?.user?.id) return
      
      try {
        console.log('Fetching audits for user:', session.user.id)
        const response = await fetch(`/api/audits?userId=${session.user.id}`)
        const data = await response.json()
        
        console.log('API Response:', data)
        setAudits(data.audits || [])
        
        if (!response.ok) {
          setError(data.error || 'Failed to fetch audits')
        }
      } catch (err) {
        console.error('Error fetching audits:', err)
        setError('Network error')
      } finally {
        setLoading(false)
      }
    }

    fetchAudits()
  }, [session])

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Database Test</h1>
      <div className="mb-4">
        <p><strong>User ID:</strong> {session?.user?.id || 'Not logged in'}</p>
        <p><strong>User Email:</strong> {session?.user?.email || 'N/A'}</p>
      </div>
      
      <h2 className="text-xl font-semibold mb-2">Audits ({audits.length})</h2>
      
      {audits.length === 0 ? (
        <p>No audits found in database</p>
      ) : (
        <div className="space-y-4">
          {audits.map((audit, index) => (
            <div key={audit.id || index} className="border p-4 rounded">
              <p><strong>ID:</strong> {audit.id}</p>
              <p><strong>Contract Name:</strong> {audit.contractName}</p>
              <p><strong>Status:</strong> {audit.status}</p>
              <p><strong>Score:</strong> {audit.overallScore}</p>
              <p><strong>Risk Level:</strong> {audit.riskLevel}</p>
              <p><strong>Created:</strong> {new Date(audit.createdAt).toLocaleString()}</p>
              <p><strong>Completed:</strong> {audit.completedAt ? new Date(audit.completedAt).toLocaleString() : 'Not completed'}</p>
              <p><strong>Vulnerabilities:</strong> {audit.vulnerabilityCount}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}