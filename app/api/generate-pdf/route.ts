import { NextRequest, NextResponse } from 'next/server';
import { generateEstimatePDFBackup } from '../../../lib/estimate-to-pdf-backup';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.estimateNumber || !data.items) {
      return NextResponse.json(
        { error: 'Missing required fields: estimateNumber and items are required' },
        { status: 400 }
      );
    }

    // Generate PDF using the serverless-compatible backup method
    const pdfBuffer = await generateEstimatePDFBackup(data);
    
    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="estimate-${data.estimateNumber}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}