import { createClient } from '@libsql/client';

const client = createClient({
  url: 'file:documents.db',
});

export async function initDatabase() {
  await client.batch(
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

  console.log('Database initialized: documents.db');
}

export { client };
