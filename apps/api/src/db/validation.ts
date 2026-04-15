import { z } from 'zod';

// Enum schemas
export const mealTypeSchema = z.enum(['breakfast', 'lunch', 'dinner', 'snack']);
export const goalTypeSchema = z.enum([
  'lose_weight',
  'maintain',
  'gain_muscle',
  'general_health',
]);
export const roleSchema = z.enum(['user', 'assistant', 'system']);
export const unitsSchema = z.enum(['metric', 'imperial']);
export const dataSourceSchema = z.enum([
  'ai_estimate',
  'nutritionix',
  'user_manual',
]);

// Insert schemas
export const insertUserSchema = z.object({
  clerkUserId: z.string().min(1, 'Clerk user ID is required'),
  email: z.string().email('Invalid email address'),
  fullName: z.string().optional(),
  profileImageUrl: z.string().url('Invalid profile image URL').optional(),
});

export const insertUserProfileSchema = z.object({
  userId: z.string().min(1),
  goalType: goalTypeSchema.optional(),
  targetWeightKg: z.number().positive().max(500).optional(),
  targetWeightLbs: z.number().positive().max(1100).optional(),
  dailyCalorieTarget: z.number().int().positive().max(10000).optional(),
  dailyProteinTargetG: z.number().int().positive().max(500).optional(),
  dailyCarbsTargetG: z.number().int().positive().max(1000).optional(),
  dailyFatTargetG: z.number().int().positive().max(500).optional(),
  preferredUnits: unitsSchema.optional(),
  timezone: z.string().optional(),
});

export const insertMealSchema = z.object({
  userId: z.string().min(1),
  mealType: mealTypeSchema,
  description: z.string().min(1, 'Meal description is required'),
  calories: z.number().int().min(0, 'Calories must be >= 0'),
  proteinG: z.number().min(0, 'Protein must be >= 0'),
  carbsG: z.number().min(0, 'Carbs must be >= 0'),
  fatG: z.number().min(0, 'Fat must be >= 0'),
  notes: z.string().optional(),
  loggedAt: z.date().optional(),
  dataSource: dataSourceSchema.optional(),
});

export const insertWeightLogSchema = z.object({
  userId: z.string().min(1),
  weightKg: z.number().positive().max(500, 'Weight must be < 500 kg'),
  weightLbs: z.number().positive().max(1100, 'Weight must be < 1100 lbs'),
  notes: z.string().optional(),
  loggedAt: z.date().optional(),
});

export const insertConversationMessageSchema = z.object({
  userId: z.string().min(1),
  role: roleSchema,
  content: z.string().min(1),
  toolCalls: z.string().optional(),
  toolResults: z.string().optional(),
  model: z.string().optional(),
  tokensUsed: z.number().int().positive().optional(),
});

// Inferred types from schemas
export type InsertUserInput = z.infer<typeof insertUserSchema>;
export type InsertUserProfileInput = z.infer<typeof insertUserProfileSchema>;
export type InsertMealInput = z.infer<typeof insertMealSchema>;
export type InsertWeightLogInput = z.infer<typeof insertWeightLogSchema>;
export type InsertConversationMessageInput = z.infer<
  typeof insertConversationMessageSchema
>;
