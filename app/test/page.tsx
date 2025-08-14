'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

export default function TestPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [estimateNumber, setEstimateNumber] = useState('00031');
  const [toField, setToField] = useState('Jane Smith\nABC Corporation\n789 Corporate Blvd\nCorporate City, CC 12345');
  const [items, setItems] = useState(JSON.stringify([
    { description: 'Consultation services', units: 10, cost: 540, amount: 5400 },
    { description: 'Installation work', units: 5, cost: 200, amount: 1000 },
    { description: 'Testing and validation', units: 2, cost: 300, amount: 600 }
  ], null, 2));
  const { toast } = useToast();

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    
    try {
      let parsedItems;
      try {
        parsedItems = JSON.parse(items);
      } catch (e) {
        throw new Error('Invalid JSON format for items');
      }

      const testData = {
        estimateNumber,
        to: toField,
        items: parsedItems
      };

      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`API request failed: ${response.status} ${response.statusText}\n${errorData}`);
      }

      const pdfBlob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `estimate-${estimateNumber}-${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "PDF Generated Successfully!",
        description: `Estimate ${estimateNumber} has been downloaded.`,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to generate PDF',
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>PDF Generation Test</CardTitle>
          <CardDescription>
            Test the PDF generation API with custom data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estimateNumber">Estimate Number</Label>
              <Input
                id="estimateNumber"
                value={estimateNumber}
                onChange={(e) => setEstimateNumber(e.target.value)}
                placeholder="00031"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="toField">To (Client Information)</Label>
              <Textarea
                id="toField"
                value={toField}
                onChange={(e) => setToField(e.target.value)}
                placeholder="Client Name\nCompany\nAddress"
                rows={4}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="items">Items (JSON Format)</Label>
            <Textarea
              id="items"
              value={items}
              onChange={(e) => setItems(e.target.value)}
              placeholder="Enter items in JSON format"
              rows={10}
              className="font-mono text-sm"
            />
          </div>

          <Button 
            onClick={handleGeneratePDF} 
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? 'Generating PDF...' : 'Generate PDF'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}