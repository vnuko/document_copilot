export const STANDALONE_QUESTION_PROMPT = `
Rewrite the user's question into a concise, keyword-rich query for semantic search.

IMPORTANT RULES:
- Do NOT generalize or remove specific details
- Remove filler phrases
- Make the query concise but information-rich
- Prefer keyword-style phrasing over full sentences
- Do NOT add new information
- Keep the original meaning exactly

Return ONLY the rewritten query.

Question:
{question}

Rewritten query:
`;
