/**
 * Serviço de roteirização usando OSRM API
 * Calcula distâncias entre duas coordenadas geográficas
 */

export interface RouteDistance {
  distance: number; // distância em metros
  duration?: number; // duração em segundos (opcional)
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Calcula a distância entre duas coordenadas usando a API OSRM
 * @param origin - Coordenadas de origem
 * @param destination - Coordenadas de destino
 * @returns Distância em quilômetros
 */
export async function calculateDistance(
  origin: Coordinates,
  destination: Coordinates
): Promise<number> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=false&alternatives=false&steps=false`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`OSRM API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.routes || data.routes.length === 0) {
      throw new Error('Nenhuma rota encontrada entre os pontos informados');
    }

    // Retorna distância em quilômetros (OSRM retorna em metros)
    const distanceInKm = data.routes[0].distance / 1000;
    return Math.round(distanceInKm * 100) / 100; // Arredonda para 2 casas decimais
  } catch (error) {
    console.error('Erro ao calcular distância:', error);
    throw new Error(
      error instanceof Error 
        ? `Erro ao calcular distância: ${error.message}`
        : 'Erro desconhecido ao calcular distância'
    );
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