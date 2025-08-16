import { NextRequest, NextResponse } from 'next/server';
import { generateEstimatePDFBackup } from '../../../lib/estimate-to-pdf-backup';

export async function POST(request: NextRequest) {
  try {
    console.log('📥 PDF Generation Request received');
    const formData = await request.formData();
    console.log('📋 FormData extracted successfully');
    console.log('formData is', formData);
    // Extract data from FormData
    const to = formData.get('to') as string;
    const email = formData.get('email') as string;
    
    // Try to get items as array first (items[]), then as single field (items)
    let itemsData = formData.getAll('items[]') as string[];
    if (itemsData.length === 0) {
      const singleItems = formData.get('items') as string;
      if (singleItems) {
        itemsData = [singleItems];
      }
    }
    
    console.log('📊 FormData contents:');
    console.log('  - to:', to ? 'Present' : 'Missing');
    console.log('  - email:', email ? 'Present' : 'Missing');
    console.log('  - items data found:', itemsData.length > 0 ? 'Yes' : 'No');
    console.log('  - items raw data:', itemsData);
    
    // Parse items from JSON strings
    let items = [];
    if (itemsData.length > 0) {
      // If we have a single string that looks like an array, try to parse it directly
      if (itemsData.length === 1 && itemsData[0].startsWith('[')) {
        try {
          items = JSON.parse(itemsData[0]);
          console.log(`  ✅ Parsed items array directly:`, items.length, 'items');
        } catch (error) {
          console.log(`  ❌ Failed to parse items array:`, error);
        }
      } else if (itemsData.length === 1 && itemsData[0].includes('},{')) {
        // Handle comma-separated JSON objects (not a valid JSON array)
        try {
          const arrayString = '[' + itemsData[0] + ']';
          items = JSON.parse(arrayString);
          console.log(`  ✅ Parsed comma-separated items as array:`, items.length, 'items');
        } catch (error) {
          console.log(`  ❌ Failed to parse comma-separated items:`, error);
        }
      } else {
        // Parse each item individually
        items = itemsData.map((item, index) => {
          try {
            const parsed = JSON.parse(item);
            console.log(`  ✅ Item ${index + 1} parsed successfully:`, parsed.description);
            return parsed;
          } catch (error) {
            console.log(`  ❌ Item ${index + 1} parsing failed:`, item);
            return null;
          }
        }).filter(item => item !== null);
      }
    }
    
    console.log(`📦 Successfully parsed ${items.length} items`);
    
    // Create data object
    const data = {
      to,
      email,
      items,
      estimateNumber: '00001' // Default estimate number
    };
    
    console.log('🔍 Data validation:');
    console.log('  - to field:', data.to ? '✅ Valid' : '❌ Missing');
    console.log('  - items count:', data.items.length);
    
    // Validate required fields
    if (!data.to || !data.items || data.items.length === 0) {
      console.log('❌ Validation failed: Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields: to and items are required' },
        { status: 400 }
      );
    }
    
    console.log('✅ Validation passed, generating PDF...');

    // Generate PDF using the serverless-compatible backup method
    const startTime = Date.now();
    const pdfBuffer = await generateEstimatePDFBackup(data);
    const generationTime = Date.now() - startTime;
    
    console.log(`🎉 PDF generated successfully!`);
    console.log(`  - Generation time: ${generationTime}ms`);
    console.log(`  - PDF size: ${pdfBuffer.length} bytes (${(pdfBuffer.length / 1024).toFixed(2)} KB)`);
    console.log(`  - Filename: estimate-${data.estimateNumber}.pdf`);
    
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
    console.error('💥 Error generating PDF:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
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