import type { ToolName } from '../lib/tool-definitions';

export type ToolHandler<TArgs = Record<string, unknown>, TResult = unknown> = (
  args: TArgs,
  userId: string
) => Promise<TResult>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ToolRegistry = {
  [K in ToolName]?: ToolHandler<any, any>;
};

export interface ToolExecutionResult {
  success: boolean;
  result: unknown;
  error?: string;
}

// Tool argument types
export interface LookupNutritionArgs {
  query: string;
}

export interface LookupNutritionResult {
  query: string;
  source: 'ai_estimate';
  instruction: string;
}

export interface LogMealArgs {
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  description: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  notes?: string;
  /**
   * When the meal was eaten, in the user's local timezone.
   * Accepts `YYYY-MM-DDTHH:mm` or `YYYY-MM-DDTHH:mm:ss` (no offset).
   * Omit to stamp "now".
   */
  loggedAt?: string;
}

export interface LogMealResult {
  success: boolean;
  mealId: string;
  message: string;
  logged: {
    mealType: string;
    description: string;
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  };
}

export interface LogWeightArgs {
  weightLbs: number;
  notes?: string;
  /**
   * When the weigh-in happened, in the user's local timezone.
   * Accepts `YYYY-MM-DDTHH:mm` or `YYYY-MM-DDTHH:mm:ss` (no offset).
   * Omit to stamp "now".
   */
  loggedAt?: string;
}

export interface UpdateMealArgs {
  mealId: string;
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  description?: string;
  calories?: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
  notes?: string | null;
  loggedAt?: string;
}

export interface UpdateMealResult {
  success: boolean;
  mealId: string;
  message: string;
  updated: {
    mealType: string;
    description: string;
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    notes: string | null;
    loggedAt: string;
  };
}

export interface DeleteMealArgs {
  mealId: string;
}

export interface DeleteMealResult {
  success: boolean;
  mealId: string;
  message: string;
}

export interface UpdateWeightArgs {
  weightLogId: string;
  weightLbs?: number;
  notes?: string | null;
  loggedAt?: string;
}

export interface UpdateWeightResult {
  success: boolean;
  weightLogId: string;
  message: string;
  updated: {
    weightLbs: number;
    notes: string | null;
    loggedAt: string;
  };
}

export interface DeleteWeightArgs {
  weightLogId: string;
}

export interface DeleteWeightResult {
  success: boolean;
  weightLogId: string;
  message: string;
}

export interface LogWeightResult {
  success: boolean;
  weightLogId: string;
  message: string;
  logged: {
    weightLbs: number;
  };
}

export interface GetTodaySummaryArgs {
  timezone?: string;
}

export interface GetTodaySummaryResult {
  date: string;
  totalCalories: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
  mealCount: number;
  meals: Array<{
    id: string;
    loggedAt: string;
    mealType: string;
    description: string;
    calories: number;
  }>;
  targets: {
    dailyCalorieTarget: number | null;
    dailyProteinTargetG: number | null;
    dailyCarbsTargetG: number | null;
    dailyFatTargetG: number | null;
  };
  remaining: {
    calories: number | null;
    proteinG: number | null;
    carbsG: number | null;
    fatG: number | null;
  };
}

export interface GetWeightHistoryArgs {
  days?: number;
}

export interface GetWeightHistoryResult {
  entries: Array<{
    id: string;
    date: string;
    loggedAt: string;
    weightLbs: number;
    notes?: string;
  }>;
  trend: {
    startWeightLbs: number | null;
    endWeightLbs: number | null;
    changeLbs: number | null;
  };
}

export interface UpdateGoalsArgs {
  dailyCalorieTarget?: number;
  targetWeightLbs?: number;
  targetDate?: string; // ISO date (YYYY-MM-DD)
  goalType?: 'lose_weight' | 'maintain' | 'gain_muscle' | 'general_health';
  dailyProteinTargetG?: number;
  dailyCarbsTargetG?: number;
  dailyFatTargetG?: number;
}

export interface UpdateGoalsResult {
  success: boolean;
  message: string;
  updatedGoals: {
    dailyCalorieTarget: number | null;
    targetWeightLbs: number | null;
    targetDate: string | null;
    goalType: string | null;
    dailyProteinTargetG: number | null;
    dailyCarbsTargetG: number | null;
    dailyFatTargetG: number | null;
  };
}

export interface SuggestMealArgs {
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  maxCalories?: number;
  availableIngredients?: string[];
  dietaryRestrictions?: string[];
}

export interface SuggestMealResult {
  context: {
    mealType: string;
    maxCalories: number | null;
    remainingCalories: number | null;
    availableIngredients: string[];
    dietaryRestrictions: string[];
  };
  message: string;
}

export interface GetWeeklyProgressArgs {
  includeDetails?: boolean;
}

export interface GetWeeklyProgressResult {
  startDate: string;
  endDate: string;
  dailyStats: Array<{
    date: string;
    totalCalories: number;
    mealCount: number;
    mealsLogged: boolean;
  }>;
  averageDailyCalories: number;
  totalMeals: number;
  daysTracked: number;
  weightChange: {
    startWeightLbs: number | null;
    endWeightLbs: number | null;
    changeLbs: number | null;
  } | null;
}

// Onboarding tool types
export interface SaveOnboardingDataArgs {
  // Basic info
  preferredName?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';

  // Physical stats
  currentWeightLbs?: number;
  heightFeet?: number;
  heightInches?: number;

  // Goals
  goalType?: 'lose_weight' | 'maintain' | 'gain_muscle' | 'general_health';
  targetWeightLbs?: number;
  targetDate?: string; // ISO date (YYYY-MM-DD)

  // Fitness
  activityLevel?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';
  exerciseFrequency?: number;
  workoutTypes?: string[];

  // Eating habits
  mealsPerDay?: number;
  cookingFrequency?: 'never' | 'rarely' | 'sometimes' | 'often' | 'daily';
  eatingOutFrequency?: 'never' | 'rarely' | 'sometimes' | 'often' | 'daily';

  // Diet preferences
  preferredCuisines?: string[];
  favoriteFoods?: string[];
  dislikedFoods?: string[];

  // Dietary restrictions
  allergies?: string[];
  intolerances?: string[];
  dietaryRestrictions?: string[];

  // Preferred units
  preferredUnits?: 'metric' | 'imperial';

  // Timezone
  timezone?: string;
}

export interface SaveOnboardingDataResult {
  success: boolean;
  message: string;
  savedFields: string[];
}

export interface CompleteOnboardingArgs {
  skipReason?: string;
}

export interface SearchConversationsArgs {
  query: string;
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string;   // YYYY-MM-DD
}

export interface SearchConversationsResult {
  messages: Array<{
    date: string;
    role: string;
    content: string;
  }>;
  totalFound: number;
}

export interface CompleteOnboardingResult {
  success: boolean;
  message: string;
  recommendations: {
    dailyCalorieTarget: number;
    dailyProteinTargetG: number;
    dailyCarbsTargetG: number;
    dailyFatTargetG: number;
  };
  summary: {
    preferredName: string | null;
    goalType: string | null;
    currentWeightLbs: number | null;
    targetWeightLbs: number | null;
    activityLevel: string | null;
  };
}

// Search tools
export interface SearchMealsArgs {
  query?: string;
  dateFrom?: string;
  dateTo?: string;
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

export interface SearchMealsResult {
  meals: Array<{
    id: string;
    date: string;
    loggedAt: string;
    mealType: string;
    description: string;
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  }>;
  totalFound: number;
}
