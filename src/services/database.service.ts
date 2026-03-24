import { createClient, Client } from '@libsql/client';
import { config } from '../config/index.js';

class DatabaseService {
  private client: Client;
  private initialized = false;

  constructor() {
    this.client = createClient({
      url: config.databaseUrl,
    });
  }

  getClient(): Client {
    return this.client;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    await this.client.batch(
      [
        `CREATE TABLE IF NOT EXISTS documents (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          content TEXT NOT NULL,
          metadata TEXT,
          embedding F32_BLOB(1536)
        )`,
        `CREATE INDEX IF NOT EXISTS idx_documents_embedding ON documents (libsql_vector_idx(embedding, 'metric=cosine'))`,
      ],
      'write',
    );
    
    this.initialized = true;
    console.log('Database initialized');
  }
}

export const databaseService = new DatabaseService();