export interface Chat {
  id: number;
  title: string;
  created_at: string;
}

export interface Message {
  id: number;
  chat_id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface Citation {
  source: string;
  page: string;
}

export interface ParsedMessageContent {
  text: string;
  citations: Citation[];
}
