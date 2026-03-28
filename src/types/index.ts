export interface ChatInfo {
  originalQuestion: string;
  queryQuestion: string;
  retrievedDocuments: string[];
  context: string;
}

export interface ChatResult {
  output: string;
  debug?: ChatInfo;
}

export type MessageRole = 'human' | 'ai';

export interface ConversationMessage {
  role: MessageRole;
  content: string;
}

export interface Memory {
  conversationHistory: ConversationMessage[];
}
