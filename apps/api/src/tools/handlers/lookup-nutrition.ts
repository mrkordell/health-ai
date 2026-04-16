import type { ToolHandler, LookupNutritionArgs, LookupNutritionResult } from '../types';

export const lookupNutritionHandler: ToolHandler<LookupNutritionArgs, LookupNutritionResult> = async (
  args,
  _userId
) => {
  const { query } = args;

  if (!query || typeof query !== 'string') {
    throw new Error('Missing required parameter: query');
  }

  console.log(`[estimate_nutrition] Estimating nutrition for: "${query}"`);

  // Return instruction for AI to estimate nutrition values
  // The AI will use its training knowledge to provide reasonable estimates
  return {
    query,
    source: 'ai_estimate',
    instruction: `Use your nutritional knowledge to provide reasonable values for "${query}". Provide calories, protein (g), carbs (g), and fat (g). Be conservative — slightly overestimate calories rather than underestimate. After estimating, proceed to log the meal with your values.`,
  };
};
