export type ToolDefinition = {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
};

export const estimateNutrition: ToolDefinition = {
  name: 'estimate_nutrition',
  description:
    'Estimate nutrition values for a food item using AI knowledge. Returns guidance for estimating calories and macros. These are AI estimates, not database lookups.',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description:
          'Natural language description of the food, e.g., "2 eggs and toast with butter"',
      },
    },
    required: ['query'],
  },
};

export const logMeal: ToolDefinition = {
  name: 'log_meal',
  description:
    'Log a meal to the user database. Call this after estimating nutrition or when the user provides their own values.',
  parameters: {
    type: 'object',
    properties: {
      mealType: {
        type: 'string',
        enum: ['breakfast', 'lunch', 'dinner', 'snack'],
        description: 'The type of meal',
      },
      description: {
        type: 'string',
        description: 'Description of what was eaten',
      },
      calories: {
        type: 'number',
        description: 'Total calories',
      },
      proteinG: {
        type: 'number',
        description: 'Protein in grams',
      },
      carbsG: {
        type: 'number',
        description: 'Carbohydrates in grams',
      },
      fatG: {
        type: 'number',
        description: 'Fat in grams',
      },
      notes: {
        type: 'string',
        description: 'Optional notes about the meal',
      },
    },
    required: ['mealType', 'description', 'calories', 'proteinG', 'carbsG', 'fatG'],
  },
};

export const logWeight: ToolDefinition = {
  name: 'log_weight',
  description:
    "Log the user's weight in pounds. Use this when the user reports their current weight.",
  parameters: {
    type: 'object',
    properties: {
      weightLbs: {
        type: 'number',
        description: 'Weight in pounds',
      },
      notes: {
        type: 'string',
        description: 'Optional notes about the weigh-in',
      },
    },
    required: ['weightLbs'],
  },
};

export const getTodaySummary: ToolDefinition = {
  name: 'get_today_summary',
  description:
    "Get today's nutrition summary including total calories, macros, and meal count. Use this to give the user progress updates.",
  parameters: {
    type: 'object',
    properties: {
      timezone: {
        type: 'string',
        description:
          "User's timezone (e.g., 'America/New_York'). Defaults to user profile timezone.",
      },
    },
  },
};

export const getWeightHistory: ToolDefinition = {
  name: 'get_weight_history',
  description:
    "Get the user's weight history for trend analysis. Use this to help track progress toward weight goals.",
  parameters: {
    type: 'object',
    properties: {
      days: {
        type: 'integer',
        description: 'Number of days of history to retrieve (default: 30)',
      },
    },
  },
};

export const updateGoals: ToolDefinition = {
  name: 'update_goals',
  description:
    "Update the user's fitness and nutrition goals. Use this when the user wants to change their targets.",
  parameters: {
    type: 'object',
    properties: {
      dailyCalorieTarget: {
        type: 'integer',
        description: 'New daily calorie target',
      },
      targetWeightLbs: {
        type: 'number',
        description: 'Target weight in pounds',
      },
      targetDate: {
        type: 'string',
        description: 'Target date for reaching the goal, ISO format YYYY-MM-DD (optional)',
      },
      goalType: {
        type: 'string',
        enum: ['lose_weight', 'maintain', 'gain_muscle', 'general_health'],
        description: 'Type of fitness goal',
      },
      dailyProteinTargetG: {
        type: 'integer',
        description: 'Daily protein target in grams',
      },
      dailyCarbsTargetG: {
        type: 'integer',
        description: 'Daily carbohydrates target in grams',
      },
      dailyFatTargetG: {
        type: 'integer',
        description: 'Daily fat target in grams',
      },
    },
  },
};

export const suggestMeal: ToolDefinition = {
  name: 'suggest_meal',
  description:
    'Get meal suggestions based on constraints. Use this when the user asks for meal ideas.',
  parameters: {
    type: 'object',
    properties: {
      mealType: {
        type: 'string',
        enum: ['breakfast', 'lunch', 'dinner', 'snack'],
        description: 'Type of meal to suggest',
      },
      maxCalories: {
        type: 'number',
        description: 'Maximum calories for the meal',
      },
      availableIngredients: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of ingredients the user has available',
      },
      dietaryRestrictions: {
        type: 'array',
        items: { type: 'string' },
        description: 'Dietary restrictions (e.g., vegetarian, gluten-free)',
      },
    },
    required: ['mealType'],
  },
};

export const getWeeklyProgress: ToolDefinition = {
  name: 'get_weekly_progress',
  description:
    "Get the user's progress over the past week including daily calorie totals and weight changes. Use this for weekly check-ins and trend analysis.",
  parameters: {
    type: 'object',
    properties: {
      includeDetails: {
        type: 'boolean',
        description: 'Whether to include detailed meal breakdowns',
      },
    },
  },
};

// Onboarding tools
export const saveOnboardingData: ToolDefinition = {
  name: 'save_onboarding_data',
  description:
    'Save or update user profile information (age, height, current weight, activity level, food preferences, allergies, timezone, etc.). Use during onboarding to capture data as it comes in, and also after onboarding whenever the user tells you updated personal info (e.g. "I weigh 265 now", "I moved to PST", "I just went vegetarian"). Saves only the fields provided.',
  parameters: {
    type: 'object',
    properties: {
      // Basic info
      preferredName: {
        type: 'string',
        description: "User's preferred name or nickname",
      },
      age: {
        type: 'integer',
        description: "User's age in years",
      },
      gender: {
        type: 'string',
        enum: ['male', 'female', 'other', 'prefer_not_to_say'],
        description: "User's gender (optional)",
      },

      // Physical stats
      currentWeightLbs: {
        type: 'number',
        description: 'Current weight in pounds',
      },
      heightFeet: {
        type: 'integer',
        description: 'Height - feet component (e.g., 5 for 5\'10")',
      },
      heightInches: {
        type: 'integer',
        description: 'Height - inches component (e.g., 10 for 5\'10")',
      },

      // Goals
      goalType: {
        type: 'string',
        enum: ['lose_weight', 'maintain', 'gain_muscle', 'general_health'],
        description: 'Primary fitness/health goal',
      },
      targetWeightLbs: {
        type: 'number',
        description: 'Target weight in pounds',
      },
      targetDate: {
        type: 'string',
        description: 'Target date for reaching the goal weight, ISO format YYYY-MM-DD (optional)',
      },

      // Fitness
      activityLevel: {
        type: 'string',
        enum: ['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active'],
        description:
          'General activity level: sedentary (desk job, little exercise), lightly_active (light exercise 1-3 days/week), moderately_active (moderate exercise 3-5 days/week), very_active (hard exercise 6-7 days/week), extremely_active (very hard exercise, physical job)',
      },
      exerciseFrequency: {
        type: 'integer',
        description: 'Days per week they exercise (0-7)',
      },
      workoutTypes: {
        type: 'array',
        items: { type: 'string' },
        description: 'Types of workouts they do (e.g., running, weightlifting, yoga, swimming)',
      },

      // Eating habits
      mealsPerDay: {
        type: 'integer',
        description: 'Typical number of meals per day (1-6)',
      },
      cookingFrequency: {
        type: 'string',
        enum: ['never', 'rarely', 'sometimes', 'often', 'daily'],
        description: 'How often they cook at home',
      },
      eatingOutFrequency: {
        type: 'string',
        enum: ['never', 'rarely', 'sometimes', 'often', 'daily'],
        description: 'How often they eat out or order takeout',
      },

      // Diet preferences
      preferredCuisines: {
        type: 'array',
        items: { type: 'string' },
        description: 'Preferred cuisines (e.g., Italian, Mexican, Asian, Mediterranean)',
      },
      favoriteFoods: {
        type: 'array',
        items: { type: 'string' },
        description: 'Foods they particularly enjoy',
      },
      dislikedFoods: {
        type: 'array',
        items: { type: 'string' },
        description: 'Foods they dislike or avoid by preference',
      },

      // Dietary restrictions
      allergies: {
        type: 'array',
        items: { type: 'string' },
        description: 'Food allergies (e.g., peanuts, tree nuts, shellfish, eggs, dairy)',
      },
      intolerances: {
        type: 'array',
        items: { type: 'string' },
        description: 'Food intolerances (e.g., lactose, gluten, fructose)',
      },
      dietaryRestrictions: {
        type: 'array',
        items: { type: 'string' },
        description: 'Dietary restrictions (e.g., vegetarian, vegan, pescatarian, halal, kosher, keto, paleo)',
      },

      // Preferred units
      preferredUnits: {
        type: 'string',
        enum: ['metric', 'imperial'],
        description: 'Preferred unit system (imperial = lbs/feet, metric = kg/cm)',
      },

      // Timezone
      timezone: {
        type: 'string',
        description: "User's timezone as IANA identifier (e.g., 'America/New_York', 'America/Chicago', 'America/Los_Angeles'). Ask the user what timezone they're in or infer from context.",
      },
    },
  },
};

export const completeOnboarding: ToolDefinition = {
  name: 'complete_onboarding',
  description:
    'Complete the onboarding process. This calculates recommended calorie and macro targets based on collected data, marks onboarding as complete, and transitions to regular coaching mode. Call when you have collected sufficient information (at minimum: current weight and goal type) or when the user wants to finish early.',
  parameters: {
    type: 'object',
    properties: {
      skipReason: {
        type: 'string',
        description: 'If the user wants to skip/finish early, note the reason (optional)',
      },
    },
  },
};

export const searchMeals: ToolDefinition = {
  name: 'search_meals',
  description:
    'Search the user\'s meal history by keyword, date range, or meal type. Use when the user asks about past meals, wants to find something they ate before, or needs historical meal data. If no filters provided, returns the last 30 days of meals.',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Keyword to search for in meal descriptions (e.g., "chicken", "pizza", "salad")',
      },
      dateFrom: {
        type: 'string',
        description: 'Start date for search range, ISO format YYYY-MM-DD',
      },
      dateTo: {
        type: 'string',
        description: 'End date for search range, ISO format YYYY-MM-DD',
      },
      mealType: {
        type: 'string',
        enum: ['breakfast', 'lunch', 'dinner', 'snack'],
        description: 'Filter by meal type',
      },
    },
  },
};

export const searchConversations: ToolDefinition = {
  name: 'search_conversations',
  description:
    'Search past conversation history by keyword. Use when the user references a past discussion, asks "what did we talk about regarding X?", or wants to recall previous coaching advice.',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Keyword or phrase to search for in past messages',
      },
      dateFrom: {
        type: 'string',
        description: 'Start date for search range, ISO format YYYY-MM-DD',
      },
      dateTo: {
        type: 'string',
        description: 'End date for search range, ISO format YYYY-MM-DD',
      },
    },
    required: ['query'],
  },
};

// Regular coaching tools (available after onboarding)
export const regularTools: ToolDefinition[] = [
  estimateNutrition,
  logMeal,
  logWeight,
  getTodaySummary,
  getWeightHistory,
  updateGoals,
  suggestMeal,
  getWeeklyProgress,
  saveOnboardingData,
  searchMeals,
  searchConversations,
];

// Onboarding-only tools (save_onboarding_data is in regularTools since it's used post-onboarding too)
export const onboardingTools: ToolDefinition[] = [
  completeOnboarding,
];

// All tools (for backwards compatibility)
export const allTools: ToolDefinition[] = [
  ...regularTools,
  ...onboardingTools,
];

export type ToolName =
  | 'estimate_nutrition'
  | 'log_meal'
  | 'log_weight'
  | 'get_today_summary'
  | 'get_weight_history'
  | 'update_goals'
  | 'suggest_meal'
  | 'get_weekly_progress'
  | 'save_onboarding_data'
  | 'complete_onboarding'
  | 'search_meals'
  | 'search_conversations';
