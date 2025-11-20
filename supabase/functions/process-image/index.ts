import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AzureVisionResponse {
  denseCaptionsResult?: {
    values: Array<{
      text: string;
      confidence: number;
    }>;
  };
  readResult?: {
    blocks: Array<{
      lines: Array<{
        text: string;
        words: Array<{
          text: string;
          confidence: number;
        }>;
      }>;
    }>;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageData, language = 'en' } = await req.json();
    
    if (!imageData) {
      throw new Error('Image data is required');
    }

    console.log('Processing image with Azure Vision for language:', language);

    const AZURE_VISION_ENDPOINT = Deno.env.get('AZURE_VISION_ENDPOINT');
    const AZURE_VISION_KEY = Deno.env.get('AZURE_VISION_KEY');
    
    if (!AZURE_VISION_ENDPOINT || !AZURE_VISION_KEY) {
      throw new Error('Azure Vision credentials not configured');
    }

    // Convert base64 image data to blob for Azure API
    const base64Data = imageData.split(',')[1] || imageData;
    const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // Call Azure Computer Vision API with dense captions and OCR
    const azureResponse = await fetch(
      `${AZURE_VISION_ENDPOINT}/computervision/imageanalysis:analyze?api-version=2023-02-01-preview&features=denseCaptions,read&gender-neutral-caption=true`,
      {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': AZURE_VISION_KEY,
          'Content-Type': 'application/octet-stream',
        },
        body: imageBytes,
      }
    );

    if (!azureResponse.ok) {
      const errorText = await azureResponse.text();
      console.error('Azure Vision API error:', azureResponse.status, errorText);
      throw new Error(`Azure Vision API error: ${azureResponse.status}`);
    }

    const azureData = await azureResponse.json() as AzureVisionResponse;
    
    // Format results similar to the Python implementation
    const captions: string[] = [];
    let ocrText = '';
    const ocrLines: Array<{ text: string; confidence: number }> = [];

    // Extract dense captions with confidence > 0.7
    if (azureData.denseCaptionsResult?.values) {
      for (const caption of azureData.denseCaptionsResult.values) {
        if (caption.confidence > 0.7) {
          captions.push(caption.text);
        }
      }
    }

    // Extract OCR text
    if (azureData.readResult?.blocks) {
      for (const block of azureData.readResult.blocks) {
        for (const line of block.lines) {
          const avgConfidence = line.words.reduce((sum, word) => sum + word.confidence, 0) / line.words.length;
          ocrLines.push({
            text: line.text,
            confidence: Math.round(avgConfidence * 100) / 100
          });
          ocrText += line.text + ' ';
        }
      }
    }

    // Combine captions and OCR text for comprehensive description
    let description = '';
    
    if (captions.length > 0) {
      description += 'Image Description: ' + captions.join('. ') + '. ';
    }
    
    if (ocrText.trim()) {
      description += 'Text found in image: ' + ocrText.trim();
    }

    if (!description) {
      description = 'No significant content detected in the image.';
    }

    console.log('Successfully analyzed image with Azure Vision');

    return new Response(
      JSON.stringify({ 
        description,
        captions,
        ocrText: ocrText.trim(),
        ocrLines,
        language 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in process-image:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
