import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CalculateDistanceRequest {
  originLat: number;
  originLng: number;
  destinationLat: number;
  destinationLng: number;
}

interface DistanceMatrixResponse {
  rows: Array<{
    elements: Array<{
      distance?: {
        value: number;
        text: string;
      };
      duration?: {
        value: number;
        text: string;
      };
      status: string;
    }>;
  }>;
  status: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('DISTANCEMATRIX_API_KEY');
    if (!apiKey) {
      console.error('DISTANCEMATRIX_API_KEY not found in environment');
      throw new Error('API key não configurada');
    }

    const { originLat, originLng, destinationLat, destinationLng }: CalculateDistanceRequest = await req.json();

    // Validate coordinates
    if (!originLat || !originLng || !destinationLat || !destinationLng) {
      throw new Error('Coordenadas de origem e destino são obrigatórias');
    }

    if (originLat < -90 || originLat > 90 || destinationLat < -90 || destinationLat > 90) {
      throw new Error('Latitude deve estar entre -90 e 90 graus');
    }

    if (originLng < -180 || originLng > 180 || destinationLng < -180 || destinationLng > 180) {
      throw new Error('Longitude deve estar entre -180 e 180 graus');
    }

    // Build DistanceMatrix.ai API URL
    const origins = `${originLat},${originLng}`;
    const destinations = `${destinationLat},${destinationLng}`;
    const url = `https://api.distancematrix.ai/maps/api/distancematrix/json?origins=${origins}&destinations=${destinations}&key=${apiKey}`;

    console.log('Calling DistanceMatrix.ai API:', { origins, destinations });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DistanceMatrix.ai API error:', response.status, errorText);
      throw new Error(`Erro na API DistanceMatrix.ai: ${response.status} ${response.statusText}`);
    }

    const data: DistanceMatrixResponse = await response.json();
    console.log('DistanceMatrix.ai API response:', data);

    // Check API response status
    if (data.status !== 'OK') {
      console.error('DistanceMatrix.ai API status error:', data.status);
      throw new Error(`Erro na resposta da API: ${data.status}`);
    }

    // Extract distance from response
    if (!data.rows || data.rows.length === 0 || !data.rows[0].elements || data.rows[0].elements.length === 0) {
      throw new Error('Nenhuma rota encontrada entre os pontos informados');
    }

    const element = data.rows[0].elements[0];
    
    if (element.status !== 'OK') {
      console.error('Element status error:', element.status);
      throw new Error(`Erro no cálculo da rota: ${element.status}`);
    }

    if (!element.distance) {
      throw new Error('Distância não encontrada na resposta da API');
    }

    // Convert distance from meters to kilometers
    const distanceInKm = element.distance.value / 1000;
    const formattedDistance = Math.round(distanceInKm * 100) / 100; // Round to 2 decimal places

    console.log('Distance calculated:', { 
      distanceMeters: element.distance.value, 
      distanceKm: formattedDistance 
    });

    return new Response(JSON.stringify({ 
      distance: formattedDistance,
      duration: element.duration?.value,
      success: true 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in calculate-distance function:', error);
    
    // Return user-friendly error messages
    let errorMessage = 'Erro desconhecido ao calcular distância';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return new Response(JSON.stringify({ 
      error: errorMessage,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});