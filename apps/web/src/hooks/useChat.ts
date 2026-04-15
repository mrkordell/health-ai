import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { sendChatMessageStream, getChatHistory, clearChatHistory, getOnboardingStatus, ApiError } from '../lib/api';
import type { Message, Action, ActionStatus } from '../components/Chat';

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content: "Hi! I'm Vita, your health coach. I can help you log meals, track your weight, and provide nutrition guidance. What would you like to do today?",
};

const ONBOARDING_WELCOME: Message = {
  id: 'onboarding-welcome',
  role: 'assistant',
  content: "Hey there! I'm Vita, and I'm excited to be your health coach. Before we dive in, I'd love to learn a bit about you so I can give you personalized guidance. This will just take a few minutes - think of it like our first consultation. Ready to get started?",
};

// Map tool names to user-friendly labels
const TOOL_LABELS: Record<string, string> = {
  log_meal: 'Logging your meal',
  log_weight: 'Logging your weight',
  lookup_nutrition: 'Looking up nutritional info',
  get_nutrition_info: 'Looking up nutritional info',
  calculate_calories: 'Calculating calories',
  get_meal_history: 'Checking meal history',
  get_weight_history: 'Checking weight history',
  get_today_summary: 'Getting today\'s summary',
  get_weekly_progress: 'Checking weekly progress',
  update_goals: 'Updating your goals',
  suggest_meal: 'Suggesting a meal',
  save_onboarding_data: 'Saving your profile',
  complete_onboarding: 'Completing setup',
};

function getToolLabel(toolName: string): string {
  return TOOL_LABELS[toolName] || `Processing ${toolName.replace(/_/g, ' ')}`;
}

export function useChat() {
  const { getToken } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeActions, setActiveActions] = useState<Action[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load chat history on mount
  useEffect(() => {
    async function loadHistory() {
      try {
        const token = await getToken();
        if (!token) {
          setMessages([WELCOME_MESSAGE]);
          setIsLoadingHistory(false);
          return;
        }

        // Check onboarding status first
        const onboardingStatus = await getOnboardingStatus(token);
        setIsOnboarding(onboardingStatus.needsOnboarding);

        const response = await getChatHistory(token);

        if (response.messages.length === 0) {
          // Show appropriate welcome based on onboarding status
          setMessages([
            onboardingStatus.needsOnboarding ? ONBOARDING_WELCOME : WELCOME_MESSAGE
          ]);
        } else {
          setMessages(
            response.messages.map((msg) => ({
              id: msg.id,
              role: msg.role,
              content: msg.content,
              createdAt: msg.createdAt,
            }))
          );
        }
      } catch {
        setMessages([WELCOME_MESSAGE]);
      } finally {
        setIsLoadingHistory(false);
      }
    }

    loadHistory();
  }, [getToken]);

  const sendMessage = useCallback(async (content: string) => {
    setError(null);

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      await sendChatMessageStream(content, token, {
        onToolStart: (id, name) => {
          setActiveActions((prev) => [
            ...prev,
            { id, label: getToolLabel(name), status: 'in_progress' as ActionStatus },
          ]);
        },
        onToolEnd: (id, _name, success) => {
          setActiveActions((prev) =>
            prev.map((a) =>
              a.id === id
                ? { ...a, status: (success ? 'completed' : 'error') as ActionStatus }
                : a
            )
          );
        },
        onMessage: async (messageContent) => {
          const assistantMessage: Message = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: messageContent,
          };
          setMessages((prev) => [...prev, assistantMessage]);

          // Check if onboarding was just completed
          if (isOnboarding) {
            const onboardingToken = await getToken();
            if (onboardingToken) {
              const onboardingStatus = await getOnboardingStatus(onboardingToken);
              if (!onboardingStatus.needsOnboarding) {
                setIsOnboarding(false);
              }
            }
          }
        },
        onError: (code, message) => {
          const errorMessage = code === 'rate_limited'
            ? message
            : 'Failed to send message. Please try again.';

          setError(errorMessage);

          const errorResponse: Message = {
            id: `error-${Date.now()}`,
            role: 'assistant',
            content: "I'm sorry, I couldn't process that request. Please try again.",
          };

          setMessages((prev) => [...prev, errorResponse]);
        },
        onDone: () => {
          setIsLoading(false);
        },
      });
    } catch (err) {
      console.error('[useChat] Error caught:', err);

      const errorMessage = err instanceof ApiError
        ? err.message
        : 'Failed to send message. Please try again.';

      setError(errorMessage);

      const errorResponse: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: "I'm sorry, I couldn't process that request. Please try again.",
      };

      setMessages((prev) => [...prev, errorResponse]);
      setIsLoading(false);
    }
  }, [getToken, isOnboarding]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleActionExited = useCallback((id: string) => {
    setActiveActions((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const clearHistory = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;

      await clearChatHistory(token);

      // Re-check onboarding status after clearing
      const onboardingStatus = await getOnboardingStatus(token);
      setIsOnboarding(onboardingStatus.needsOnboarding);
      setMessages([
        onboardingStatus.needsOnboarding ? ONBOARDING_WELCOME : WELCOME_MESSAGE
      ]);
    } catch {
      setError('Failed to clear history');
    }
  }, [getToken]);

  return {
    messages,
    activeActions,
    isLoading,
    isLoadingHistory,
    isOnboarding,
    error,
    sendMessage,
    clearError,
    clearHistory,
    handleActionExited,
  };
}
