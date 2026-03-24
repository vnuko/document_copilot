import { ChatOpenAI } from '@langchain/openai';
import { RunnableSequence, RunnablePassthrough, RunnableLambda } from '@langchain/core/runnables';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { LibSQLVectorStore } from '@langchain/community/vectorstores/libsql';
import { config } from '../config/index.js';
import { vectorStoreService } from './vectorstore.service.js';
import { STANDALONE_QUESTION_PROMPT, ANSWER_PROMPT } from './templates/index.js';

export interface ChatDebugInfo {
  originalQuestion: string;
  standaloneQuestion: string;
  retrievedDocuments: string[];
  context: string;
}

export interface ChatResult {
  output: string;
  debug?: ChatDebugInfo;
}

class ChatService {
  private llm = new ChatOpenAI({
    model: config.openaiModel,
    openAIApiKey: config.openaiApiKey,
  });

  private _retriever: ReturnType<LibSQLVectorStore['asRetriever']> | null = null;

  private get retriever() {
    if (!this._retriever) {
      this._retriever = vectorStoreService.getVectorStore().asRetriever(3);
    }
    return this._retriever;
  }

  private standaloneQuestionChain = ChatPromptTemplate.fromTemplate(STANDALONE_QUESTION_PROMPT)
    .pipe(this.llm)
    .pipe(new StringOutputParser());

  private answerChain = ChatPromptTemplate.fromTemplate(ANSWER_PROMPT)
    .pipe(this.llm)
    .pipe(new StringOutputParser());

  private retrieveContext = RunnableLambda.from(async (question: string) => {
    const docs = await this.retriever.invoke(question);
    const contents = docs.map((d) => d.pageContent);
    return {
      context: contents.join('\n\n'),
      documents: contents,
    };
  });

  private pipeline = RunnableSequence.from([
    async (input: { question: string }) => {
      const standaloneQuestion = await this.standaloneQuestionChain.invoke({
        question: input.question,
      });

      const { context, documents } = await this.retrieveContext.invoke(standaloneQuestion);

      return {
        originalQuestion: input.question,
        standaloneQuestion,
        context,
        documents,
      };
    },
    async (data) => {
      const output = await this.answerChain.invoke({
        context: data.context,
        question: data.originalQuestion,
      });

      return { output, ...data };
    },
  ]);

  async chat(question: string): Promise<string> {
    const result = await this.pipeline.invoke({ question });
    return result.output;
  }

  async chatWithDebug(question: string): Promise<ChatResult> {
    const result = await this.pipeline.invoke({ question });

    return {
      output: result.output,
      debug: {
        originalQuestion: result.originalQuestion,
        standaloneQuestion: result.standaloneQuestion,
        retrievedDocuments: result.documents,
        context: result.context,
      },
    };
  }
}

export const chatService = new ChatService();
