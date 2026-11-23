import { apiClient } from './axios';
import { Chat, Message } from '../types/chat';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

/**
 * Employee: Get all previous chat conversations.
 */
export async function getChatsApi(): Promise<Chat[]> {
  const response = await apiClient.get<Chat[]>('/api/chat/');
  return response.data;
}

/**
 * Employee: Create a new chat.
 */
export async function createChatApi(title: string = 'New Conversation'): Promise<Chat> {
  const response = await apiClient.post<Chat>('/api/chat/', { title });
  return response.data;
}

/**
 * Employee: Get messages of a specific chat.
 */
export async function getMessagesApi(chatId: number): Promise<Message[]> {
  const response = await apiClient.get<Message[]>(`/api/chat/${chatId}/messages`);
  return response.data;
}

/**
 * Employee: Send message synchronously.
 */
export async function sendMessageApi(chatId: number, content: string): Promise<Message> {
  const response = await apiClient.post<Message>(`/api/chat/${chatId}/messages`, { content });
  return response.data;
}

/**
 * Employee: Delete a chat conversation.
 */
export async function deleteChatApi(chatId: number): Promise<{ message: string }> {
  const response = await apiClient.delete<{ message: string }>(`/api/chat/${chatId}`);
  return response.data;
}

/**
 * Employee: Stream assistant answer using SSE with JWT Authorization.
 * Handles the custom Authorization Bearer header by using fetch with response.body ReadableStream.
 */
export async function streamChatApi({
  chatId,
  content,
  onToken,
  onDone,
  onError,
  signal,
}: {
  chatId: number;
  content: string;
  onToken: (token: string) => void;
  onDone: () => void;
  onError: (error: Error) => void;
  signal?: AbortSignal;
}): Promise<void> {
  const token = localStorage.getItem('policypilot_token');
  const url = `${API_BASE_URL}/api/chat/${chatId}/stream`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify({ content }),
      signal,
    });

    if (!response.ok) {
      let errorMsg = `Server error (${response.status})`;
      try {
        const errorJson = await response.json();
        if (errorJson.detail) errorMsg = errorJson.detail;
      } catch {
        // Fallback to status text
      }
      throw new Error(errorMsg);
    }

    if (!response.body) {
      throw new Error('Readable stream not supported by server');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data:')) {
          const jsonStr = trimmed.replace(/^data:\s*/, '').trim();
          if (!jsonStr) continue;

          try {
            const data = JSON.parse(jsonStr);
            if (data.type === 'token' && typeof data.content === 'string') {
              onToken(data.content);
            } else if (data.type === 'done') {
              onDone();
              return;
            }
          } catch (e) {
            console.error('Failed to parse SSE JSON chunk:', jsonStr, e);
          }
        }
      }
    }

    // Finished stream
    onDone();
  } catch (err: unknown) {
    if (signal?.aborted) return;
    const error = err instanceof Error ? err : new Error(String(err));
    onError(error);
  }
}
