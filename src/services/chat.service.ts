import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { vectorStoreService } from './vectorstore.service.js';
import { memoryService } from './memory.service.js';
import { STANDALONE_QUESTION_PROMPT } from '../langchain/prompts/standalone.question.prompt.js';
import { ANSWER_PROMPT } from '../langchain/prompts/answer.prompt.js';
import { model } from '../langchain/models/openai.model.js';
import { ChatResult } from '../types/index.js';

class ChatService {
  async chatSimple(question: string, threadId: string): Promise<ChatResult> {
    return this.chat(question, threadId, false);
  }

  async chatwithDebug(question: string, threadId: string): Promise<ChatResult> {
    return this.chat(question, threadId, true);
  }

  private async chat(
    question: string,
    threadId: string,
    includeDebug: boolean,
  ): Promise<ChatResult> {
    const standaloneQuestion = await this.getStandaloneQuestion(question);
    const { context, docs } = await this.getContext(standaloneQuestion);
    const history = memoryService.formatHistoryToString(threadId);
    const response = await this.getResponse(context, question, history);

    const result: ChatResult = { output: response };

    memoryService.pushToMemory(threadId, question, response);

    result.debug = includeDebug
      ? {
          originalQuestion: question,
          queryQuestion: standaloneQuestion,
          retrievedDocuments: docs.map((doc) => doc.pageContent),
          context,
        }
      : undefined;

    return result;
  }

  private async getResponse(context: string, question: string, history: string): Promise<string> {
    const responseChain = ChatPromptTemplate.fromTemplate(ANSWER_PROMPT)
      .pipe(model)
      .pipe(new StringOutputParser());

    return responseChain.invoke({ context, question, history });
  }

  private async getStandaloneQuestion(question: string): Promise<string> {
    const standaloneQuestionChain = ChatPromptTemplate.fromTemplate(STANDALONE_QUESTION_PROMPT)
      .pipe(model)
      .pipe(new StringOutputParser());

    return standaloneQuestionChain.invoke({ question });
  }

  private async getContext(standaloneQuestion: string): Promise<{ context: string; docs: any[] }> {
    const retriever = vectorStoreService.getVectorStore().asRetriever(5);
    const docs = await retriever.invoke(standaloneQuestion);
    const context = this.squashDocs(docs);
    return { context, docs };
  }

  private squashDocs(docs: any[]): string {
    return docs
      .map((doc, i) => doc.pageContent.trim())
      .filter(Boolean)
      .join('\n\n---\n\n');
  }
}

export const chatService = new ChatService();
