import 'dotenv/config';

export const config = {
  port: parseInt(process.env.PORT || '3005', 10),
  dataSourcePath: process.env.DATA_SOURCE_PATH || './data/source.txt',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  databaseUrl: process.env.DATABASE_URL || 'file:documents.db',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-5-mini',
  openaiEmbeddingModel: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
};
