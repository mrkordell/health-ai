import type { ToolCall } from '../lib/ai-client';
import type { ToolName } from '../lib/tool-definitions';
import type { ToolRegistry, ToolExecutionResult, ToolHandler } from './types';
import {
  lookupNutritionHandler,
  logMealHandler,
  updateMealHandler,
  deleteMealHandler,
  logWeightHandler,
  updateWeightHandler,
  deleteWeightHandler,
  getTodaySummaryHandler,
  getWeightHistoryHandler,
  updateGoalsHandler,
  suggestMealHandler,
  getWeeklyProgressHandler,
  saveOnboardingDataHandler,
  completeOnboardingHandler,
  searchMealsHandler,
  searchConversationsHandler,
} from './handlers';

const toolRegistry: ToolRegistry = {
  estimate_nutrition: lookupNutritionHandler,
  log_meal: logMealHandler,
  update_meal: updateMealHandler,
  delete_meal: deleteMealHandler,
  log_weight: logWeightHandler,
  update_weight: updateWeightHandler,
  delete_weight: deleteWeightHandler,
  get_today_summary: getTodaySummaryHandler,
  get_weight_history: getWeightHistoryHandler,
  update_goals: updateGoalsHandler,
  suggest_meal: suggestMealHandler,
  get_weekly_progress: getWeeklyProgressHandler,
  save_onboarding_data: saveOnboardingDataHandler,
  complete_onboarding: completeOnboardingHandler,
  search_meals: searchMealsHandler,
  search_conversations: searchConversationsHandler,
};

export function registerTool(name: ToolName, handler: ToolHandler): void {
  toolRegistry[name] = handler;
}

export function getToolHandler(name: ToolName): ToolHandler | undefined {
  return toolRegistry[name];
}

export async function executeToolCall(
  toolCall: ToolCall,
  userId: string
): Promise<ToolExecutionResult> {
  const toolName = toolCall.name as ToolName;
  const handler = toolRegistry[toolName];

  if (!handler) {
    console.error(`[executeToolCall] Unknown tool: ${toolCall.name}`);
    return {
      success: false,
      result: null,
      error: `Unknown tool: ${toolCall.name}`,
    };
  }

  try {
    console.log(`[executeToolCall] Executing ${toolCall.name} for user ${userId}`);
    const result = await handler(toolCall.arguments, userId);
    console.log(`[executeToolCall] ${toolCall.name} completed successfully`);
    return {
      success: true,
      result,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[executeToolCall] ${toolCall.name} failed:`, errorMessage);
    return {
      success: false,
      result: null,
      error: errorMessage,
    };
  }
}

// Re-export types
export type {
  ToolHandler,
  ToolRegistry,
  ToolExecutionResult,
  LookupNutritionArgs,
  LookupNutritionResult,
  LogMealArgs,
  LogMealResult,
  UpdateMealArgs,
  UpdateMealResult,
  DeleteMealArgs,
  DeleteMealResult,
  LogWeightArgs,
  LogWeightResult,
  UpdateWeightArgs,
  UpdateWeightResult,
  DeleteWeightArgs,
  DeleteWeightResult,
  GetTodaySummaryArgs,
  GetTodaySummaryResult,
  GetWeightHistoryArgs,
  GetWeightHistoryResult,
  UpdateGoalsArgs,
  UpdateGoalsResult,
  SuggestMealArgs,
  SuggestMealResult,
  GetWeeklyProgressArgs,
  GetWeeklyProgressResult,
  SaveOnboardingDataArgs,
  SaveOnboardingDataResult,
  CompleteOnboardingArgs,
  CompleteOnboardingResult,
  SearchMealsArgs,
  SearchMealsResult,
  SearchConversationsArgs,
  SearchConversationsResult,
} from './types';
