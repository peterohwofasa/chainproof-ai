import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB, Audit, Contract, Vulnerability, AuditReport } from '@/models'
import puppeteer from 'puppeteer'

export async function GET(
  request: NextRequest,
  { params }: { params: { auditId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { auditId } = params
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'json'

    // Connect to MongoDB
    await connectDB()

    // Fetch the audit with related data
    const audit = await Audit.findOne({
      _id: auditId,
      userId: session.user.id,
    })
    .populate('contractId', 'name address')
    .lean()

    if (!audit) {
      return NextResponse.json(
        { error: 'Audit not found' },
        { status: 404 }
      )
    }

    // Fetch vulnerabilities for this audit
    const vulnerabilities = await Vulnerability.find({
      auditId: auditId,
    })
    .select('title severity category description recommendation')
    .sort({ severity: -1 })
    .lean()

    // Fetch the latest audit report
    const auditReport = await AuditReport.findOne({
      auditId: auditId,
    })
    .select('reportType content createdAt')
    .sort({ createdAt: -1 })
    .lean()

    if (!auditReport) {
      return NextResponse.json(
        { error: 'No audit report found' },
        { status: 404 }
      )
    }

    // Type assertion for auditReport since we know it's a single document
    const report = auditReport as any

    let reportContent
    try {
      reportContent = JSON.parse(report.content)
    } catch (error) {
      console.error('Error parsing report content:', error)
      reportContent = { content: report.content }
    }

    // Type assertion for audit since we know it's a single document
    const auditDoc = audit as any

    const auditData = {
      id: auditDoc._id.toString(),
      contractName: auditDoc.contractId?.name || 'Unknown Contract',
      contractAddress: auditDoc.contractId?.address || '',
      overallScore: auditDoc.overallScore || 0,
      riskLevel: auditDoc.riskLevel || 'UNKNOWN',
      status: auditDoc.status,
      startedAt: auditDoc.startedAt,
      completedAt: auditDoc.completedAt,
      auditDuration: auditDoc.auditDuration,
      vulnerabilities: vulnerabilities.map((vuln: any) => ({
        id: vuln._id.toString(),
        title: vuln.title,
        severity: vuln.severity,
        category: vuln.category,
        description: vuln.description,
        recommendation: vuln.recommendation,
      })),
      reportContent,
      createdAt: auditDoc.createdAt,
    }

    if (format === 'pdf') {
      try {
        // Generate PDF using puppeteer
        const pdfBuffer = await generatePDFBuffer(auditData)
        
        return new NextResponse(new Uint8Array(pdfBuffer), {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="audit-report-${auditData.contractName.replace(/[^a-zA-Z0-9]/g, '_')}-${auditId}.pdf"`,
          },
        })
      } catch (error) {
        console.error('Error generating PDF:', error)
        return NextResponse.json(
          { error: 'Failed to generate PDF report' },
          { status: 500 }
        )
      }
    }

    // Default JSON response
    return NextResponse.json({
      success: true,
      audit: auditData,
    })
  } catch (error) {
    console.error('Error fetching audit report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function generatePDFBuffer(auditData: any): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  
  try {
    const page = await browser.newPage()
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Audit Report - ${auditData.contractName}</title>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 0; 
            padding: 40px; 
            line-height: 1.6;
            color: #333;
          }
          .header { 
            text-align: center; 
            margin-bottom: 40px; 
            border-bottom: 3px solid #0066cc;
            padding-bottom: 20px;
          }
          .logo { 
            font-size: 28px; 
            font-weight: bold; 
            color: #0066cc; 
            margin-bottom: 10px;
          }
          .contract-name { 
            font-size: 24px; 
            font-weight: bold; 
            margin: 15px 0;
            color: #2c3e50;
          }
          .score { 
            font-size: 32px; 
            font-weight: bold; 
            margin: 20px 0;
            padding: 15px;
            border-radius: 8px;
            background: ${auditData.riskLevel === 'HIGH' ? '#fee2e2' : auditData.riskLevel === 'MEDIUM' ? '#fef3c7' : '#dcfce7'};
            color: ${auditData.riskLevel === 'HIGH' ? '#dc2626' : auditData.riskLevel === 'MEDIUM' ? '#f59e0b' : '#16a34a'};
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 30px 0;
          }
          .info-item {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #0066cc;
          }
          .info-label {
            font-weight: bold;
            color: #666;
            font-size: 14px;
            text-transform: uppercase;
          }
          .info-value {
            font-size: 16px;
            margin-top: 5px;
          }
          .vulnerabilities-section {
            margin-top: 40px;
          }
          .section-title {
            font-size: 24px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 20px;
            border-bottom: 2px solid #e9ecef;
            padding-bottom: 10px;
          }
          .vulnerability { 
            margin: 25px 0; 
            padding: 20px; 
            border-radius: 8px;
            border-left: 6px solid #ccc;
            background: #fff;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .critical { 
            border-left-color: #dc2626; 
            background: #fef2f2;
          }
          .high { 
            border-left-color: #f59e0b; 
            background: #fffbeb;
          }
          .medium { 
            border-left-color: #eab308; 
            background: #fefce8;
          }
          .low { 
            border-left-color: #16a34a; 
            background: #f0fdf4;
          }
          .vuln-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #2c3e50;
          }
          .vuln-severity {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 10px;
          }
          .severity-critical { background: #dc2626; color: white; }
          .severity-high { background: #f59e0b; color: white; }
          .severity-medium { background: #eab308; color: white; }
          .severity-low { background: #16a34a; color: white; }
          .vuln-field {
            margin: 10px 0;
          }
          .vuln-label {
            font-weight: bold;
            color: #666;
            margin-bottom: 5px;
          }
          .vuln-content {
            color: #444;
            line-height: 1.5;
          }
          .footer {
            margin-top: 50px;
            text-align: center;
            padding-top: 20px;
            border-top: 2px solid #e9ecef;
            color: #666;
            font-size: 14px;
          }
          @media print {
            body { margin: 0; }
            .vulnerability { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">ChainProof AI</div>
          <h1>Smart Contract Security Audit Report</h1>
          <div class="contract-name">${auditData.contractName}</div>
          <div class="score">Security Score: ${auditData.overallScore}/100</div>
        </div>
        
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Contract Address</div>
            <div class="info-value">${auditData.contractAddress || 'N/A'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Risk Level</div>
            <div class="info-value">${auditData.riskLevel}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Audit Completed</div>
            <div class="info-value">${auditData.completedAt ? new Date(auditData.completedAt).toLocaleDateString() : 'N/A'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Vulnerabilities Found</div>
            <div class="info-value">${auditData.vulnerabilities.length}</div>
          </div>
        </div>
        
        <div class="vulnerabilities-section">
          <h2 class="section-title">Security Findings</h2>
          ${auditData.vulnerabilities.length === 0 ? 
            '<p style="text-align: center; color: #16a34a; font-size: 18px; padding: 40px;">🎉 No vulnerabilities found! This contract appears to be secure.</p>' :
            auditData.vulnerabilities.map((vuln: any) => `
              <div class="vulnerability ${vuln.severity.toLowerCase()}">
                <div class="vuln-title">${vuln.title}</div>
                <span class="vuln-severity severity-${vuln.severity.toLowerCase()}">${vuln.severity}</span>
                
                <div class="vuln-field">
                  <div class="vuln-label">Category:</div>
                  <div class="vuln-content">${vuln.category}</div>
                </div>
                
                <div class="vuln-field">
                  <div class="vuln-label">Description:</div>
                  <div class="vuln-content">${vuln.description}</div>
                </div>
                
                ${vuln.recommendation ? `
                  <div class="vuln-field">
                    <div class="vuln-label">Recommendation:</div>
                    <div class="vuln-content">${vuln.recommendation}</div>
                  </div>
                ` : ''}
              </div>
            `).join('')
          }
        </div>
        
        <div class="footer">
          <p>Generated by ChainProof AI - Smart Contract Security Platform</p>
          <p>Report generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        </div>
      </body>
      </html>
    `
    
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' })
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    })
    
    return Buffer.from(pdfBuffer)
  } finally {
    await browser.close()
  }
}