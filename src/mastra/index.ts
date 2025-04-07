import { createLogger } from '@mastra/core/logger';
import { Mastra } from '@mastra/core/mastra';

import { japanTrainAgent, weatherAgent } from './agents';

export const mastra = new Mastra({
  agents: { weatherAgent, japanTrainAgent },
  logger: createLogger({
    name: 'Mastra',
    level: 'info',
  }),
});
