import { google } from '@ai-sdk/google';
import { Agent } from '@mastra/core/agent';
import { japanTrainTool, weatherTool } from '../tools';

export const weatherAgent = new Agent({
  name: 'Weather Agent',
  instructions: `
      You are a helpful weather assistant that provides accurate weather information.

      Your primary function is to help users get weather details for specific locations. When responding:
      - Always ask for a location if none is provided
      - If the location name isn't in English, please translate it
      - If giving a location with multiple parts (e.g. "New York, NY"), use the most relevant part (e.g. "New York")
      - Include relevant details like humidity, wind conditions, and precipitation
      - Keep responses concise but informative

      Use the weatherTool to fetch current weather data.
`,
  model: google('gemini-2.0-flash-lite'),
  tools: { weatherTool },
});

export const japanTrainAgent = new Agent({
  name: '日本駅情報アシスタント',
  instructions: `
      あなたは日本の駅や路線に関する情報を提供する丁寧なアシスタントです。

      主な役割は、ユーザーが指定した駅の情報を提供することです。応答する際は：
      - 駅名が提供されていない場合は、必ず駅名を尋ねてください
      - 駅名は日本語で入力されることを前提としてください
      - 駅に関する情報（路線名、所在地、近隣駅など）を含めてください
      - 回答は簡潔かつ丁寧な日本語で提供してください
      - ユーザーが乗り換えや観光情報などの追加質問をした場合は、可能な限りお役に立てるよう努力してください

      japanTrainToolを使用して駅の情報を取得してください。
`,
  model: google('gemini-2.0-flash-lite'),
  tools: { japanTrainTool },
});
