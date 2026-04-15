import { OpenRouter } from '@openrouter/sdk';
import { env } from '../config/env';
import type { ToolDefinition } from './tool-definitions';

const client = new OpenRouter({
  apiKey: env.OPENROUTER_API_KEY,
});

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

  const response = await client.chat.send({
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
  });

  const choice = response.choices?.[0];
  const message = choice?.message;

  const toolCalls: ToolCall[] =
    message?.toolCalls?.map((tc) => ({
      id: tc.id ?? '',
      name: tc.function?.name ?? '',
      arguments: JSON.parse(tc.function?.arguments ?? '{}'),
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

export async function sendChatWithToolResults(
  messages: ChatMessage[],
  tools: ToolDefinition[],
  pendingToolCalls: ToolCall[],
  toolResults: ToolResult[],
  systemPrompt?: string
): Promise<ChatResponse> {
  const formattedMessages: unknown[] = systemPrompt
    ? [{ role: 'system' as const, content: systemPrompt }, ...messages.map(formatMessageForApi)]
    : messages.map(formatMessageForApi);

  // Add assistant message with tool calls
  formattedMessages.push({
    role: 'assistant' as const,
    content: '',
    toolCalls: pendingToolCalls.map((tc) => ({
      id: tc.id,
      type: 'function' as const,
      function: {
        name: tc.name,
        arguments: JSON.stringify(tc.arguments),
      },
    })),
  });

  // Add tool results
  for (const result of toolResults) {
    formattedMessages.push({
      role: 'tool' as const,
      toolCallId: result.toolCallId,
      content: JSON.stringify(result.result),
    });
  }

  const response = await client.chat.send({
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
  });

  const choice = response.choices?.[0];
  const message = choice?.message;

  const toolCalls: ToolCall[] =
    message?.toolCalls?.map((tc) => ({
      id: tc.id ?? '',
      name: tc.function?.name ?? '',
      arguments: JSON.parse(tc.function?.arguments ?? '{}'),
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

export { client as openRouterClient };
