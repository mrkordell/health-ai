import type { ToolHandler, LookupNutritionArgs, LookupNutritionResult } from '../types';

export const lookupNutritionHandler: ToolHandler<LookupNutritionArgs, LookupNutritionResult> = async (
  args,
  _userId
) => {
  const { query } = args;

  if (!query || typeof query !== 'string') {
    throw new Error('Missing required parameter: query');
  }

  console.log(`[lookup_nutrition] Estimating nutrition for: "${query}"`);

  // Return instruction for AI to estimate nutrition values
  // The AI will use its training knowledge to provide reasonable estimates
  return {
    query,
    source: 'ai_estimate',
    instruction: `Estimate the nutrition for "${query}". Based on your knowledge of typical nutrition values, provide your best estimate for calories, protein (g), carbs (g), and fat (g). Be conservative with estimates - it's better to slightly overestimate calories. After estimating, proceed to log the meal with your estimated values. Mention to the user that these are AI estimates.`,
  };
};
