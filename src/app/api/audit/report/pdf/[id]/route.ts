import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB, Audit } from '@/models'
import { logger } from '@/lib/logger'
import jsPDF from 'jspdf'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Connect to database and fetch audit
    await connectDB()
    const audit = await Audit.findById(id).lean() as any

    if (!audit) {
      return NextResponse.json(
        { error: 'Audit not found' },
        { status: 404 }
      )
    }

    // Check if user owns this audit
    if (audit.userId?.toString() !== session.user.id && !session.user.id.startsWith('wallet_')) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have access to this audit' },
        { status: 403 }
      )
    }

    // Generate PDF
    const pdf = await generateAuditPDF(audit)
    
    // Convert PDF to buffer
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'))

    // Return PDF with proper headers
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="chainproof-audit-${audit.contractName || 'report'}-${id}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })
  } catch (error) {
    logger.error('Error generating PDF report', { error })
    return NextResponse.json(
      { error: 'Failed to generate PDF report' },
      { status: 500 }
    )
  }
}

async function generateAuditPDF(audit: any): Promise<jsPDF> {
  const doc = new jsPDF()
  
  // Page settings
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const contentWidth = pageWidth - 2 * margin
  let yPosition = margin

  // Helper function to add new page if needed
  const checkAndAddPage = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      doc.addPage()
      yPosition = margin
      return true
    }
    return false
  }

  // Helper function for wrapping text
  const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 10) => {
    doc.setFontSize(fontSize)
    const lines = doc.splitTextToSize(text, maxWidth)
    doc.text(lines, x, y)
    return lines.length * (fontSize * 0.35) // Return height used
  }

  // Try to load and add logo
  try {
    // Load logo from public directory
    const logoPath = join(process.cwd(), 'public', 'chainproof-logo.png')
    const logoBase64 = readFileSync(logoPath, { encoding: 'base64' })
    doc.addImage(`data:image/png;base64,${logoBase64}`, 'PNG', margin, yPosition, 40, 10)
    yPosition += 15
  } catch (error) {
    // If logo not found, just add text header
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('ChainProof AI', margin, yPosition)
    yPosition += 10
  }

  // Add header
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text('Smart Contract Security Audit Report', margin, yPosition)
  yPosition += 5
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 10

  // Title
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text(`Audit Report: ${audit.contractName || 'Unnamed Contract'}`, margin, yPosition)
  yPosition += 12

  // Audit metadata
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(80, 80, 80)
  
  const metadata = [
    `Audit ID: ${audit._id}`,
    `Date: ${new Date(audit.createdAt || Date.now()).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}`,
    `Status: ${audit.status || 'Completed'}`,
  ]

  metadata.forEach(line => {
    doc.text(line, margin, yPosition)
    yPosition += 6
  })
  yPosition += 5

  // Summary Section
  checkAndAddPage(60)
  doc.setFillColor(240, 240, 240)
  doc.rect(margin, yPosition, contentWidth, 45, 'F')
  yPosition += 8

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text('Executive Summary', margin + 5, yPosition)
  yPosition += 10

  // Summary metrics in grid
  const boxWidth = contentWidth / 3 - 4
  const boxHeight = 25
  const boxY = yPosition

  // Security Score
  doc.setFillColor(255, 255, 255)
  doc.rect(margin + 5, boxY, boxWidth, boxHeight, 'FD')
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text(`${audit.overallScore || 0}`, margin + 5 + boxWidth / 2, boxY + 12, { align: 'center' })
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text('Security Score', margin + 5 + boxWidth / 2, boxY + 20, { align: 'center' })

  // Risk Level
  doc.setFillColor(255, 255, 255)
  doc.rect(margin + 5 + boxWidth + 2, boxY, boxWidth, boxHeight, 'FD')
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  
  const riskLevel = audit.riskLevel || 'UNKNOWN'
  const riskColors: { [key: string]: [number, number, number] } = {
    'CRITICAL': [220, 38, 38],
    'HIGH': [234, 88, 12],
    'MEDIUM': [234, 179, 8],
    'LOW': [34, 197, 94],
  }
  const riskColor = riskColors[riskLevel] || [100, 100, 100]
  doc.setTextColor(...riskColor)
  doc.text(riskLevel, margin + 5 + boxWidth + 2 + boxWidth / 2, boxY + 12, { align: 'center' })
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text('Risk Level', margin + 5 + boxWidth + 2 + boxWidth / 2, boxY + 20, { align: 'center' })

  // Vulnerabilities Count
  doc.setFillColor(255, 255, 255)
  doc.rect(margin + 5 + (boxWidth + 2) * 2, boxY, boxWidth, boxHeight, 'FD')
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  const vulnCount = audit.vulnerabilities?.length || 0
  doc.text(vulnCount.toString(), margin + 5 + (boxWidth + 2) * 2 + boxWidth / 2, boxY + 12, { align: 'center' })
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text('Issues Found', margin + 5 + (boxWidth + 2) * 2 + boxWidth / 2, boxY + 20, { align: 'center' })

  yPosition = boxY + boxHeight + 10

  // Vulnerabilities Section
  if (audit.vulnerabilities && audit.vulnerabilities.length > 0) {
    checkAndAddPage(20)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text('Identified Vulnerabilities', margin, yPosition)
    yPosition += 10

    audit.vulnerabilities.forEach((vuln: any, index: number) => {
      checkAndAddPage(40)

      // Vulnerability box
      doc.setFillColor(250, 250, 250)
      doc.rect(margin, yPosition, contentWidth, 8, 'F')
      
      // Severity badge color
      const severityColors: { [key: string]: [number, number, number] } = {
        'CRITICAL': [220, 38, 38],
        'HIGH': [234, 88, 12],
        'MEDIUM': [234, 179, 8],
        'LOW': [59, 130, 246],
        'INFO': [100, 100, 100],
      }
      const severity = vuln.severity || 'INFO'
      const color = severityColors[severity] || [100, 100, 100]
      
      // Severity indicator line
      doc.setDrawColor(...color)
      doc.setLineWidth(3)
      doc.line(margin, yPosition, margin, yPosition + 8)
      doc.setLineWidth(0.1)
      doc.setDrawColor(200, 200, 200)

      // Vulnerability title and severity
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 0, 0)
      doc.text(`${index + 1}. ${vuln.title || 'Unnamed Vulnerability'}`, margin + 5, yPosition + 6)
      
      doc.setFontSize(8)
      doc.setTextColor(...color)
      const severityText = severity.toUpperCase()
      const severityWidth = doc.getTextWidth(severityText)
      doc.text(severityText, pageWidth - margin - severityWidth - 5, yPosition + 6)
      
      yPosition += 12

      // Description
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(60, 60, 60)
      const descHeight = addWrappedText(
        vuln.description || 'No description provided.',
        margin + 5,
        yPosition,
        contentWidth - 10,
        9
      )
      yPosition += descHeight + 3

      // Category and IDs
      if (vuln.category || vuln.cweId || vuln.swcId) {
        doc.setFontSize(8)
        doc.setTextColor(100, 100, 100)
        let tags = []
        if (vuln.category) tags.push(`Category: ${vuln.category}`)
        if (vuln.cweId) tags.push(`CWE-${vuln.cweId}`)
        if (vuln.swcId) tags.push(`SWC-${vuln.swcId}`)
        doc.text(tags.join(' | '), margin + 5, yPosition)
        yPosition += 5
      }

      // Recommendation
      if (vuln.recommendation) {
        checkAndAddPage(20)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(0, 0, 0)
        doc.text('Recommendation:', margin + 5, yPosition)
        yPosition += 5
        
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(60, 60, 60)
        const recHeight = addWrappedText(
          vuln.recommendation,
          margin + 5,
          yPosition,
          contentWidth - 10,
          9
        )
        yPosition += recHeight + 5
      }

      yPosition += 5
    })
  } else {
    checkAndAddPage(20)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(34, 197, 94)
    doc.text('✓ No Vulnerabilities Found', margin, yPosition)
    yPosition += 10
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(60, 60, 60)
    doc.text('This smart contract has passed all security checks.', margin, yPosition)
    yPosition += 10
  }

  // Footer on last page
  const lastPage = doc.internal.pages.length - 1
  doc.setPage(lastPage)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(150, 150, 150)
  doc.text(
    'This report is generated by ChainProof AI - Smart Contract Security Platform',
    pageWidth / 2,
    pageHeight - 15,
    { align: 'center' }
  )
  doc.text(
    `Generated on ${new Date().toLocaleString()}`,
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  )

  // Add page numbers
  const pageCount = doc.internal.pages.length - 1
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: 'right' })
  }

  return doc
}
