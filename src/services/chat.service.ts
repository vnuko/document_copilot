import { StateGraph, START, END, Annotation, MemorySaver } from '@langchain/langgraph';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { vectorStoreService } from './vectorstore.service.js';
import { STANDALONE_QUESTION_PROMPT } from '../langchain/prompts/standalone.question.prompt.js';
import { ANSWER_PROMPT } from '../langchain/prompts/answer.prompt.js';
import { model } from '../langchain/models/openai.model.js';
import { ChatResult } from '../types/index.js';

const RagState = Annotation.Root({
  question: Annotation<string>(),
  standaloneQuestion: Annotation<string>(),
  context: Annotation<string>(),
  docs: Annotation<any[]>(),
  history: Annotation<string>(),
  response: Annotation<string>(),
  messages: Annotation<{ role: string; content: string }[]>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),
});

async function standaloneNode(state: typeof RagState.State) {
  const chain = ChatPromptTemplate.fromTemplate(STANDALONE_QUESTION_PROMPT)
    .pipe(model)
    .pipe(new StringOutputParser());

  const standaloneQuestion = await chain.invoke({ question: state.question });
  return { standaloneQuestion };
}

async function retrieveNode(state: typeof RagState.State) {
  const retriever = vectorStoreService.getVectorStore().asRetriever(5);
  const docs = await retriever.invoke(state.standaloneQuestion);
  const context = docs
    .map(doc => doc.pageContent.trim())
    .filter(Boolean)
    .join('\n\n---\n\n');

  return { docs, context };
}

async function generateNode(state: typeof RagState.State) {
  const chain = ChatPromptTemplate.fromTemplate(ANSWER_PROMPT)
    .pipe(model)
    .pipe(new StringOutputParser());

  const response = await chain.invoke({
    context: state.context,
    question: state.question,
    history: state.history,
  });

  const messages = [
    { role: 'human', content: state.question },
    { role: 'ai', content: response },
  ];

  return { response, messages };
}

const graph = new StateGraph(RagState)
  .addNode('standalone', standaloneNode)
  .addNode('retrieve', retrieveNode)
  .addNode('generate', generateNode)
  .addEdge(START, 'standalone')
  .addEdge('standalone', 'retrieve')
  .addEdge('retrieve', 'generate')
  .addEdge('generate', END);

const checkpointer = new MemorySaver();
const app = graph.compile({ checkpointer });

class ChatService {
  async chatSimple(question: string, threadId: string): Promise<ChatResult> {
    return this.chat(question, threadId, false);
  }

  async chatwithDebug(question: string, threadId: string): Promise<ChatResult> {
    return this.chat(question, threadId, true);
  }

  private async chat(question: string, threadId: string, includeDebug: boolean): Promise<ChatResult> {
    const config = { configurable: { thread_id: threadId } };

    const previousState = await app.getState(config);
    const history = this.formatHistory(previousState?.values?.messages);

    const result = await app.invoke(
      { question, history },
      config
    );

    const chatResult: ChatResult = { output: result.response };

    if (includeDebug) {
      chatResult.debug = {
        originalQuestion: question,
        queryQuestion: result.standaloneQuestion,
        retrievedDocuments: result.docs.map(doc => doc.pageContent),
        context: result.context,
      };
    }

    return chatResult;
  }

  private formatHistory(messages?: { role: string; content: string }[]): string {
    if (!messages || messages.length === 0) {
      return 'No previous conversation.';
    }

    const recentMessages = messages.slice(-20);

    return recentMessages
      .map(msg => `${msg.role === 'human' ? 'Human' : 'AI'}: ${msg.content}`)
      .join('\n');
  }
}

export const chatService = new ChatService();