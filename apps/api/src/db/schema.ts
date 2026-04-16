import {
  pgTable,
  varchar,
  text,
  integer,
  decimal,
  timestamp,
  uuid,
  index,
  uniqueIndex,
  pgEnum,
  boolean,
  date,
} from 'drizzle-orm/pg-core';

// Enums
export const goalTypeEnum = pgEnum('goal_type', [
  'lose_weight',
  'maintain',
  'gain_muscle',
  'general_health',
]);

export const mealTypeEnum = pgEnum('meal_type', [
  'breakfast',
  'lunch',
  'dinner',
  'snack',
]);

export const roleEnum = pgEnum('role', ['user', 'assistant', 'system']);

export const unitsEnum = pgEnum('preferred_units', ['metric', 'imperial']);

export const dataSourceEnum = pgEnum('data_source', [
  'ai_estimate',
  'nutritionix',
  'user_manual',
]);

export const genderEnum = pgEnum('gender', [
  'male',
  'female',
  'other',
  'prefer_not_to_say',
]);

export const activityLevelEnum = pgEnum('activity_level', [
  'sedentary',
  'lightly_active',
  'moderately_active',
  'very_active',
  'extremely_active',
]);

export const onboardingStatusEnum = pgEnum('onboarding_status', [
  'not_started',
  'in_progress',
  'completed',
  'skipped',
]);

export const frequencyEnum = pgEnum('frequency', [
  'never',
  'rarely',
  'sometimes',
  'often',
  'daily',
]);

// Tables
export const users = pgTable(
  'users',
  {
    clerkUserId: varchar('clerk_user_id', { length: 255 }).primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    fullName: varchar('full_name', { length: 255 }),
    profileImageUrl: text('profile_image_url'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index('idx_users_email').on(table.email)]
);

export const userProfiles = pgTable(
  'user_profiles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: varchar('user_id', { length: 255 })
      .notNull()
      .unique()
      .references(() => users.clerkUserId, { onDelete: 'cascade' }),
    goalType: goalTypeEnum('goal_type'),
    targetWeightKg: decimal('target_weight_kg', { precision: 5, scale: 2 }),
    targetWeightLbs: decimal('target_weight_lbs', { precision: 5, scale: 2 }),
    targetDate: date('target_date'),
    dailyCalorieTarget: integer('daily_calorie_target'),
    dailyProteinTargetG: integer('daily_protein_target_g'),
    dailyCarbsTargetG: integer('daily_carbs_target_g'),
    dailyFatTargetG: integer('daily_fat_target_g'),
    preferredUnits: unitsEnum('preferred_units').default('metric'),
    timezone: varchar('timezone', { length: 50 }).default('UTC').notNull(),
    onboardingComplete: boolean('onboarding_complete').default(false),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index('idx_user_profiles_user_id').on(table.userId)]
);

export const onboardingProfiles = pgTable(
  'onboarding_profiles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: varchar('user_id', { length: 255 })
      .notNull()
      .unique()
      .references(() => users.clerkUserId, { onDelete: 'cascade' }),

    // Basic info
    preferredName: varchar('preferred_name', { length: 100 }),
    age: integer('age'),
    gender: genderEnum('gender'),

    // Physical stats
    currentWeightKg: decimal('current_weight_kg', { precision: 5, scale: 2 }),
    currentWeightLbs: decimal('current_weight_lbs', { precision: 5, scale: 2 }),
    heightCm: decimal('height_cm', { precision: 5, scale: 1 }),
    heightFeet: integer('height_feet'),
    heightInches: integer('height_inches'),

    // Fitness history
    activityLevel: activityLevelEnum('activity_level'),
    exerciseFrequency: integer('exercise_frequency'), // days per week
    workoutTypes: text('workout_types'), // JSON array

    // Eating habits
    mealsPerDay: integer('meals_per_day'),
    cookingFrequency: frequencyEnum('cooking_frequency'),
    eatingOutFrequency: frequencyEnum('eating_out_frequency'),

    // Diet preferences
    preferredCuisines: text('preferred_cuisines'), // JSON array
    favoriteFoods: text('favorite_foods'), // JSON array
    dislikedFoods: text('disliked_foods'), // JSON array

    // Dietary restrictions
    allergies: text('allergies'), // JSON array
    intolerances: text('intolerances'), // JSON array
    dietaryRestrictions: text('dietary_restrictions'), // JSON array (vegetarian, vegan, halal, kosher, etc.)

    // Onboarding tracking
    onboardingStatus: onboardingStatusEnum('onboarding_status').default('not_started'),
    onboardingCompletedAt: timestamp('onboarding_completed_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index('idx_onboarding_profiles_user_id').on(table.userId)]
);

export const meals = pgTable(
  'meals',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: varchar('user_id', { length: 255 })
      .notNull()
      .references(() => users.clerkUserId, { onDelete: 'cascade' }),
    mealType: mealTypeEnum('meal_type').notNull(),
    description: text('description').notNull(),
    calories: integer('calories').notNull(),
    proteinG: decimal('protein_g', { precision: 6, scale: 2 }).notNull(),
    carbsG: decimal('carbs_g', { precision: 6, scale: 2 }).notNull(),
    fatG: decimal('fat_g', { precision: 6, scale: 2 }).notNull(),
    notes: text('notes'),
    loggedAt: timestamp('logged_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    dataSource: dataSourceEnum('data_source').default('ai_estimate'),
  },
  (table) => [
    index('idx_meals_user_date').on(table.userId, table.loggedAt),
    index('idx_meals_user_type').on(table.userId, table.mealType),
    index('idx_meals_logged_at').on(table.loggedAt),
  ]
);

export const weightLogs = pgTable(
  'weight_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: varchar('user_id', { length: 255 })
      .notNull()
      .references(() => users.clerkUserId, { onDelete: 'cascade' }),
    weightKg: decimal('weight_kg', { precision: 5, scale: 2 }).notNull(),
    weightLbs: decimal('weight_lbs', { precision: 5, scale: 2 }).notNull(),
    notes: text('notes'),
    loggedAt: timestamp('logged_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('idx_weight_logs_user_date').on(table.userId, table.loggedAt),
    uniqueIndex('idx_weight_logs_unique_timestamp').on(
      table.userId,
      table.loggedAt
    ),
  ]
);

export const conversationHistory = pgTable(
  'conversation_history',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: varchar('user_id', { length: 255 })
      .notNull()
      .references(() => users.clerkUserId, { onDelete: 'cascade' }),
    role: roleEnum('role').notNull(),
    content: text('content').notNull(),
    toolCalls: text('tool_calls'),
    toolResults: text('tool_results'),
    model: varchar('model', { length: 100 }),
    tokensUsed: integer('tokens_used'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('idx_conversation_user_date').on(table.userId, table.createdAt),
  ]
);

export const conversationSummaries = pgTable(
  'conversation_summaries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: varchar('user_id', { length: 255 })
      .notNull()
      .references(() => users.clerkUserId, { onDelete: 'cascade' }),
    summary: text('summary').notNull(),
    messagesFrom: timestamp('messages_from', { withTimezone: true }).notNull(),
    messagesTo: timestamp('messages_to', { withTimezone: true }).notNull(),
    messageCount: integer('message_count').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('idx_conversation_summaries_user').on(table.userId),
    index('idx_conversation_summaries_user_date').on(table.userId, table.messagesTo),
  ]
);

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserProfile = typeof userProfiles.$inferSelect;
export type NewUserProfile = typeof userProfiles.$inferInsert;
export type OnboardingProfile = typeof onboardingProfiles.$inferSelect;
export type NewOnboardingProfile = typeof onboardingProfiles.$inferInsert;
export type Meal = typeof meals.$inferSelect;
export type NewMeal = typeof meals.$inferInsert;
export type WeightLog = typeof weightLogs.$inferSelect;
export type NewWeightLog = typeof weightLogs.$inferInsert;
export type ConversationMessage = typeof conversationHistory.$inferSelect;
export type NewConversationMessage = typeof conversationHistory.$inferInsert;
export type ConversationSummary = typeof conversationSummaries.$inferSelect;
export type NewConversationSummary = typeof conversationSummaries.$inferInsert;

// Enum constants for type-safe usage
export const MealType = {
  BREAKFAST: 'breakfast',
  LUNCH: 'lunch',
  DINNER: 'dinner',
  SNACK: 'snack',
} as const;

export const GoalType = {
  LOSE_WEIGHT: 'lose_weight',
  MAINTAIN: 'maintain',
  GAIN_MUSCLE: 'gain_muscle',
  GENERAL_HEALTH: 'general_health',
} as const;

export const PreferredUnits = {
  METRIC: 'metric',
  IMPERIAL: 'imperial',
} as const;

export const Role = {
  USER: 'user',
  ASSISTANT: 'assistant',
  SYSTEM: 'system',
} as const;

export const DataSource = {
  AI_ESTIMATE: 'ai_estimate',
  NUTRITIONIX: 'nutritionix',
  USER_MANUAL: 'user_manual',
} as const;

export const Gender = {
  MALE: 'male',
  FEMALE: 'female',
  OTHER: 'other',
  PREFER_NOT_TO_SAY: 'prefer_not_to_say',
} as const;

export const ActivityLevel = {
  SEDENTARY: 'sedentary',
  LIGHTLY_ACTIVE: 'lightly_active',
  MODERATELY_ACTIVE: 'moderately_active',
  VERY_ACTIVE: 'very_active',
  EXTREMELY_ACTIVE: 'extremely_active',
} as const;

export const OnboardingStatus = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  SKIPPED: 'skipped',
} as const;

export const Frequency = {
  NEVER: 'never',
  RARELY: 'rarely',
  SOMETIMES: 'sometimes',
  OFTEN: 'often',
  DAILY: 'daily',
} as const;
