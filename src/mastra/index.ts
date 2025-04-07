import { createLogger } from '@mastra/core/logger';
import { Mastra } from '@mastra/core/mastra';
import { VercelDeployer } from '@mastra/deployer-vercel';


import { japanTrainAgent, weatherAgent } from './agents';

export const mastra = new Mastra({
  agents: { weatherAgent, japanTrainAgent },
  logger: createLogger({
    name: 'Mastra',
    level: 'info',
  }),
  deployer: new VercelDeployer({
    teamSlug: String(process.env.VERCEL_TEAM_SLUG),
    projectName: String(process.env.VERCEL_PROJECT_NAME),
    token: String(process.env.VERCEL_TOKEN),
  })
});
