import { eq } from 'drizzle-orm';
import { db, onboardingProfiles, userProfiles } from '../../db';
import type { ToolHandler, SaveOnboardingDataArgs, SaveOnboardingDataResult } from '../types';

const LBS_TO_KG = 0.453592;
const FEET_INCHES_TO_CM = 2.54;

export const saveOnboardingDataHandler: ToolHandler<SaveOnboardingDataArgs, SaveOnboardingDataResult> = async (
  args,
  userId
) => {
  // Get list of provided fields (excluding undefined values)
  const providedFields = Object.entries(args).filter(([_, v]) => v !== undefined);

  if (providedFields.length === 0) {
    throw new Error('Must provide at least one field to save');
  }

  console.log(`[save_onboarding_data] Saving ${providedFields.length} field(s) for user ${userId}:`,
    providedFields.map(([k]) => k));

  // Build update object for onboarding_profiles
  const onboardingUpdate: Record<string, unknown> = {
    updatedAt: new Date(),
    onboardingStatus: 'in_progress',
  };

  // Build update object for user_profiles (for goal-related fields)
  const profileUpdate: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  // Map args to onboarding_profiles fields
  if (args.preferredName !== undefined) {
    onboardingUpdate.preferredName = args.preferredName;
  }
  if (args.age !== undefined) {
    onboardingUpdate.age = args.age;
  }
  if (args.gender !== undefined) {
    onboardingUpdate.gender = args.gender;
  }

  // Physical stats - store both units
  if (args.currentWeightLbs !== undefined) {
    onboardingUpdate.currentWeightLbs = String(Math.round(args.currentWeightLbs * 100) / 100);
    onboardingUpdate.currentWeightKg = String(Math.round(args.currentWeightLbs * LBS_TO_KG * 100) / 100);
  }
  if (args.heightFeet !== undefined) {
    onboardingUpdate.heightFeet = args.heightFeet;
  }
  if (args.heightInches !== undefined) {
    onboardingUpdate.heightInches = args.heightInches;
  }
  // Calculate total height in cm if we have both feet and inches
  if (args.heightFeet !== undefined || args.heightInches !== undefined) {
    // Fetch existing values if needed
    const [existing] = await db
      .select({ heightFeet: onboardingProfiles.heightFeet, heightInches: onboardingProfiles.heightInches })
      .from(onboardingProfiles)
      .where(eq(onboardingProfiles.userId, userId));

    const feet = args.heightFeet ?? existing?.heightFeet ?? 0;
    const inches = args.heightInches ?? existing?.heightInches ?? 0;
    const totalInches = (feet * 12) + inches;
    onboardingUpdate.heightCm = String(Math.round(totalInches * FEET_INCHES_TO_CM * 10) / 10);
  }

  // Fitness
  if (args.activityLevel !== undefined) {
    onboardingUpdate.activityLevel = args.activityLevel;
  }
  if (args.exerciseFrequency !== undefined) {
    onboardingUpdate.exerciseFrequency = args.exerciseFrequency;
  }
  if (args.workoutTypes !== undefined) {
    onboardingUpdate.workoutTypes = JSON.stringify(args.workoutTypes);
  }

  // Eating habits
  if (args.mealsPerDay !== undefined) {
    onboardingUpdate.mealsPerDay = args.mealsPerDay;
  }
  if (args.cookingFrequency !== undefined) {
    onboardingUpdate.cookingFrequency = args.cookingFrequency;
  }
  if (args.eatingOutFrequency !== undefined) {
    onboardingUpdate.eatingOutFrequency = args.eatingOutFrequency;
  }

  // Diet preferences (store as JSON)
  if (args.preferredCuisines !== undefined) {
    onboardingUpdate.preferredCuisines = JSON.stringify(args.preferredCuisines);
  }
  if (args.favoriteFoods !== undefined) {
    onboardingUpdate.favoriteFoods = JSON.stringify(args.favoriteFoods);
  }
  if (args.dislikedFoods !== undefined) {
    onboardingUpdate.dislikedFoods = JSON.stringify(args.dislikedFoods);
  }

  // Dietary restrictions (store as JSON)
  if (args.allergies !== undefined) {
    onboardingUpdate.allergies = JSON.stringify(args.allergies);
  }
  if (args.intolerances !== undefined) {
    onboardingUpdate.intolerances = JSON.stringify(args.intolerances);
  }
  if (args.dietaryRestrictions !== undefined) {
    onboardingUpdate.dietaryRestrictions = JSON.stringify(args.dietaryRestrictions);
  }

  // Fields that also go to user_profiles
  if (args.goalType !== undefined) {
    profileUpdate.goalType = args.goalType;
  }
  if (args.targetWeightLbs !== undefined) {
    profileUpdate.targetWeightLbs = String(Math.round(args.targetWeightLbs * 100) / 100);
    profileUpdate.targetWeightKg = String(Math.round(args.targetWeightLbs * LBS_TO_KG * 100) / 100);
  }
  if (args.preferredUnits !== undefined) {
    profileUpdate.preferredUnits = args.preferredUnits;
  }
  if (args.timezone !== undefined) {
    profileUpdate.timezone = args.timezone;
  }

  // Upsert onboarding profile
  await db
    .insert(onboardingProfiles)
    .values({
      userId,
      ...onboardingUpdate,
    })
    .onConflictDoUpdate({
      target: onboardingProfiles.userId,
      set: onboardingUpdate,
    });

  // Update user profile if we have profile-related fields
  const profileFieldCount = Object.keys(profileUpdate).length;
  if (profileFieldCount > 1) { // More than just updatedAt
    await db
      .update(userProfiles)
      .set(profileUpdate)
      .where(eq(userProfiles.userId, userId));
  }

  const savedFieldNames = providedFields.map(([k]) => k);

  // If timezone was updated, include current local time in response so AI uses correct time
  let timezoneNote = '';
  if (args.timezone) {
    const now = new Date();
    const timeFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: args.timezone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    const localTime = timeFormatter.format(now);
    timezoneNote = ` User's current local time is now ${localTime}.`;
  }

  return {
    success: true,
    message: `Saved ${savedFieldNames.length} field(s): ${savedFieldNames.join(', ')}.${timezoneNote}`,
    savedFields: savedFieldNames,
  };
};
