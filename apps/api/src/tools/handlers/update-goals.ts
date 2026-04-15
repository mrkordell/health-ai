import { eq } from 'drizzle-orm';
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
    goalType,
    dailyProteinTargetG,
    dailyCarbsTargetG,
    dailyFatTargetG,
  } = args;

  // Validate at least one field is provided
  if (
    dailyCalorieTarget === undefined &&
    targetWeightLbs === undefined &&
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

  const [updated] = await db
    .update(userProfiles)
    .set(updateData)
    .where(eq(userProfiles.userId, userId))
    .returning();

  if (!updated) {
    throw new Error('User profile not found');
  }

  return {
    success: true,
    message: 'Goals updated successfully',
    updatedGoals: {
      dailyCalorieTarget: updated.dailyCalorieTarget,
      targetWeightLbs: updated.targetWeightLbs ? parseFloat(updated.targetWeightLbs) : null,
      goalType: updated.goalType,
      dailyProteinTargetG: updated.dailyProteinTargetG,
      dailyCarbsTargetG: updated.dailyCarbsTargetG,
      dailyFatTargetG: updated.dailyFatTargetG,
    },
  };
};
