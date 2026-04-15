import { eq } from 'drizzle-orm';
import { db, onboardingProfiles, userProfiles } from '../../db';
import type { OnboardingProfile, UserProfile } from '../../db/schema';
import type { ToolHandler, CompleteOnboardingArgs, CompleteOnboardingResult } from '../types';

// Activity level multipliers for TDEE calculation
const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extremely_active: 1.9,
};

// Default macro splits by goal type (protein%, carbs%, fat%)
const MACRO_SPLITS: Record<string, { protein: number; carbs: number; fat: number }> = {
  lose_weight: { protein: 0.35, carbs: 0.35, fat: 0.30 },
  maintain: { protein: 0.25, carbs: 0.45, fat: 0.30 },
  gain_muscle: { protein: 0.35, carbs: 0.40, fat: 0.25 },
  general_health: { protein: 0.25, carbs: 0.45, fat: 0.30 },
};

interface NutritionTargets {
  dailyCalorieTarget: number;
  dailyProteinTargetG: number;
  dailyCarbsTargetG: number;
  dailyFatTargetG: number;
}

function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: string | null
): number {
  // Mifflin-St Jeor equation
  const baseBMR = 10 * weightKg + 6.25 * heightCm - 5 * age;

  if (gender === 'male') {
    return baseBMR + 5;
  } else if (gender === 'female') {
    return baseBMR - 161;
  }
  // For 'other' or 'prefer_not_to_say', use average
  return baseBMR - 78;
}

function calculateRecommendedTargets(
  onboarding: OnboardingProfile | null,
  profile: UserProfile | null
): NutritionTargets {
  // Default fallback values if we don't have enough data
  const DEFAULT_TARGETS: NutritionTargets = {
    dailyCalorieTarget: 2000,
    dailyProteinTargetG: 125,
    dailyCarbsTargetG: 225,
    dailyFatTargetG: 67,
  };

  // Need at least weight to calculate
  const weightKg = onboarding?.currentWeightKg
    ? parseFloat(onboarding.currentWeightKg)
    : null;

  if (!weightKg) {
    console.log('[complete_onboarding] No weight data, using defaults');
    return DEFAULT_TARGETS;
  }

  // Get height (default to average if not provided)
  const heightCm = onboarding?.heightCm
    ? parseFloat(onboarding.heightCm)
    : 170; // ~5'7" average

  // Get age (default to 30 if not provided)
  const age = onboarding?.age ?? 30;

  // Get gender
  const gender = onboarding?.gender ?? null;

  // Calculate BMR
  const bmr = calculateBMR(weightKg, heightCm, age, gender);

  // Get activity level multiplier
  const activityLevel = onboarding?.activityLevel ?? 'moderately_active';
  const activityMultiplier = ACTIVITY_MULTIPLIERS[activityLevel] ?? 1.55;

  // Calculate TDEE (Total Daily Energy Expenditure)
  const tdee = bmr * activityMultiplier;

  // Get goal type
  const goalType = profile?.goalType ?? 'general_health';

  // Adjust calories based on goal
  let dailyCalorieTarget: number;
  switch (goalType) {
    case 'lose_weight':
      dailyCalorieTarget = tdee - 500; // 500 calorie deficit
      break;
    case 'gain_muscle':
      dailyCalorieTarget = tdee + 300; // 300 calorie surplus
      break;
    case 'maintain':
    case 'general_health':
    default:
      dailyCalorieTarget = tdee;
  }

  // Ensure minimum calories (safety floor)
  dailyCalorieTarget = Math.max(dailyCalorieTarget, 1200);
  dailyCalorieTarget = Math.round(dailyCalorieTarget);

  // Calculate macros based on goal
  const macroSplit = MACRO_SPLITS[goalType] ?? MACRO_SPLITS.general_health!;

  // Protein: 4 calories per gram
  // Carbs: 4 calories per gram
  // Fat: 9 calories per gram
  const dailyProteinTargetG = Math.round((dailyCalorieTarget * macroSplit!.protein) / 4);
  const dailyCarbsTargetG = Math.round((dailyCalorieTarget * macroSplit!.carbs) / 4);
  const dailyFatTargetG = Math.round((dailyCalorieTarget * macroSplit!.fat) / 9);

  console.log(`[complete_onboarding] Calculated targets: BMR=${Math.round(bmr)}, TDEE=${Math.round(tdee)}, ` +
    `Target=${dailyCalorieTarget} cal, P=${dailyProteinTargetG}g, C=${dailyCarbsTargetG}g, F=${dailyFatTargetG}g`);

  return {
    dailyCalorieTarget,
    dailyProteinTargetG,
    dailyCarbsTargetG,
    dailyFatTargetG,
  };
}

export const completeOnboardingHandler: ToolHandler<CompleteOnboardingArgs, CompleteOnboardingResult> = async (
  args,
  userId
) => {
  console.log(`[complete_onboarding] Completing onboarding for user ${userId}`, args.skipReason ? `(skipped: ${args.skipReason})` : '');

  // Fetch current profile data
  const [profile] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId));

  const [onboarding] = await db
    .select()
    .from(onboardingProfiles)
    .where(eq(onboardingProfiles.userId, userId));

  // Calculate recommended nutrition targets
  const recommendations = calculateRecommendedTargets(onboarding ?? null, profile ?? null);

  // Update user profile with calculated targets
  await db
    .update(userProfiles)
    .set({
      dailyCalorieTarget: recommendations.dailyCalorieTarget,
      dailyProteinTargetG: recommendations.dailyProteinTargetG,
      dailyCarbsTargetG: recommendations.dailyCarbsTargetG,
      dailyFatTargetG: recommendations.dailyFatTargetG,
      onboardingComplete: true,
      updatedAt: new Date(),
    })
    .where(eq(userProfiles.userId, userId));

  // Mark onboarding as complete
  const onboardingStatus = args.skipReason ? 'skipped' : 'completed';

  if (onboarding) {
    await db
      .update(onboardingProfiles)
      .set({
        onboardingStatus,
        onboardingCompletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(onboardingProfiles.userId, userId));
  } else {
    // Create onboarding profile if it doesn't exist
    await db
      .insert(onboardingProfiles)
      .values({
        userId,
        onboardingStatus,
        onboardingCompletedAt: new Date(),
      });
  }

  return {
    success: true,
    message: args.skipReason
      ? `Onboarding skipped. I've set some default targets that you can adjust anytime.`
      : `Onboarding complete! I've calculated your personalized nutrition targets based on your profile.`,
    recommendations,
    summary: {
      preferredName: onboarding?.preferredName ?? null,
      goalType: profile?.goalType ?? null,
      currentWeightLbs: onboarding?.currentWeightLbs ? parseFloat(onboarding.currentWeightLbs) : null,
      targetWeightLbs: profile?.targetWeightLbs ? parseFloat(profile.targetWeightLbs) : null,
      activityLevel: onboarding?.activityLevel ?? null,
    },
  };
};
