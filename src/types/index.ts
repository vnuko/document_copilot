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
