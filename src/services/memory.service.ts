import { Memory, ConversationMessage } from '../types/index.js';

class MemoryService {
  private memories: Map<string, Memory> = new Map();
  private readonly MAX_HISTORY_SIZE = 20;

  getMemory(threadId: string): Memory {
    if (!this.memories.has(threadId)) {
      this.memories.set(threadId, { conversationHistory: [] });
    }
    return this.memories.get(threadId)!;
  }

  pushToMemory(threadId: string, question: string, response: string): void {
    const memory = this.getMemory(threadId);
    memory.conversationHistory.push({ role: 'human', content: question });
    memory.conversationHistory.push({ role: 'ai', content: response });

    if (memory.conversationHistory.length > this.MAX_HISTORY_SIZE) {
      memory.conversationHistory = memory.conversationHistory.slice(-this.MAX_HISTORY_SIZE);
    }
  }

  formatHistoryToString(threadId: string): string {
    const memory = this.getMemory(threadId);
    if (memory.conversationHistory.length === 0) {
      return 'No previous conversation.';
    }

    return memory.conversationHistory
      .map(msg => `${msg.role === 'human' ? 'Human' : 'AI'}: ${msg.content}`)
      .join('\n');
  }
}

export const memoryService = new MemoryService();