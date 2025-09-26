/**
 * Serviço de roteirização usando DistanceMatrix.ai API
 * Calcula distâncias entre duas coordenadas geográficas
 */

import { supabase } from "@/integrations/supabase/client"

export interface RouteDistance {
  distance: number; // distância em metros
  duration?: number; // duração em segundos (opcional)
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Calcula a distância entre duas coordenadas usando a API DistanceMatrix.ai
 * @param origin - Coordenadas de origem
 * @param destination - Coordenadas de destino
 * @returns Distância em quilômetros
 */
export async function calculateDistance(
  origin: Coordinates,
  destination: Coordinates
): Promise<number> {
  try {
    // Validate coordinates first
    if (!validateCoordinates(origin) || !validateCoordinates(destination)) {
      throw new Error('Coordenadas inválidas fornecidas');
    }

    console.log('Calculando distância:', { origin, destination });

    // Call Supabase edge function
    const { data, error } = await supabase.functions.invoke('calculate-distance', {
      body: {
        originLat: origin.latitude,
        originLng: origin.longitude,
        destinationLat: destination.latitude,
        destinationLng: destination.longitude,
      },
    });

    if (error) {
      console.error('Erro na edge function:', error);
      throw new Error(`Erro na comunicação com o serviço: ${error.message}`);
    }

    if (!data.success) {
      throw new Error(data.error || 'Erro desconhecido no cálculo da distância');
    }

    console.log('Distância calculada:', data.distance, 'km');
    return data.distance;

  } catch (error) {
    console.error('Erro ao calcular distância:', error);
    
    // Handle network and service errors gracefully
    if (error instanceof Error) {
      if (error.message.includes('fetch') || error.message.includes('network')) {
        throw new Error('Serviço de cálculo de distância temporariamente indisponível. Por favor, insira a distância manualmente.');
      }
      throw new Error(`Erro ao calcular distância: ${error.message}`);
    }
    
    throw new Error('Erro desconhecido ao calcular distância');
  }
}

/**
 * Valida se as coordenadas são válidas
 * @param coordinates - Coordenadas a serem validadas
 * @returns true se válidas, false caso contrário
 */
export function validateCoordinates(coordinates: Coordinates): boolean {
  const { latitude, longitude } = coordinates;
  
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180 &&
    !isNaN(latitude) &&
    !isNaN(longitude)
  );
}

/**
 * Formata distância para exibição
 * @param distanceKm - Distância em quilômetros
 * @returns String formatada com unidade
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}