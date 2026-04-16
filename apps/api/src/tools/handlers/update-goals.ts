import { db, userProfiles } from '../../db';
import type { ToolHandler, UpdateGoalsArgs, UpdateGoalsResult } from '../types';

const LBS_TO_KG = 0.453592;
const VALID_GOAL_TYPES = ['lose_weight', 'maintain', 'gain_muscle', 'general_health'] as const;

export const updateGoalsHandler: ToolHandler<UpdateGoalsArgs, UpdateGoalsResult> = async (
  args,
  userId
) => {
  const {
    dailyCalorieTarget,
    targetWeightLbs,
    targetDate,
    goalType,
    dailyProteinTargetG,
    dailyCarbsTargetG,
    dailyFatTargetG,
  } = args;

  // Validate at least one field is provided
  if (
    dailyCalorieTarget === undefined &&
    targetWeightLbs === undefined &&
    targetDate === undefined &&
    goalType === undefined &&
    dailyProteinTargetG === undefined &&
    dailyCarbsTargetG === undefined &&
    dailyFatTargetG === undefined
  ) {
    throw new Error('Must provide at least one goal to update');
  }

  // Validate individual fields
  if (dailyCalorieTarget !== undefined && (typeof dailyCalorieTarget !== 'number' || dailyCalorieTarget <= 0)) {
    throw new Error('Invalid dailyCalorieTarget: must be a positive number');
  }

  if (targetWeightLbs !== undefined && (typeof targetWeightLbs !== 'number' || targetWeightLbs <= 0)) {
    throw new Error('Invalid targetWeightLbs: must be a positive number');
  }

  if (goalType !== undefined && !VALID_GOAL_TYPES.includes(goalType)) {
    throw new Error(`Invalid goalType. Must be one of: ${VALID_GOAL_TYPES.join(', ')}`);
  }

  if (dailyProteinTargetG !== undefined && (typeof dailyProteinTargetG !== 'number' || dailyProteinTargetG < 0)) {
    throw new Error('Invalid dailyProteinTargetG: must be a non-negative number');
  }

  if (dailyCarbsTargetG !== undefined && (typeof dailyCarbsTargetG !== 'number' || dailyCarbsTargetG < 0)) {
    throw new Error('Invalid dailyCarbsTargetG: must be a non-negative number');
  }

  if (dailyFatTargetG !== undefined && (typeof dailyFatTargetG !== 'number' || dailyFatTargetG < 0)) {
    throw new Error('Invalid dailyFatTargetG: must be a non-negative number');
  }

  console.log(`[update_goals] Updating goals for user ${userId}:`, args);

  // Build update object with only provided fields
  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (dailyCalorieTarget !== undefined) {
    updateData.dailyCalorieTarget = Math.round(dailyCalorieTarget);
  }
  if (targetWeightLbs !== undefined) {
    updateData.targetWeightLbs = String(Math.round(targetWeightLbs * 100) / 100);
    // Also store kg equivalent for DB consistency
    updateData.targetWeightKg = String(Math.round(targetWeightLbs * LBS_TO_KG * 100) / 100);
  }
  if (targetDate !== undefined) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
      throw new Error('Invalid targetDate: must be ISO format YYYY-MM-DD');
    }
    updateData.targetDate = targetDate;
  }
  if (goalType !== undefined) {
    updateData.goalType = goalType;
  }
  if (dailyProteinTargetG !== undefined) {
    updateData.dailyProteinTargetG = Math.round(dailyProteinTargetG);
  }
  if (dailyCarbsTargetG !== undefined) {
    updateData.dailyCarbsTargetG = Math.round(dailyCarbsTargetG);
  }
  if (dailyFatTargetG !== undefined) {
    updateData.dailyFatTargetG = Math.round(dailyFatTargetG);
  }

  // Upsert so we don't silently drop targets if the userProfiles row is
  // missing (which has happened for edge-case accounts). The insert branch
  // uses the same values; onConflict applies the incremental update.
  const insertValues: Record<string, unknown> = { userId };
  for (const [key, value] of Object.entries(updateData)) {
    if (key !== 'updatedAt') insertValues[key] = value;
  }

  const [updated] = await db
    .insert(userProfiles)
    .values(insertValues as typeof userProfiles.$inferInsert)
    .onConflictDoUpdate({
      target: userProfiles.userId,
      set: updateData,
    })
    .returning();

  if (!updated) {
    throw new Error('Failed to save goals');
  }

  return {
    success: true,
    message: 'Goals updated successfully',
    updatedGoals: {
      dailyCalorieTarget: updated.dailyCalorieTarget,
      targetWeightLbs: updated.targetWeightLbs ? parseFloat(updated.targetWeightLbs) : null,
      targetDate: updated.targetDate ?? null,
      goalType: updated.goalType,
      dailyProteinTargetG: updated.dailyProteinTargetG,
      dailyCarbsTargetG: updated.dailyCarbsTargetG,
      dailyFatTargetG: updated.dailyFatTargetG,
    },
  };
};
