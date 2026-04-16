import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { db, meals, weightLogs, userProfiles, onboardingProfiles, conversationHistory, getTodayRange, getLastNDaysRange } from '../db';
import type { UserProfile, OnboardingProfile } from '../db/schema';
import { getConversationSummaries } from './summarization';

export interface UserContext {
  userId: string;
  profile: UserProfile | null;
}

export interface OnboardingStatus {
  needsOnboarding: boolean;
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped';
  completedAt: string | null;
}

interface TodayState {
  mealsLogged: Array<{ mealType: string; description: string; calories: number }>;
  totalCalories: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
  remainingCalories: number | null;
  remainingProteinG: number | null;
  remainingCarbsG: number | null;
  remainingFatG: number | null;
}

interface WeekState {
  daysTracked: number;
  averageCalories: number;
  lastWeightLbs: number | null;
  weightTrendLbs: number | null;
}

interface CurrentState {
  currentTime: string;
  currentDate: string;
  currentDateTime: string;
  dayOfWeek: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  today: TodayState;
  week: WeekState;
}

interface ConversationTiming {
  currentDate: string;
  currentDateTime: string;
  lastMessageAt: string | null;
  timeSinceLastMessage: string;
  returnContext: 'first_chat' | 'same_day' | 'recent_return' | 'multi_day_return' | 'weekly_return';
}

function getTimeOfDay(hour: number): 'morning' | 'afternoon' | 'evening' | 'night' {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

// Fetch onboarding profile for a user
export async function getOnboardingProfile(userId: string): Promise<OnboardingProfile | null> {
  const [onboarding] = await db
    .select()
    .from(onboardingProfiles)
    .where(eq(onboardingProfiles.userId, userId));

  return onboarding ?? null;
}

// Check if user needs onboarding
export function isOnboardingRequired(
  profile: UserProfile | null,
  onboardingProfile: OnboardingProfile | null
): boolean {
  // Already completed or skipped onboarding
  if (onboardingProfile?.onboardingStatus === 'completed' ||
      onboardingProfile?.onboardingStatus === 'skipped') {
    return false;
  }

  // Explicitly marked as complete in user profile
  if (profile?.onboardingComplete) {
    return false;
  }

  // Check if we have minimum required data (calorie target means they've set up basics)
  if (profile?.dailyCalorieTarget && profile?.goalType) {
    return false;
  }

  // No profile or missing key data = needs onboarding
  return true;
}

// Get onboarding status for API
export async function getOnboardingStatus(userId: string): Promise<OnboardingStatus> {
  const [profile] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId));

  const onboardingProfile = await getOnboardingProfile(userId);

  const needsOnboarding = isOnboardingRequired(profile ?? null, onboardingProfile);

  return {
    needsOnboarding,
    status: onboardingProfile?.onboardingStatus ?? 'not_started',
    completedAt: onboardingProfile?.onboardingCompletedAt?.toISOString() ?? null,
  };
}

async function fetchTodayState(userId: string, profile: UserProfile | null): Promise<TodayState> {
  const timezone = profile?.timezone ?? 'America/New_York';
  const { start, end } = getTodayRange(timezone);

  const todayMeals = await db
    .select()
    .from(meals)
    .where(
      and(
        eq(meals.userId, userId),
        gte(meals.loggedAt, start),
        lte(meals.loggedAt, end)
      )
    );

  const totalCalories = todayMeals.reduce((sum, m) => sum + m.calories, 0);
  const totalProteinG = todayMeals.reduce((sum, m) => sum + parseFloat(m.proteinG), 0);
  const totalCarbsG = todayMeals.reduce((sum, m) => sum + parseFloat(m.carbsG), 0);
  const totalFatG = todayMeals.reduce((sum, m) => sum + parseFloat(m.fatG), 0);

  return {
    mealsLogged: todayMeals.map((m) => ({
      mealType: m.mealType,
      description: m.description,
      calories: m.calories,
    })),
    totalCalories,
    totalProteinG: Math.round(totalProteinG * 10) / 10,
    totalCarbsG: Math.round(totalCarbsG * 10) / 10,
    totalFatG: Math.round(totalFatG * 10) / 10,
    remainingCalories: profile?.dailyCalorieTarget
      ? profile.dailyCalorieTarget - totalCalories
      : null,
    remainingProteinG: profile?.dailyProteinTargetG
      ? Math.round((profile.dailyProteinTargetG - totalProteinG) * 10) / 10
      : null,
    remainingCarbsG: profile?.dailyCarbsTargetG
      ? Math.round((profile.dailyCarbsTargetG - totalCarbsG) * 10) / 10
      : null,
    remainingFatG: profile?.dailyFatTargetG
      ? Math.round((profile.dailyFatTargetG - totalFatG) * 10) / 10
      : null,
  };
}

async function fetchWeekState(userId: string, profile: UserProfile | null): Promise<WeekState> {
  const timezone = profile?.timezone ?? 'America/New_York';
  const { start, end } = getLastNDaysRange(7, timezone);

  // Get meals for the week
  const weekMeals = await db
    .select()
    .from(meals)
    .where(
      and(
        eq(meals.userId, userId),
        gte(meals.loggedAt, start),
        lte(meals.loggedAt, end)
      )
    );

  // Group by day to count days tracked
  const daysWithMeals = new Set(
    weekMeals.map((m) => m.loggedAt.toISOString().split('T')[0])
  );

  const totalCalories = weekMeals.reduce((sum, m) => sum + m.calories, 0);
  const daysTracked = daysWithMeals.size;

  // Get recent weight entries
  const recentWeights = await db
    .select()
    .from(weightLogs)
    .where(eq(weightLogs.userId, userId))
    .orderBy(desc(weightLogs.loggedAt))
    .limit(7);

  let lastWeightLbs: number | null = null;
  let weightTrendLbs: number | null = null;

  if (recentWeights.length > 0) {
    lastWeightLbs = parseFloat(recentWeights[0]!.weightLbs);

    if (recentWeights.length >= 2) {
      const oldest = parseFloat(recentWeights[recentWeights.length - 1]!.weightLbs);
      weightTrendLbs = Math.round((lastWeightLbs - oldest) * 10) / 10;
    }
  }

  return {
    daysTracked,
    averageCalories: daysTracked > 0 ? Math.round(totalCalories / daysTracked) : 0,
    lastWeightLbs,
    weightTrendLbs,
  };
}

function buildUserContextXml(profile: UserProfile | null): string {
  if (!profile) {
    return '<no-profile>User has not set up their profile yet. Help them set goals.</no-profile>';
  }

  const goalDescriptions: Record<string, string> = {
    lose_weight: 'lose weight',
    maintain: 'maintain current weight',
    gain_muscle: 'build muscle',
    general_health: 'improve overall health',
  };

  const parts: string[] = [];

  if (profile.goalType) {
    parts.push(`<goal>${goalDescriptions[profile.goalType]}</goal>`);
  }

  if (profile.dailyCalorieTarget) {
    parts.push(`<calorie-target>${profile.dailyCalorieTarget} calories/day</calorie-target>`);
  }

  if (profile.dailyProteinTargetG || profile.dailyCarbsTargetG || profile.dailyFatTargetG) {
    parts.push(`<macro-targets>
      <protein>${profile.dailyProteinTargetG ?? '?'}g</protein>
      <carbs>${profile.dailyCarbsTargetG ?? '?'}g</carbs>
      <fat>${profile.dailyFatTargetG ?? '?'}g</fat>
    </macro-targets>`);
  }

  if (profile.targetWeightLbs) {
    parts.push(`<target-weight>${profile.targetWeightLbs} lbs</target-weight>`);
  }

  if (profile.targetDate) {
    parts.push(`<target-date>${profile.targetDate}</target-date>`);
  }

  return parts.join('\n    ');
}

function formatRemaining(value: number | null, unit: string): string {
  if (value === null) return 'no target set';
  if (value < 0) return `${Math.abs(value)}${unit} OVER target`;
  return `${value}${unit}`;
}

function buildCurrentStateXml(state: CurrentState): string {
  const todayMealsXml = state.today.mealsLogged.length > 0
    ? state.today.mealsLogged
        .map((m) => `<meal type="${m.mealType}">${m.description} (${m.calories} cal)</meal>`)
        .join('\n        ')
    : '<no-meals>No meals logged yet today</no-meals>';

  return `<time>
      <date>${state.currentDate}</date>
      <current>${state.currentTime}</current>
      <current-datetime>${state.currentDateTime}</current-datetime>
      <day>${state.dayOfWeek}</day>
      <period>${state.timeOfDay}</period>
    </time>
    <today>
      <meals-logged>
        ${todayMealsXml}
      </meals-logged>
      <totals>
        <calories>${state.today.totalCalories}</calories>
        <protein>${state.today.totalProteinG}g</protein>
        <carbs>${state.today.totalCarbsG}g</carbs>
        <fat>${state.today.totalFatG}g</fat>
      </totals>
      <remaining note="negative values mean user is OVER target — frame as recovery, not headroom">
        <calories>${formatRemaining(state.today.remainingCalories, '')}</calories>
        <protein>${formatRemaining(state.today.remainingProteinG, 'g')}</protein>
        <carbs>${formatRemaining(state.today.remainingCarbsG, 'g')}</carbs>
        <fat>${formatRemaining(state.today.remainingFatG, 'g')}</fat>
      </remaining>
    </today>
    <week>
      <days-tracked>${state.week.daysTracked}/7</days-tracked>
      <avg-calories>${state.week.averageCalories}</avg-calories>
      <last-weight>${state.week.lastWeightLbs ? `${state.week.lastWeightLbs} lbs` : 'not logged'}</last-weight>
      <weight-trend>${state.week.weightTrendLbs !== null ? `${state.week.weightTrendLbs > 0 ? '+' : ''}${state.week.weightTrendLbs} lbs` : 'insufficient data'}</weight-trend>
    </week>`;
}

function formatRelativeDuration(ms: number): string {
  const minutes = Math.floor(ms / (1000 * 60));

  if (minutes < 1) return 'less than 1 minute';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'}`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'}`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'}`;

  const weeks = Math.floor(days / 7);
  return `${weeks} week${weeks === 1 ? '' : 's'}`;
}

async function fetchConversationTiming(
  userId: string,
  timezone: string,
  now: Date
): Promise<ConversationTiming> {
  const formatterOptions: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };

  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const dateTimeFormatter = new Intl.DateTimeFormat('en-US', formatterOptions);

  const [lastMessage] = await db
    .select({
      createdAt: conversationHistory.createdAt,
    })
    .from(conversationHistory)
    .where(eq(conversationHistory.userId, userId))
    .orderBy(desc(conversationHistory.createdAt))
    .limit(1);

  if (!lastMessage) {
    return {
      currentDate: dateFormatter.format(now),
      currentDateTime: dateTimeFormatter.format(now),
      lastMessageAt: null,
      timeSinceLastMessage: 'first conversation',
      returnContext: 'first_chat',
    };
  }

  const elapsedMs = now.getTime() - lastMessage.createdAt.getTime();
  const elapsedHours = elapsedMs / (1000 * 60 * 60);
  const elapsedDays = elapsedHours / 24;

  let returnContext: ConversationTiming['returnContext'] = 'same_day';

  if (elapsedDays >= 7) {
    returnContext = 'weekly_return';
  } else if (elapsedDays >= 2) {
    returnContext = 'multi_day_return';
  } else if (elapsedHours >= 24) {
    returnContext = 'recent_return';
  }

  return {
    currentDate: dateFormatter.format(now),
    currentDateTime: dateTimeFormatter.format(now),
    lastMessageAt: dateTimeFormatter.format(lastMessage.createdAt),
    timeSinceLastMessage: formatRelativeDuration(elapsedMs),
    returnContext,
  };
}

function buildConversationTimingXml(timing: ConversationTiming): string {
  return `<conversation-timing>
      <current-date>${timing.currentDate}</current-date>
      <current-datetime>${timing.currentDateTime}</current-datetime>
      <last-message-at>${timing.lastMessageAt ?? 'no prior messages'}</last-message-at>
      <time-since-last-message>${timing.timeSinceLastMessage}</time-since-last-message>
      <return-context>${timing.returnContext}</return-context>
    </conversation-timing>`;
}

function buildCollectedDataXml(onboardingProfile: OnboardingProfile | null, latestWeightLbs?: number | null): string {
  if (!onboardingProfile) {
    return '<no-data>No data collected yet. This is a brand new user.</no-data>';
  }

  const parts: string[] = [];

  // Basic info
  if (onboardingProfile.preferredName) {
    parts.push(`<preferred-name>${onboardingProfile.preferredName}</preferred-name>`);
  }
  if (onboardingProfile.age) {
    parts.push(`<age>${onboardingProfile.age}</age>`);
  }
  if (onboardingProfile.gender) {
    parts.push(`<gender>${onboardingProfile.gender}</gender>`);
  }

  // Physical stats
  if (onboardingProfile.currentWeightLbs) {
    const weightToShow = latestWeightLbs ?? onboardingProfile.currentWeightLbs;
    parts.push(`<current-weight>${weightToShow} lbs</current-weight>`);
  }
  if (onboardingProfile.heightFeet || onboardingProfile.heightInches) {
    const feet = onboardingProfile.heightFeet ?? 0;
    const inches = onboardingProfile.heightInches ?? 0;
    parts.push(`<height>${feet}'${inches}"</height>`);
  }

  // Fitness
  if (onboardingProfile.activityLevel) {
    parts.push(`<activity-level>${onboardingProfile.activityLevel.replace('_', ' ')}</activity-level>`);
  }
  if (onboardingProfile.exerciseFrequency !== null) {
    parts.push(`<exercise-frequency>${onboardingProfile.exerciseFrequency} days/week</exercise-frequency>`);
  }
  if (onboardingProfile.workoutTypes) {
    try {
      const types = JSON.parse(onboardingProfile.workoutTypes);
      if (types.length > 0) {
        parts.push(`<workout-types>${types.join(', ')}</workout-types>`);
      }
    } catch { /* ignore parse errors */ }
  }

  // Eating habits
  if (onboardingProfile.mealsPerDay !== null) {
    parts.push(`<meals-per-day>${onboardingProfile.mealsPerDay}</meals-per-day>`);
  }
  if (onboardingProfile.cookingFrequency) {
    parts.push(`<cooking-frequency>${onboardingProfile.cookingFrequency}</cooking-frequency>`);
  }
  if (onboardingProfile.eatingOutFrequency) {
    parts.push(`<eating-out-frequency>${onboardingProfile.eatingOutFrequency}</eating-out-frequency>`);
  }

  // Diet preferences
  if (onboardingProfile.preferredCuisines) {
    try {
      const cuisines = JSON.parse(onboardingProfile.preferredCuisines);
      if (cuisines.length > 0) {
        parts.push(`<preferred-cuisines>${cuisines.join(', ')}</preferred-cuisines>`);
      }
    } catch { /* ignore parse errors */ }
  }
  if (onboardingProfile.favoriteFoods) {
    try {
      const foods = JSON.parse(onboardingProfile.favoriteFoods);
      if (foods.length > 0) {
        parts.push(`<favorite-foods>${foods.join(', ')}</favorite-foods>`);
      }
    } catch { /* ignore parse errors */ }
  }
  if (onboardingProfile.dislikedFoods) {
    try {
      const foods = JSON.parse(onboardingProfile.dislikedFoods);
      if (foods.length > 0) {
        parts.push(`<disliked-foods>${foods.join(', ')}</disliked-foods>`);
      }
    } catch { /* ignore parse errors */ }
  }

  // Dietary restrictions
  if (onboardingProfile.allergies) {
    try {
      const allergies = JSON.parse(onboardingProfile.allergies);
      if (allergies.length > 0) {
        parts.push(`<allergies>${allergies.join(', ')}</allergies>`);
      }
    } catch { /* ignore parse errors */ }
  }
  if (onboardingProfile.intolerances) {
    try {
      const intolerances = JSON.parse(onboardingProfile.intolerances);
      if (intolerances.length > 0) {
        parts.push(`<intolerances>${intolerances.join(', ')}</intolerances>`);
      }
    } catch { /* ignore parse errors */ }
  }
  if (onboardingProfile.dietaryRestrictions) {
    try {
      const restrictions = JSON.parse(onboardingProfile.dietaryRestrictions);
      if (restrictions.length > 0) {
        parts.push(`<dietary-restrictions>${restrictions.join(', ')}</dietary-restrictions>`);
      }
    } catch { /* ignore parse errors */ }
  }

  if (parts.length === 0) {
    return '<no-data>No data collected yet. This is a brand new user.</no-data>';
  }

  return parts.join('\n    ');
}

let cachedPromptTemplate: string | null = null;
let cachedOnboardingTemplate: string | null = null;

function loadPromptTemplate(): string {
  if (cachedPromptTemplate) {
    return cachedPromptTemplate;
  }

  const promptPath = join(import.meta.dirname, 'prompts', 'vita-coach.xml');
  cachedPromptTemplate = readFileSync(promptPath, 'utf-8');
  return cachedPromptTemplate;
}

function loadOnboardingTemplate(): string {
  if (cachedOnboardingTemplate) {
    return cachedOnboardingTemplate;
  }

  const promptPath = join(import.meta.dirname, 'prompts', 'vita-onboarding.xml');
  cachedOnboardingTemplate = readFileSync(promptPath, 'utf-8');
  return cachedOnboardingTemplate;
}

async function buildOnboardingPrompt(
  _userId: string,
  onboardingProfile: OnboardingProfile | null
): Promise<string> {
  const template = loadOnboardingTemplate();
  const collectedDataXml = buildCollectedDataXml(onboardingProfile);

  return template.replace('{{COLLECTED_DATA}}', collectedDataXml);
}

async function buildRegularPrompt(
  userId: string,
  profile: UserProfile | null,
  onboardingProfile: OnboardingProfile | null
): Promise<string> {
  const now = new Date();
  const timezone = profile?.timezone ?? 'America/New_York';

  console.log(`[buildRegularPrompt] Building prompt for user ${userId}`);
  console.log(`[buildRegularPrompt] Profile timezone: ${profile?.timezone ?? 'NOT SET'}`);
  console.log(`[buildRegularPrompt] Using timezone: ${timezone}`);
  console.log(`[buildRegularPrompt] Server time (UTC): ${now.toISOString()}`);

  const timeFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const dayFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'long',
  });

  const hourFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    hour12: false,
  });

  const currentHour = parseInt(hourFormatter.format(now), 10);

  const [todayState, weekState, conversationTiming, summaries] = await Promise.all([
    fetchTodayState(userId, profile),
    fetchWeekState(userId, profile),
    fetchConversationTiming(userId, timezone, now),
    getConversationSummaries(userId),
  ]);

  const currentState: CurrentState = {
    currentTime: timeFormatter.format(now),
    currentDate: conversationTiming.currentDate,
    currentDateTime: conversationTiming.currentDateTime,
    dayOfWeek: dayFormatter.format(now),
    timeOfDay: getTimeOfDay(currentHour),
    today: todayState,
    week: weekState,
  };

  console.log(`[buildRegularPrompt] Formatted time: ${currentState.currentTime}`);
  console.log(`[buildRegularPrompt] Time of day: ${currentState.timeOfDay}`);
  console.log(`[buildRegularPrompt] Current hour (24h): ${currentHour}`);

  const template = loadPromptTemplate();
  const userContextXml = buildUserContextXml(profile);
  const personalStatsXml = buildCollectedDataXml(onboardingProfile, weekState.lastWeightLbs);
  const currentStateXml = buildCurrentStateXml(currentState);
  const conversationTimingXml = buildConversationTimingXml(conversationTiming);
  const onboardingSignalXml = buildJustCompletedOnboardingXml(onboardingProfile, now);
  const historySummaryXml = buildHistorySummaryXml(summaries);

  return template
    .replace('{{USER_CONTEXT}}', userContextXml)
    .replace('{{PERSONAL_STATS}}', personalStatsXml)
    .replace('{{CURRENT_STATE}}', currentStateXml)
    .replace('{{CONVERSATION_TIMING}}', conversationTimingXml)
    .replace('{{HISTORY_SUMMARY}}', historySummaryXml)
    .replace('{{ONBOARDING_SIGNAL}}', onboardingSignalXml);
}

function buildHistorySummaryXml(
  summaries: Array<{ summary: string; messagesFrom: Date; messagesTo: Date; messageCount: number }>
): string {
  if (summaries.length === 0) {
    return '<no-summary>No prior conversation history summarized yet.</no-summary>';
  }

  return summaries
    .map((s) => {
      const from = s.messagesFrom.toISOString().split('T')[0];
      const to = s.messagesTo.toISOString().split('T')[0];
      return `<period from="${from}" to="${to}" messages="${s.messageCount}">${s.summary}</period>`;
    })
    .join('\n    ');
}

function buildJustCompletedOnboardingXml(
  onboardingProfile: OnboardingProfile | null,
  now: Date
): string {
  if (!onboardingProfile?.onboardingCompletedAt) {
    return '<just-completed-onboarding>false</just-completed-onboarding>';
  }
  const elapsedMs = now.getTime() - onboardingProfile.onboardingCompletedAt.getTime();
  const justFinished = elapsedMs >= 0 && elapsedMs < 5 * 60 * 1000; // 5 min window
  return `<just-completed-onboarding>${justFinished}</just-completed-onboarding>`;
}

export async function buildSystemPrompt(context: UserContext): Promise<string> {
  const { userId, profile } = context;

  // Fetch onboarding profile to determine mode
  const onboardingProfile = await getOnboardingProfile(userId);

  // Check if we should be in onboarding mode
  const needsOnboarding = isOnboardingRequired(profile, onboardingProfile);

  if (needsOnboarding) {
    console.log(`[buildSystemPrompt] User ${userId} needs onboarding`);
    return buildOnboardingPrompt(userId, onboardingProfile);
  }

  // Regular coaching mode
  return buildRegularPrompt(userId, profile, onboardingProfile);
}
