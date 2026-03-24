# Document Copilot

A Retrieval-Augmented Generation (RAG) system built with LangChain that enables conversational Q&A over your custom documents.

## Overview

Document Copilot indexes your text documents and provides an intelligent chatbot API that answers questions based solely on the indexed content. The system uses semantic search with vector embeddings to retrieve relevant context, then leverages an LLM to generate accurate, context-grounded responses.

## Tech Stack

- **LangChain** - Orchestration framework for RAG pipeline
- **OpenAI API** - LLM for reasoning and embeddings
- **SQLite** with vector extension - Lightweight vector database
- **Express.js** - REST API server
- **TypeScript** - Type-safe development

## Prerequisites

- Node.js 18+
- OpenAI API key

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd document_copilot
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file:
   ```env
   OPENAI_API_KEY=your_openai_api_key
   PORT=3005
   DATA_SOURCE_PATH=./data/source.txt
   DATABASE_URL=file:documents.db
   OPENAI_MODEL=gpt-4o-mini
   OPENAI_EMBEDDING_MODEL=text-embedding-3-small
   ```

4. Add your source document:
   ```bash
   mkdir -p data
   echo "Your document content here..." > data/source.txt
   ```

5. Build and run:
   ```bash
   npm run build
   npm start
   ```

   For development with hot reload:
   ```bash
   npm run dev
   ```

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | Your OpenAI API key | Required |
| `PORT` | Server port | `3005` |
| `DATA_SOURCE_PATH` | Path to source text file | `./data/source.txt` |
| `DATABASE_URL` | SQLite database path | `file:documents.db` |
| `OPENAI_MODEL` | LLM model for responses | `gpt-4o-mini` |
| `OPENAI_EMBEDDING_MODEL` | Model for embeddings | `text-embedding-3-small` |

## API Endpoints

### Index Document

Indexes the source document into the vector store.

**POST** `/api/index`

```bash
curl -X POST http://localhost:3005/api/index \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "chunks": 42,
  "message": "Document indexed successfully"
}
```

### Chat

Ask questions about the indexed content.

**POST** `/api/chat`

```bash
curl -X POST http://localhost:3005/api/chat \
  -H "Content-Type: application/json" \
  -d '{"input": "What is the main topic of the document?"}'
```

**Response:**
```json
{
  "success": true,
  "output": "The document primarily discusses..."
}
```

**With Debug Info:**

```bash
curl -X POST http://localhost:3005/api/chat \
  -H "Content-Type: application/json" \
  -d '{"input": "What is this about?", "debug": true}'
```

**Response:**
```json
{
  "success": true,
  "output": "Based on the document...",
  "debug": {
    "originalQuestion": "What is this about?",
    "standaloneQuestion": "What is the main topic of the document?",
    "retrievedDocuments": ["Document chunk 1...", "Document chunk 2..."],
    "context": "Document chunk 1...\n\nDocument chunk 2..."
  }
}
```

## Workflow

### Indexing Workflow

1. **Document Loading** - Reads the source text file from the configured path
2. **Text Splitting** - Splits the document into chunks (500 characters with 50 character overlap) using `RecursiveCharacterTextSplitter`
3. **Embedding Generation** - Converts each chunk into vector embeddings using OpenAI's embedding model
4. **Vector Storage** - Stores the embeddings and document chunks in SQLite with vector extension for semantic search

### Chat Workflow

1. **Standalone Question Conversion** - Converts the user's question into a standalone, context-independent question to improve vector search accuracy
2. **Vector Search** - Searches the vector store for the 3 most relevant document chunks using semantic similarity
3. **Context Assembly** - Combines retrieved chunks into a context string
4. **Answer Generation** - Passes the context and original question to the LLM, which generates a response based solely on the provided context

## Project Structure

```
src/
├── config/
│   └── index.ts          # Configuration management
├── controllers/
│   ├── index.controller.ts   # Indexing endpoint
│   └── chat.controller.ts   # Chat endpoint
├── services/
│   ├── database.service.ts   # SQLite connection
│   ├── document.service.ts  # Document processing
│   ├── vectorstore.service.ts # Vector store operations
│   ├── chat.service.ts      # RAG pipeline
│   └── templates/
│       ├── standalone-question.prompt.ts
│       └── answer.prompt.ts
├── routes/
│   └── index.ts
├── app.ts
└── index.ts
```

## License

MIT