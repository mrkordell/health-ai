const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new ApiError(error.message || 'Request failed', response.status, error.code);
  }

  return response.json();
}

export type ChatEventType = 'tool_start' | 'tool_end' | 'message' | 'error' | 'done';

export interface ToolStartEvent {
  type: 'tool_start';
  id: string;
  name: string;
}

export interface ToolEndEvent {
  type: 'tool_end';
  id: string;
  name: string;
  success: boolean;
}

export interface MessageEvent {
  type: 'message';
  content: string;
  toolsUsed: string[];
}

export interface ErrorEvent {
  type: 'error';
  code: string;
  message: string;
}

export interface DoneEvent {
  type: 'done';
}

export type ChatEvent = ToolStartEvent | ToolEndEvent | MessageEvent | ErrorEvent | DoneEvent;

export interface ChatStreamCallbacks {
  onToolStart?: (id: string, name: string) => void;
  onToolEnd?: (id: string, name: string, success: boolean) => void;
  onMessage?: (content: string) => void;
  onError?: (code: string, message: string) => void;
  onDone?: () => void;
}

export interface ChatHistoryMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface ChatHistoryResponse {
  messages: ChatHistoryMessage[];
}

export async function getChatHistory(token: string): Promise<ChatHistoryResponse> {
  return apiRequest<ChatHistoryResponse>('/api/chat/history', {
    method: 'GET',
    token,
  });
}

export async function clearChatHistory(token: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>('/api/chat/history', {
    method: 'DELETE',
    token,
  });
}

export async function sendChatMessageStream(
  message: string,
  token: string,
  callbacks: ChatStreamCallbacks
): Promise<void> {
  console.log('[SSE] Starting chat stream request');

  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ message }),
  });

  console.log('[SSE] Response status:', response.status);
  console.log('[SSE] Response headers:', Object.fromEntries(response.headers.entries()));

  if (!response.ok) {
    const errorText = await response.text();
    console.log('[SSE] Error response body:', errorText);
    try {
      const error = JSON.parse(errorText);
      throw new ApiError(error.message || 'Request failed', response.status, error.code);
    } catch (e) {
      if (e instanceof ApiError) throw e;
      throw new ApiError('Request failed', response.status);
    }
  }

  const reader = response.body?.getReader();
  if (!reader) {
    console.log('[SSE] No response body reader');
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  console.log('[SSE] Starting to read stream');

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      console.log('[SSE] Stream done');
      break;
    }

    const chunk = decoder.decode(value, { stream: true });
    console.log('[SSE] Received chunk:', chunk);
    buffer += chunk;

    // Split by double newline to get complete events
    const events = buffer.split('\n\n');
    buffer = events.pop() || ''; // Keep incomplete event in buffer

    console.log('[SSE] Parsed events count:', events.length, 'Remaining buffer:', buffer);

    for (const event of events) {
      if (!event.trim()) continue;

      console.log('[SSE] Processing event:', event);

      const lines = event.split('\n');
      let eventType = '';
      let eventData = '';

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          eventType = line.slice(7).trim();
        } else if (line.startsWith('data: ')) {
          eventData = line.slice(6);
        }
      }

      console.log('[SSE] Event type:', eventType, 'Data:', eventData);

      if (eventType && eventData) {
        try {
          const data = JSON.parse(eventData);
          console.log('[SSE] Parsed data:', data);

          switch (eventType) {
            case 'tool_start':
              console.log('[SSE] Calling onToolStart:', data.id, data.name);
              callbacks.onToolStart?.(data.id, data.name);
              break;
            case 'tool_end':
              console.log('[SSE] Calling onToolEnd:', data.id, data.name, data.success);
              callbacks.onToolEnd?.(data.id, data.name, data.success);
              break;
            case 'message':
              console.log('[SSE] Calling onMessage:', data.content?.substring(0, 50) + '...');
              callbacks.onMessage?.(data.content);
              break;
            case 'error':
              console.log('[SSE] Calling onError:', data.code, data.message);
              callbacks.onError?.(data.code, data.message);
              break;
            case 'done':
              console.log('[SSE] Calling onDone');
              callbacks.onDone?.();
              break;
            default:
              console.log('[SSE] Unknown event type:', eventType);
          }
        } catch (e) {
          console.error('[SSE] Parse error:', e, 'Raw data:', eventData);
        }
      }
    }
  }

  console.log('[SSE] Stream processing complete');
}

// Onboarding status
export interface OnboardingStatus {
  needsOnboarding: boolean;
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped';
  completedAt: string | null;
}

export async function getOnboardingStatus(token: string): Promise<OnboardingStatus> {
  return apiRequest<OnboardingStatus>('/api/user/onboarding-status', {
    method: 'GET',
    token,
  });
}
