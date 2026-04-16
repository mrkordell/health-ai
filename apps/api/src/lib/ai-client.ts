import { OpenRouter } from '@openrouter/sdk';
import { env } from '../config/env';
import type { ToolDefinition } from './tool-definitions';

const client = new OpenRouter({
  apiKey: env.OPENROUTER_API_KEY,
});

const RETRY_MAX_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 1_000;
const REQUEST_TIMEOUT_MS = 60_000;

function isTransientError(error: unknown): boolean {
  if (error instanceof Error && 'status' in error) {
    const status = (error as { status: number }).status;
    return status === 429 || status >= 500;
  }
  if (error instanceof Error && error.name === 'TimeoutError') {
    return true;
  }
  return false;
}

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 1; attempt <= RETRY_MAX_ATTEMPTS; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === RETRY_MAX_ATTEMPTS || !isTransientError(error)) {
        throw error;
      }
      const delayMs = RETRY_BASE_DELAY_MS * 2 ** (attempt - 1);
      console.warn(
        `[ai-client] Request failed (attempt ${attempt}/${RETRY_MAX_ATTEMPTS}), retrying in ${delayMs}ms...`,
        error instanceof Error ? error.message : error
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw new Error('withRetry: unreachable');
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new TimeoutError(`Request timed out after ${ms}ms`)), ms)
    ),
  ]);
}

class TimeoutError extends Error {
  override name = 'TimeoutError';
}

function safeParseJson(raw: string | undefined): Record<string, unknown> {
  try {
    return JSON.parse(raw ?? '{}');
  } catch {
    console.warn('[ai-client] Failed to parse tool call arguments, falling back to {}:', raw);
    return {};
  }
}

export type ChatMessage =
  | { role: 'user' | 'system'; content: string }
  | { role: 'assistant'; content: string; toolCalls?: ToolCall[] }
  | { role: 'tool'; toolCallId: string; content: string };

export type ToolCall = {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
};

export type ChatResponse = {
  content: string | null;
  toolCalls: ToolCall[];
  finishReason: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
};

function formatMessageForApi(msg: ChatMessage): unknown {
  if (msg.role === 'tool') {
    return {
      role: 'tool' as const,
      toolCallId: msg.toolCallId,
      content: msg.content,
    };
  }
  if (msg.role === 'assistant' && msg.toolCalls && msg.toolCalls.length > 0) {
    return {
      role: 'assistant' as const,
      content: msg.content || '',
      toolCalls: msg.toolCalls.map((tc) => ({
        id: tc.id,
        type: 'function' as const,
        function: {
          name: tc.name,
          arguments: JSON.stringify(tc.arguments),
        },
      })),
    };
  }
  return {
    role: msg.role as 'user' | 'assistant' | 'system',
    content: msg.content,
  };
}

export async function sendChatWithTools(
  messages: ChatMessage[],
  tools: ToolDefinition[],
  systemPrompt?: string
): Promise<ChatResponse> {
  const formattedMessages = systemPrompt
    ? [{ role: 'system' as const, content: systemPrompt }, ...messages.map(formatMessageForApi)]
    : messages.map(formatMessageForApi);

  const response = await withRetry(() =>
    withTimeout(
      client.chat.send({
        model: env.OPENROUTER_MODEL,
        messages: formattedMessages as Parameters<typeof client.chat.send>[0]['messages'],
        tools: tools.map((t) => ({
          type: 'function' as const,
          function: {
            name: t.name,
            description: t.description,
            parameters: t.parameters,
          },
        })),
        toolChoice: 'auto',
      }),
      REQUEST_TIMEOUT_MS
    )
  );

  const choice = response.choices?.[0];
  const message = choice?.message;

  const toolCalls: ToolCall[] =
    message?.toolCalls?.map((tc) => ({
      id: tc.id ?? '',
      name: tc.function?.name ?? '',
      arguments: safeParseJson(tc.function?.arguments),
    })) ?? [];

  return {
    content: message?.content?.toString() ?? null,
    toolCalls,
    finishReason: choice?.finishReason ?? 'unknown',
    usage: response.usage
      ? {
          promptTokens: response.usage.promptTokens ?? 0,
          completionTokens: response.usage.completionTokens ?? 0,
          totalTokens: response.usage.totalTokens ?? 0,
        }
      : undefined,
  };
}

export type ToolResult = {
  toolCallId: string;
  result: unknown;
};

/**
 * Send a simple text prompt with no tools. Used for background summarization
 * and other utility LLM calls where we just want text back.
 */
export async function sendSimpleCompletion(
  systemPrompt: string,
  userContent: string
): Promise<string> {
  const response = await withRetry(() =>
    withTimeout(
      client.chat.send({
        model: env.OPENROUTER_MODEL,
        messages: [
          { role: 'system' as const, content: systemPrompt },
          { role: 'user' as const, content: userContent },
        ] as Parameters<typeof client.chat.send>[0]['messages'],
      }),
      REQUEST_TIMEOUT_MS
    )
  );

  return response.choices?.[0]?.message?.content?.toString() ?? '';
}

export { client as openRouterClient };
