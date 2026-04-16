import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { requireUser } from '../middleware/auth';
import {
  sendChatWithTools,
  type ChatMessage,
  type ToolCall,
  type ToolResult,
} from '../lib/ai-client';
import { regularTools, onboardingTools } from '../lib/tool-definitions';
import { buildSystemPrompt, getOnboardingProfile, isOnboardingRequired } from '../lib/system-prompt';
import { executeToolCall } from '../tools';
import { db, conversationHistory } from '../db';
import { eq, desc } from 'drizzle-orm';
import { env } from '../config/env';

const chatRequestSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(10000),
});

const MAX_TOOL_ITERATIONS = 10;
const CONVERSATION_HISTORY_LIMIT = 24; // Enough for coaching continuity across onboarding + sessions

async function getConversationHistory(userId: string): Promise<ChatMessage[]> {
  const history = await db
    .select()
    .from(conversationHistory)
    .where(eq(conversationHistory.userId, userId))
    .orderBy(desc(conversationHistory.createdAt))
    .limit(CONVERSATION_HISTORY_LIMIT);

  const messages: ChatMessage[] = [];

  for (const msg of history.reverse()) {
    if (msg.role === 'user') {
      messages.push({ role: 'user', content: msg.content });
    } else if (msg.role === 'assistant') {
      // Check if this assistant message had tool calls
      if (msg.toolCalls && msg.toolResults) {
        const toolCalls: ToolCall[] = JSON.parse(msg.toolCalls);
        const toolResults: ToolResult[] = JSON.parse(msg.toolResults);

        // Add assistant message with tool calls
        messages.push({
          role: 'assistant',
          content: '',
          toolCalls,
        });

        // Add tool result messages
        for (const result of toolResults) {
          messages.push({
            role: 'tool',
            toolCallId: result.toolCallId,
            content: JSON.stringify(result.result),
          });
        }

        // Add the final assistant response
        if (msg.content) {
          messages.push({ role: 'assistant', content: msg.content });
        }
      } else {
        // Plain assistant message without tool calls
        messages.push({ role: 'assistant', content: msg.content });
      }
    }
  }

  return messages;
}

async function saveMessage(
  userId: string,
  role: 'user' | 'assistant',
  content: string,
  toolCalls?: ToolCall[],
  toolResults?: ToolResult[],
  tokensUsed?: number
): Promise<void> {
  await db.insert(conversationHistory).values({
    userId,
    role,
    content,
    toolCalls: toolCalls ? JSON.stringify(toolCalls) : null,
    toolResults: toolResults ? JSON.stringify(toolResults) : null,
    model: env.OPENROUTER_MODEL,
    tokensUsed: tokensUsed ?? null,
  });
}

export async function chatRoutes(fastify: FastifyInstance): Promise<void> {
  // Get chat history
  fastify.get(
    '/api/chat/history',
    {
      preHandler: fastify.authenticate,
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const authUser = requireUser(request);
      const userId = authUser.id;

      const history = await db
        .select({
          id: conversationHistory.id,
          role: conversationHistory.role,
          content: conversationHistory.content,
          createdAt: conversationHistory.createdAt,
        })
        .from(conversationHistory)
        .where(eq(conversationHistory.userId, userId))
        .orderBy(desc(conversationHistory.createdAt))
        .limit(50);

      return reply.send({
        messages: history.reverse().map((msg) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          createdAt: msg.createdAt.toISOString(),
        })),
      });
    }
  );

  // Clear chat history
  fastify.delete(
    '/api/chat/history',
    {
      preHandler: fastify.authenticate,
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const authUser = requireUser(request);
      const userId = authUser.id;

      await db
        .delete(conversationHistory)
        .where(eq(conversationHistory.userId, userId));

      return reply.send({ success: true });
    }
  );

  fastify.post(
    '/api/chat',
    {
      preHandler: fastify.authenticate,
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const authUser = requireUser(request);
      const userId = authUser.id;
      const userProfile = authUser.dbUser?.profile ?? null;

      const parseResult = chatRequestSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: parseResult.error.issues[0]?.message ?? 'Invalid request',
        });
      }

      const { message } = parseResult.data;

      // Tell Fastify we're taking over the response for SSE
      reply.hijack();

      // Set up SSE headers on the raw socket
      reply.raw.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      });

      const sendEvent = (event: string, data: unknown) => {
        const eventStr = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        reply.raw.write(eventStr);
        // Flush to ensure the event is sent immediately
        if (typeof (reply.raw as any).flush === 'function') {
          (reply.raw as any).flush();
        }
      };

      try {
        const history = await getConversationHistory(userId);
        const systemPrompt = await buildSystemPrompt({
          userId,
          profile: userProfile,
        });

        // Determine which tools to expose based on onboarding state
        const onboardingProfile = await getOnboardingProfile(userId);
        const needsOnboarding = isOnboardingRequired(userProfile, onboardingProfile);
        const tools = needsOnboarding
          ? [...regularTools, ...onboardingTools]
          : regularTools;

        const messages: ChatMessage[] = [...history, { role: 'user' as const, content: message }];

        await saveMessage(userId, 'user', message);

        let response = await sendChatWithTools(messages, tools, systemPrompt);
        let iterations = 0;
        let allToolCalls: ToolCall[] = [];
        let allToolResults: ToolResult[] = [];

        while (response.toolCalls.length > 0 && iterations < MAX_TOOL_ITERATIONS) {
          iterations++;
          const currentToolCalls = response.toolCalls;
          const currentToolResults: ToolResult[] = [];

          // Send tool_start events for all tools in this batch
          for (const toolCall of currentToolCalls) {
            sendEvent('tool_start', {
              id: toolCall.id,
              name: toolCall.name,
            });
          }

          for (const toolCall of currentToolCalls) {
            const executionResult = await executeToolCall(toolCall, userId);

            const resultPayload = executionResult.success
              ? executionResult.result
              : { error: executionResult.error };

            currentToolResults.push({
              toolCallId: toolCall.id,
              result: resultPayload,
            });

            // Send tool_end event
            sendEvent('tool_end', {
              id: toolCall.id,
              name: toolCall.name,
              success: executionResult.success,
            });

            request.log.info(
              {
                tool: toolCall.name,
                success: executionResult.success,
                iteration: iterations,
              },
              'Tool executed'
            );
          }

          allToolCalls.push(...currentToolCalls);
          allToolResults.push(...currentToolResults);

          // Append tool calls and results to messages for next iteration
          messages.push({
            role: 'assistant' as const,
            content: '',
            toolCalls: currentToolCalls,
          });
          for (const result of currentToolResults) {
            messages.push({
              role: 'tool' as const,
              toolCallId: result.toolCallId,
              content: JSON.stringify(result.result),
            });
          }

          response = await sendChatWithTools(messages, tools, systemPrompt);
        }

        if (iterations >= MAX_TOOL_ITERATIONS && response.toolCalls.length > 0) {
          request.log.warn('Max tool iterations reached, forcing text response');
        }

        const assistantMessage = response.content ?? 'I apologize, but I was unable to generate a response. Please try again.';

        await saveMessage(
          userId,
          'assistant',
          assistantMessage,
          allToolCalls.length > 0 ? allToolCalls : undefined,
          allToolResults.length > 0 ? allToolResults : undefined,
          response.usage?.totalTokens
        );

        // Send final message event
        sendEvent('message', {
          content: assistantMessage,
          toolsUsed: allToolCalls.map((tc) => tc.name),
        });

        // Send done event and close connection
        sendEvent('done', {});
        reply.raw.end();
      } catch (error) {
        request.log.error({ error }, 'Chat request failed');

        if (error instanceof Error && error.message.includes('rate limit')) {
          sendEvent('error', {
            code: 'rate_limited',
            message: 'Too many requests. Please wait a moment and try again.',
          });
        } else {
          sendEvent('error', {
            code: 'internal_error',
            message: 'Failed to process chat message. Please try again.',
          });
        }

        reply.raw.end();
      }
    }
  );
}
