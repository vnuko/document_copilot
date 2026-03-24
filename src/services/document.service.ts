import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { config } from '../config/index.js';
import { vectorStoreService } from './vectorstore.service.js';

class DocumentService {
  private splitter: RecursiveCharacterTextSplitter;

  constructor() {
    this.splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 50,
    });
  }

  async processDocument(): Promise<{ chunks: number }> {
    const filePath = resolve(process.cwd(), config.dataSourcePath);
    const text = await readFile(filePath, 'utf-8');
    const documents = await this.splitter.createDocuments([text]);

    const vectorStore = vectorStoreService.getVectorStore();
    await vectorStore.addDocuments(documents);

    return { chunks: documents.length };
  }
}

export const documentService = new DocumentService();