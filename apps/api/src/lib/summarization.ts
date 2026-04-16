import { eq, and, lte, desc, asc, sql, gt } from 'drizzle-orm';
import { db, conversationHistory, conversationSummaries } from '../db';
import { sendSimpleCompletion } from './ai-client';

// Thresholds
const SUMMARIZE_TRIGGER_COUNT = 100; // total stored messages before we run summarization
const KEEP_RAW_COUNT = 40;           // keep this many most-recent raw messages
const MIN_BATCH_TO_SUMMARIZE = 20;   // don't bother summarizing tiny batches

const SUMMARIZATION_SYSTEM_PROMPT = `You are a coaching conversation summarizer for a health coaching app called Vita.

You will be given a chronological log of messages between a user and their AI coach. Your job is to produce a concise, factual summary that preserves the information the coach needs to maintain continuity in future conversations.

Focus on:
- Key topics discussed (meal prep, workouts, specific foods, challenges)
- User preferences revealed (foods they like/dislike, eating patterns, schedule constraints)
- Decisions made or targets discussed
- Ongoing themes or recurring struggles
- Notable events (reached a goal, had a setback, milestone reached)

Do NOT include:
- Specific meal log entries (those are in the database)
- Specific weight entries (those are in the database)
- Generic small talk
- The coach's internal tool use

Output a single paragraph, 4-8 sentences, written in third person ("the user discussed..."). Be factual and specific. This summary will be injected into future system prompts so the coach has continuity.`;

interface RawMessage {
  id: string;
  role: string;
  content: string;
  createdAt: Date;
}

function formatMessagesForSummary(messages: RawMessage[]): string {
  return messages
    .filter((m) => m.content && m.content.trim().length > 0)
    .map((m) => {
      const date = m.createdAt.toISOString().split('T')[0];
      const who = m.role === 'user' ? 'User' : 'Vita';
      return `[${date}] ${who}: ${m.content}`;
    })
    .join('\n');
}

/**
 * Check if we should summarize older history for this user and do it if so.
 * Designed to run in the background after a chat response completes — errors
 * are logged but do not propagate, since summarization is a nice-to-have.
 */
export async function maybeSummarizeHistory(userId: string): Promise<void> {
  try {
    // Count total stored messages
    const [countRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(conversationHistory)
      .where(eq(conversationHistory.userId, userId));

    const totalMessages = countRow?.count ?? 0;
    if (totalMessages < SUMMARIZE_TRIGGER_COUNT) return;

    // Find the most recent summary so we don't re-summarize covered range
    const [lastSummary] = await db
      .select()
      .from(conversationSummaries)
      .where(eq(conversationSummaries.userId, userId))
      .orderBy(desc(conversationSummaries.messagesTo))
      .limit(1);

    const lowerBound = lastSummary?.messagesTo ?? new Date(0);

    // Grab recent messages to find the cutoff timestamp.
    // We want to keep the KEEP_RAW_COUNT most recent raw, and summarize anything
    // older than that which hasn't already been summarized.
    const recentCutoff = await db
      .select({ createdAt: conversationHistory.createdAt })
      .from(conversationHistory)
      .where(eq(conversationHistory.userId, userId))
      .orderBy(desc(conversationHistory.createdAt))
      .limit(1)
      .offset(KEEP_RAW_COUNT);

    if (recentCutoff.length === 0) return;
    const cutoffDate = recentCutoff[0]!.createdAt;

    // Fetch messages to summarize: newer than lowerBound, older than cutoffDate
    const toSummarize = await db
      .select({
        id: conversationHistory.id,
        role: conversationHistory.role,
        content: conversationHistory.content,
        createdAt: conversationHistory.createdAt,
      })
      .from(conversationHistory)
      .where(
        and(
          eq(conversationHistory.userId, userId),
          gt(conversationHistory.createdAt, lowerBound),
          lte(conversationHistory.createdAt, cutoffDate)
        )
      )
      .orderBy(asc(conversationHistory.createdAt));

    if (toSummarize.length < MIN_BATCH_TO_SUMMARIZE) return;

    const formatted = formatMessagesForSummary(toSummarize);
    const summary = await sendSimpleCompletion(SUMMARIZATION_SYSTEM_PROMPT, formatted);

    if (!summary || summary.trim().length === 0) {
      console.warn(`[summarization] Empty summary returned for user ${userId}`);
      return;
    }

    const firstMsg = toSummarize[0]!;
    const lastMsg = toSummarize[toSummarize.length - 1]!;

    await db.insert(conversationSummaries).values({
      userId,
      summary: summary.trim(),
      messagesFrom: firstMsg.createdAt,
      messagesTo: lastMsg.createdAt,
      messageCount: toSummarize.length,
    });

    console.log(
      `[summarization] Created summary for user ${userId} covering ${toSummarize.length} messages ` +
        `from ${firstMsg.createdAt.toISOString()} to ${lastMsg.createdAt.toISOString()}`
    );
  } catch (error) {
    console.error(`[summarization] Failed for user ${userId}:`, error);
  }
}

/**
 * Fetch all conversation summaries for a user, oldest first, for injection
 * into the system prompt.
 */
export async function getConversationSummaries(userId: string): Promise<
  Array<{ summary: string; messagesFrom: Date; messagesTo: Date; messageCount: number }>
> {
  const rows = await db
    .select({
      summary: conversationSummaries.summary,
      messagesFrom: conversationSummaries.messagesFrom,
      messagesTo: conversationSummaries.messagesTo,
      messageCount: conversationSummaries.messageCount,
    })
    .from(conversationSummaries)
    .where(eq(conversationSummaries.userId, userId))
    .orderBy(asc(conversationSummaries.messagesTo));

  return rows;
}
