import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

interface GeocodingResponse {
  results: {
    latitude: number;
    longitude: number;
    name: string;
  }[];
}
interface WeatherResponse {
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    wind_gusts_10m: number;
    weather_code: number;
  };
}

export const weatherTool = createTool({
  id: 'get-weather',
  description: 'Get current weather for a location',
  inputSchema: z.object({
    location: z.string().describe('City name'),
  }),
  outputSchema: z.object({
    temperature: z.number(),
    feelsLike: z.number(),
    humidity: z.number(),
    windSpeed: z.number(),
    windGust: z.number(),
    conditions: z.string(),
    location: z.string(),
  }),
  execute: async ({ context }) => {
    return await getWeather(context.location);
  },
});

const getWeather = async (location: string) => {
  const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`;
  const geocodingResponse = await fetch(geocodingUrl);
  const geocodingData = (await geocodingResponse.json()) as GeocodingResponse;

  if (!geocodingData.results?.[0]) {
    throw new Error(`Location '${location}' not found`);
  }

  const { latitude, longitude, name } = geocodingData.results[0];

  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_gusts_10m,weather_code`;

  const response = await fetch(weatherUrl);
  const data = (await response.json()) as WeatherResponse;

  return {
    temperature: data.current.temperature_2m,
    feelsLike: data.current.apparent_temperature,
    humidity: data.current.relative_humidity_2m,
    windSpeed: data.current.wind_speed_10m,
    windGust: data.current.wind_gusts_10m,
    conditions: getWeatherCondition(data.current.weather_code),
    location: name,
  };
};

function getWeatherCondition(code: number): string {
  const conditions: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    56: 'Light freezing drizzle',
    57: 'Dense freezing drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Light freezing rain',
    67: 'Heavy freezing rain',
    71: 'Slight snow fall',
    73: 'Moderate snow fall',
    75: 'Heavy snow fall',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail',
  };
  return conditions[code] || 'Unknown';
}

export const japanTrainTool = createTool({
  id: 'japan-train-info',
  description: '日本の駅や路線の情報を取得します',
  inputSchema: z.object({
    station: z.string().describe('駅名（例：東京、新宿、大阪）'),
  }),
  outputSchema: z.object({
    station: z.string(),
    lines: z.array(z.string()),
    prefecture: z.string(),
    postalCode: z.string().optional(),
    address: z.string().optional(),
    nearbyStations: z.array(z.string()).optional(),
  }),
  execute: async ({ context }) => {
    return await getStationInfo(context.station);
  },
});

const getStationInfo = async (stationName: string) => {
  const encodedStation = encodeURIComponent(stationName);
  const apiUrl = `https://express.heartrails.com/api/json?method=getStations&name=${encodedStation}`;

  const response = await fetch(apiUrl);
  const data = await response.json();

  if (!data.response.station || data.response.station.length === 0) {
    throw new Error(`駅名 '${stationName}' が見つかりませんでした。`);
  }

  // Use the first station result
  const station = data.response.station[0];

  // Get unique line names from all matching stations
  const allLines = new Set<string>();
  data.response.station.forEach((s: { line: string }) => {
    allLines.add(s.line);
  });

  // Get nearby stations (if available)
  let nearbyStations: string[] = [];
  try {
    const nearbyUrl = `https://express.heartrails.com/api/json?method=getStations&x=${station.x}&y=${station.y}`;
    const nearbyResponse = await fetch(nearbyUrl);
    const nearbyData = await nearbyResponse.json();

    if (nearbyData.response.station) {
      // Filter out the original station and get unique station names
      nearbyStations = Array.from(
        new Set(
          nearbyData.response.station
            .filter((s: { name: string }) => s.name !== station.name)
            .map((s: { name: string }) => s.name)
        )
      ).slice(0, 5); // Limit to 5 nearby stations
    }
  } catch (error) {
    // If nearby stations can't be fetched, continue without them
    console.error('Failed to fetch nearby stations:', error);
  }

  return {
    station: station.name,
    lines: Array.from(allLines),
    prefecture: station.prefecture,
    postalCode: station.postal,
    address: `${station.prefecture}${station.city}${station.town || ''}`,
    nearbyStations: nearbyStations.length > 0 ? nearbyStations : undefined,
  };
};
