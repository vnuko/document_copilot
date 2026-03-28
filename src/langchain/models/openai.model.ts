import { ChatOpenAI } from '@langchain/openai';

import { config } from '../../config/index.js';

export const model = new ChatOpenAI({
  model: config.openaiModel,
  openAIApiKey: config.openaiApiKey,
});