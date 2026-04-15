import { db, weightLogs } from '../../db';
import type { ToolHandler, LogWeightArgs, LogWeightResult } from '../types';

const LBS_TO_KG = 0.453592;

export const logWeightHandler: ToolHandler<LogWeightArgs, LogWeightResult> = async (
  args,
  userId
) => {
  const { weightLbs, notes } = args;

  if (typeof weightLbs !== 'number' || weightLbs <= 0) {
    throw new Error('Invalid weightLbs: must be a positive number');
  }

  const finalWeightLbs = Math.round(weightLbs * 100) / 100;
  const finalWeightKg = Math.round(weightLbs * LBS_TO_KG * 100) / 100;

  console.log(`[log_weight] Logging weight: ${finalWeightLbs} lbs for user ${userId}`);

  const [inserted] = await db
    .insert(weightLogs)
    .values({
      userId,
      weightKg: String(finalWeightKg),
      weightLbs: String(finalWeightLbs),
      notes: notes ?? null,
    })
    .returning();

  return {
    success: true,
    weightLogId: inserted.id,
    message: `Logged weight: ${finalWeightLbs} lbs`,
    logged: {
      weightLbs: finalWeightLbs,
    },
  };
};
