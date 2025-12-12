import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GeocodeRequest {
  endereco?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
}

interface GeocodeResult {
  lat: number;
  lng: number;
  formatted_address: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('DISTANCEMATRIX_GEOCODING_API_KEY');
    if (!apiKey) {
      console.error('DISTANCEMATRIX_GEOCODING_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: GeocodeRequest = await req.json();
    console.log('Geocode request received:', body);

    // Build the address string from components
    const addressParts: string[] = [];
    
    if (body.endereco) {
      addressParts.push(body.endereco);
    }
    if (body.numero && body.numero !== 'S/N') {
      addressParts.push(body.numero);
    }
    if (body.bairro) {
      addressParts.push(body.bairro);
    }
    if (body.cidade) {
      addressParts.push(body.cidade);
    }
    if (body.estado) {
      addressParts.push(body.estado);
    }
    if (body.cep) {
      addressParts.push(body.cep);
    }
    
    // Add Brazil to improve geocoding accuracy
    addressParts.push('Brasil');

    const fullAddress = addressParts.join(', ');
    console.log('Full address for geocoding:', fullAddress);

    if (!fullAddress || addressParts.length <= 1) {
      return new Response(
        JSON.stringify({ error: 'Endereço insuficiente para geocodificação' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Encode the address for URL
    const encodedAddress = encodeURIComponent(fullAddress);
    const apiUrl = `https://api.distancematrix.ai/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;
    
    console.log('Calling DistanceMatrix Geocoding API...');
    
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    console.log('Geocoding API response status:', data.status);

    if (data.status !== 'OK' || !data.result || data.result.length === 0) {
      console.error('Geocoding failed:', data);
      return new Response(
        JSON.stringify({ 
          error: 'Não foi possível encontrar as coordenadas para este endereço',
          details: data.status 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = data.result[0];
    const location = result.geometry?.location;

    if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
      console.error('Invalid location data:', result);
      return new Response(
        JSON.stringify({ error: 'Dados de localização inválidos' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geocodeResult: GeocodeResult = {
      lat: location.lat,
      lng: location.lng,
      formatted_address: result.formatted_address || fullAddress,
    };

    console.log('Geocoding successful:', geocodeResult);

    return new Response(
      JSON.stringify(geocodeResult),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Geocode error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro ao processar geocodificação', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
