import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import { tool } from "@langchain/core/tools";
import { config } from "../config/index.js";
import { vectorStoreService } from "./vectorstore.service.js";

export interface ChatDebugInfo {
  originalQuestion: string;
  retrievedDocuments: string[];
  context: string;
}

export interface ChatResult {
  output: string;
  debug?: ChatDebugInfo;
}

const retrievalTool = tool(
  async ({ query }) => {
    const retriever = vectorStoreService.getVectorStore().asRetriever(3);
    const docs = await retriever.invoke(query);
    return docs.map((d) => d.pageContent).join("\n\n");
  },
  {
    name: "retrieve_documents",
    description: "Search and retrieve relevant documents from the knowledge base. Use this to find information to answer user questions.",
    schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query to find relevant documents",
        },
      },
      required: ["query"],
    },
  }
);

const llm = new ChatOpenAI({
  model: config.openaiModel,
  openAIApiKey: config.openaiApiKey,
});

const SYSTEM_PROMPT = `You are a helpful and friendly support assistant.

Your job is to answer the user's question using the retrieved documents, but in your own words.

IMPORTANT RULES:
- Do NOT copy sentences or phrases from the documents.
- Do NOT mimic the writing style of the source material.
- Rewrite everything in a clear, simple, and natural way.
- Explain as if you are talking to a customer who has not read the document.
- Keep the answer concise and easy to understand.
- Focus on clarity over completeness.

Use the retrieve_documents tool to search for relevant information before answering.

If the retrieved documents don't contain the answer, say:
"I'm sorry, I don't know the answer to that."`;

const checkpointer = new MemorySaver();

const agent = createReactAgent({
  llm,
  tools: [retrievalTool],
  checkpointer,
  messageModifier: SYSTEM_PROMPT,
});

class ChatService {
  async chat(question: string, threadId: string): Promise<string> {
    const result = await agent.invoke(
      { messages: [{ role: "user", content: question }] },
      { configurable: { thread_id: threadId } }
    );
    const lastMessage = result.messages[result.messages.length - 1];
    const content = lastMessage.content;
    const output = typeof content === "string" ? content : content.map((c: { type: string; text?: string }) => (c.type === "text" ? c.text ?? "" : "")).join("");
    return output;
  }

  async chatWithDebug(question: string, threadId: string): Promise<ChatResult> {
    const retriever = vectorStoreService.getVectorStore().asRetriever(3);
    const docs = await retriever.invoke(question);
    const context = docs.map((d) => d.pageContent).join("\n\n");

    const result = await agent.invoke(
      { messages: [{ role: "user", content: question }] },
      { configurable: { thread_id: threadId } }
    );

    const lastMessage = result.messages[result.messages.length - 1];
    const content = lastMessage.content;
    const output = typeof content === "string" ? content : content.map((c: { type: string; text?: string }) => (c.type === "text" ? c.text ?? "" : "")).join("");

    return {
      output,
      debug: {
        originalQuestion: question,
        retrievedDocuments: docs.map((d) => d.pageContent),
        context,
      },
    };
  }
}

export const chatService = new ChatService();