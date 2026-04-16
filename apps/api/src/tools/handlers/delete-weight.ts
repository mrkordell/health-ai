import { and, eq } from 'drizzle-orm';
import { db, weightLogs } from '../../db';
import type { ToolHandler, DeleteWeightArgs, DeleteWeightResult } from '../types';

export const deleteWeightHandler: ToolHandler<DeleteWeightArgs, DeleteWeightResult> = async (args, userId) => {
  const { weightLogId } = args;

  if (!weightLogId || typeof weightLogId !== 'string') {
    throw new Error('Missing required parameter: weightLogId');
  }

  console.log(`[delete_weight] Deleting weight log ${weightLogId} for user ${userId}`);

  const [deleted] = await db
    .delete(weightLogs)
    .where(and(eq(weightLogs.id, weightLogId), eq(weightLogs.userId, userId)))
    .returning();

  if (!deleted) {
    throw new Error(`Weight log not found: ${weightLogId}`);
  }

  return {
    success: true,
    weightLogId: deleted.id,
    message: `Deleted weight log (${deleted.weightLbs} lbs)`,
  };
};
