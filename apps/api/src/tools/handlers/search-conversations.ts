import { eq, and, gte, lte, ilike, desc, ne } from 'drizzle-orm';
import { db, conversationHistory } from '../../db';
import type { ToolHandler, SearchConversationsArgs, SearchConversationsResult } from '../types';

const MAX_RESULTS = 20;
const MAX_CONTENT_LENGTH = 200;

export const searchConversationsHandler: ToolHandler<
  SearchConversationsArgs,
  SearchConversationsResult
> = async (args, userId) => {
  const { query, dateFrom, dateTo } = args;

  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    throw new Error('query is required and must be a non-empty string');
  }

  const conditions = [
    eq(conversationHistory.userId, userId),
    ilike(conversationHistory.content, `%${query}%`),
    ne(conversationHistory.content, ''),
    ne(conversationHistory.role, 'system'),
  ];

  if (dateFrom) {
    conditions.push(gte(conversationHistory.createdAt, new Date(dateFrom + 'T00:00:00Z')));
  }

  if (dateTo) {
    conditions.push(lte(conversationHistory.createdAt, new Date(dateTo + 'T23:59:59Z')));
  }

  console.log(
    `[search_conversations] Searching for "${query}" for user ${userId}` +
      (dateFrom ? ` from ${dateFrom}` : '') +
      (dateTo ? ` to ${dateTo}` : '')
  );

  const results = await db
    .select({
      createdAt: conversationHistory.createdAt,
      role: conversationHistory.role,
      content: conversationHistory.content,
    })
    .from(conversationHistory)
    .where(and(...conditions))
    .orderBy(desc(conversationHistory.createdAt))
    .limit(MAX_RESULTS);

  const messages = results.map((row) => {
    const content =
      row.content.length > MAX_CONTENT_LENGTH
        ? row.content.substring(0, MAX_CONTENT_LENGTH) + '...'
        : row.content;

    return {
      date: row.createdAt.toISOString(),
      role: row.role,
      content,
    };
  });

  console.log(`[search_conversations] Found ${messages.length} matching messages`);

  return {
    messages,
    totalFound: messages.length,
  };
};
