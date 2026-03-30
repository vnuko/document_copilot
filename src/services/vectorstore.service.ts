import { LibSQLVectorStore } from '@langchain/community/vectorstores/libsql';
import { OpenAIEmbeddings } from '@langchain/openai';
import { config } from '../config/index.js';
import { databaseService } from './database.service.js';

class VectorStoreService {
  private vectorStore: LibSQLVectorStore | null = null;
  private embeddings: OpenAIEmbeddings;
  private initialized = false;

  constructor() {
    this.embeddings = new OpenAIEmbeddings({
      model: config.openaiEmbeddingModel,
      openAIApiKey: config.openaiApiKey,
    });
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    this.vectorStore = new LibSQLVectorStore(this.embeddings, {
      db: databaseService.getClient(),
      table: 'documents',
      column: 'embedding',
    });

    this.initialized = true;
    console.log('Vector store initialized');
  }

  getVectorStore(): LibSQLVectorStore {
    if (!this.vectorStore) {
      throw new Error('Vector store not initialized. Call initialize() first.');
    }
    return this.vectorStore;
  }
}

export const vectorStoreService = new VectorStoreService();
