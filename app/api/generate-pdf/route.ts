import { NextRequest, NextResponse } from 'next/server';
import { generateEstimatePDFBackup } from '../../../lib/estimate-to-pdf-backup';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Extract data from FormData
    const to = formData.get('to') as string;
    const email = formData.get('email') as string;
    const itemsData = formData.getAll('items[]') as string[];
    
    // Parse items from JSON strings
    const items = itemsData.map(item => {
      try {
        return JSON.parse(item);
      } catch {
        return null;
      }
    }).filter(item => item !== null);
    
    // Create data object
    const data = {
      to,
      email,
      items,
      estimateNumber: '00001' // Default estimate number
    };
    
    // Validate required fields
    if (!data.to || !data.items || data.items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: to and items are required' },
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