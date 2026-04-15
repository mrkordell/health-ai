# Health AI - Conversational Fitness Coach

## Overview
A conversational AI health companion that acts as a smart personal trainer. Users chat naturally with an AI that can track calories, log meals, monitor weight, suggest recipes based on ingredients/goals, and provide coaching based on progress.

## Tech Stack
- **Frontend**: React + Vite + TypeScript (Mobile-first PWA)
- **Backend**: Bun + Fastify (deploy anywhere)
- **Database**: PostgreSQL (Neon, Railway, or any host) + Drizzle ORM
- **Auth**: Clerk (managed auth with OAuth, sessions)
- **AI**: OpenRouter TypeScript SDK (@openrouter/sdk) with tool calling
- **Styling**: Tailwind CSS
- **Voice**: Web Speech API for voice input

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend (PWA)                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │ Chat UI     │  │ Voice Input │  │ Quick Actions   │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
│                        │                                 │
│                   Clerk Auth                             │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│              Bun + Fastify API Server                    │
│  ┌─────────────────────────────────────────────────┐    │
│  │  POST /api/chat - Orchestration (<200 lines)     │    │
│  │    ├── lib/ai-client.ts (OpenRouter SDK client)   │    │
│  │    ├── lib/schemas.ts (Zod validation)           │    │
│  │    ├── tools/ (nutrition, meals, weight, etc.)   │    │
│  │    └── services/ (business logic)                │    │
│  │                                                   │    │
│  │  Clerk middleware for auth verification          │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│              PostgreSQL (any host) + Drizzle ORM         │
│  ┌──────────┐ ┌───────────────┐ ┌──────────┐           │
│  │ users    │ │ user_profiles │ │ meals    │           │
│  └──────────┘ └───────────────┘ └──────────┘           │
│  ┌──────────────┐ ┌─────────────────────────────┐      │
│  │ weight_logs  │ │ conversation_history        │      │
│  └──────────────┘ └─────────────────────────────┘      │
└─────────────────────────────────────────────────────────┘
```

## Mobile UI Layout

```
┌─────────────────────────────────┐
│  [Collapsible DailySummary]     │  ← Sticky header, tap to expand
│  "1,240 / 1,800 cal | 3 meals"  │
├─────────────────────────────────┤
│                                 │
│  [Coach Avatar] Hey! How's it   │  ← CoachMessage (left, gray bg)
│                 going today?    │
│                                 │
│         Had eggs for breakfast  │  ← UserMessage (right, emerald bg)
│                                 │
│  [Coach Avatar] Got it! I       │
│  logged 2 scrambled eggs -      │
│  140 cal, 12g protein.          │
│                                 │
│  [●●●]                          │  ← TypingIndicator
│                                 │
├─────────────────────────────────┤
│  [Log Meal] [Weigh In] [Ideas]  │  ← QuickActions (pill buttons)
├─────────────────────────────────┤
│  [Text input...        ] [🎤]   │  ← ChatInput + VoiceButton
├─────────────────────────────────┤
│   Chat    Progress    Profile   │  ← BottomNav (minimal)
└─────────────────────────────────┘
```

## Design Tokens

```typescript
// src/lib/tokens.ts
export const colors = {
  // Primary - Emerald (health, growth)
  brand: '#10B981',
  brandDark: '#059669',

  // Accent - Indigo (CTAs, voice active)
  accent: '#6366F1',
  accentLight: '#818CF8',

  // Neutrals
  background: '#FAFAFA',
  surface: '#FFFFFF',
  border: '#E5E7EB',
  textPrimary: '#111827',
  textMuted: '#6B7280',

  // Semantic
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',

  // Chat-specific
  userBubble: '#10B981',      // brand with white text
  coachBubble: '#F3F4F6',     // gray-100 with dark text
};

export const spacing = {
  messageGapSame: '8px',      // between messages from same sender
  messageGapDiff: '16px',     // between messages from different senders
  bubblePadding: '12px 12px', // horizontal, vertical
  screenPadding: '16px',
};

export const typography = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  body: '16px',
  bodySmall: '14px',
  caption: '12px',
};
```

## Database Schema

### users
- id (uuid, PK)
- email (text)
- name (text)
- created_at (timestamp)

### user_profiles
- user_id (uuid, FK)
- current_weight (decimal)
- target_weight (decimal)
- height (decimal)
- age (int)
- activity_level (enum: sedentary, light, moderate, active, very_active)
- goal_type (enum: lose, maintain, gain)
- daily_calorie_target (int)
- daily_protein_target (int)
- updated_at (timestamp)

### meals
- id (uuid, PK)
- user_id (uuid, FK)
- logged_at (timestamp)
- meal_type (enum: breakfast, lunch, dinner, snack)
- description (text) - what user said they ate
- calories (int)
- protein (decimal)
- carbs (decimal)
- fat (decimal)
- ai_estimated (boolean) - whether AI estimated the macros

### weight_logs
- id (uuid, PK)
- user_id (uuid, FK)
- logged_at (timestamp)
- weight (decimal)
- notes (text, nullable)

### conversation_history
- id (uuid, PK)
- user_id (uuid, FK)
- role (enum: user, assistant)
- content (text)
- created_at (timestamp)
- archived_at (timestamp, nullable) - for conversation archival

**Database Indexes (critical for performance):**
```sql
CREATE INDEX idx_meals_user_logged_at ON meals(user_id, logged_at DESC);
CREATE INDEX idx_weight_logs_user_logged_at ON weight_logs(user_id, logged_at DESC);
CREATE INDEX idx_conversation_user_created ON conversation_history(user_id, created_at DESC);
```

**Constraints:**
```sql
ALTER TABLE meals ADD CONSTRAINT calories_non_negative CHECK (calories >= 0);
ALTER TABLE meals ADD CONSTRAINT protein_non_negative CHECK (protein >= 0);
ALTER TABLE weight_logs ADD CONSTRAINT weight_positive CHECK (weight > 0);
```

**Authorization:**
- Clerk middleware verifies JWT on all API routes
- All queries filter by `user_id` from Clerk session
- Services enforce user isolation at the application level

## AI Tool Definitions (for OpenRouter)

```typescript
const tools = [
  {
    name: "lookup_nutrition",
    description: "Look up accurate nutrition info for food using Nutritionix API. Call this BEFORE log_meal to get accurate calorie/macro data.",
    parameters: {
      query: "natural language food description (e.g., '2 scrambled eggs with cheese')"
    }
  },
  {
    name: "log_meal",
    description: "Log a meal after looking up nutrition data",
    parameters: {
      meal_type: "breakfast | lunch | dinner | snack",
      description: "what the user ate",
      calories: "calories from lookup_nutrition",
      protein: "grams of protein",
      carbs: "grams of carbs",
      fat: "grams of fat"
    }
  },
  {
    name: "log_weight",
    description: "Record the user's current weight",
    parameters: {
      weight: "weight in lbs or kg",
      notes: "optional notes"
    }
  },
  {
    name: "get_today_summary",
    description: "Get summary of today's nutrition intake",
    parameters: {}
  },
  {
    name: "get_weekly_progress",
    description: "Get the user's progress over the past week",
    parameters: {}
  },
  {
    name: "get_weight_history",
    description: "Get weight logs over time",
    parameters: {
      days: "number of days to look back"
    }
  },
  {
    name: "update_goals",
    description: "Update user's fitness goals",
    parameters: {
      daily_calorie_target: "optional new calorie target",
      target_weight: "optional new target weight",
      goal_type: "lose | maintain | gain"
    }
  },
  {
    name: "suggest_meal",
    description: "Suggest a meal based on remaining calories/macros and optional ingredients",
    parameters: {
      available_ingredients: "optional list of ingredients user has",
      meal_type: "breakfast | lunch | dinner | snack",
      max_calories: "optional calorie limit"
    }
  }
]
```

## Project Structure (Monorepo)

```
health-ai/
├── apps/
│   └── web/                           # React frontend (Vite)
│       ├── src/
│       │   ├── components/
│       │   │   ├── Chat/
│       │   │   │   ├── ChatContainer.tsx
│       │   │   │   ├── MessageList.tsx
│       │   │   │   ├── UserMessage.tsx
│       │   │   │   ├── CoachMessage.tsx
│       │   │   │   ├── TypingIndicator.tsx
│       │   │   │   ├── ChatInput.tsx
│       │   │   │   └── VoiceButton.tsx
│       │   │   ├── QuickActions/
│       │   │   │   ├── QuickActionsBar.tsx
│       │   │   │   └── ActionButton.tsx
│       │   │   ├── Progress/
│       │   │   │   ├── DailySummaryHeader.tsx
│       │   │   │   ├── MacroRing.tsx
│       │   │   │   ├── CalorieBar.tsx
│       │   │   │   └── WeeklyChart.tsx
│       │   │   ├── Feedback/
│       │   │   │   ├── Toast.tsx
│       │   │   │   └── Skeleton.tsx
│       │   │   └── Layout/
│       │   │       ├── AppShell.tsx
│       │   │       └── BottomNav.tsx
│       │   ├── hooks/
│       │   │   ├── useChat.ts
│       │   │   ├── useVoiceInput.ts
│       │   │   └── useProgress.ts
│       │   ├── lib/
│       │   │   ├── api.ts             # API client (fetch wrapper)
│       │   │   └── tokens.ts          # Design tokens
│       │   ├── App.tsx
│       │   ├── main.tsx
│       │   └── index.css
│       ├── public/
│       │   ├── manifest.json
│       │   └── icons/
│       ├── index.html
│       ├── vite.config.ts
│       ├── tailwind.config.js
│       └── package.json
│
├── apps/
│   └── api/                           # Bun + Fastify backend
│       ├── src/
│       │   ├── index.ts               # Server entry point
│       │   ├── routes/
│       │   │   ├── chat.ts            # POST /api/chat (<200 lines)
│       │   │   ├── progress.ts        # GET /api/progress endpoints
│       │   │   └── user.ts            # User profile endpoints
│       │   ├── lib/
│       │   │   ├── ai-client.ts       # OpenRouter wrapper
│       │   │   ├── schemas.ts         # Zod validation
│       │   │   └── clerk.ts           # Clerk middleware
│       │   ├── tools/
│       │   │   ├── index.ts           # Tool registry
│       │   │   ├── nutrition-lookup.ts
│       │   │   ├── meal-logger.ts
│       │   │   ├── weight-logger.ts
│       │   │   ├── progress-fetcher.ts
│       │   │   └── meal-suggester.ts
│       │   ├── services/
│       │   │   ├── meal-service.ts
│       │   │   ├── weight-service.ts
│       │   │   └── user-service.ts
│       │   └── db/
│       │       ├── index.ts           # Drizzle client
│       │       ├── schema.ts          # Drizzle schema definitions
│       │       └── migrations/        # Drizzle migrations
│       ├── drizzle.config.ts
│       └── package.json
│
├── packages/
│   └── shared/                        # Shared types & utilities
│       ├── src/
│       │   └── types.ts               # Shared TypeScript types
│       └── package.json
│
├── package.json                       # Root package.json (workspaces)
├── turbo.json                         # Turborepo config (optional)
└── .env.example
```

## Implementation Steps

### Phase 1: Project Setup
1. Initialize monorepo with Bun workspaces
2. Set up apps/web with Vite + React + TypeScript
3. Set up apps/api with Bun + Fastify
4. Configure Tailwind CSS in web app
5. Set up PWA (vite-plugin-pwa)
6. Set up environment variables

### Phase 2: Database & Auth
7. Set up PostgreSQL (Neon or local)
8. Configure Drizzle ORM with schema
9. Create initial migration
10. Set up Clerk in frontend (ClerkProvider)
11. Add Clerk middleware to Fastify backend
12. Create user sync webhook (Clerk → DB)

### Phase 3: Core Chat UI
13. Build AppShell layout (mobile-first)
14. Create ChatContainer with MessageList
15. Build UserMessage and CoachMessage components
16. Add TypingIndicator
17. Create ChatInput with send functionality
18. Add VoiceButton with Web Speech API

### Phase 4: API Routes
19. Create POST /api/chat route scaffold
20. Install and configure OpenRouter SDK (`@openrouter/sdk`)
21. Implement AI client with tool definitions
22. Define tool parameter schemas with Zod
23. Implement tool execution handlers
24. Add conversation history persistence

### Phase 5: Tool Implementations
25. Implement lookup_nutrition (Nutritionix API)
26. Implement log_meal tool + DB insert
27. Implement log_weight tool + DB insert
28. Implement get_today_summary tool
29. Implement get_weekly_progress tool
30. Implement get_weight_history tool
31. Implement update_goals tool
32. Implement suggest_meal tool

### Phase 6: Quick Actions & Progress
33. Build QuickActionsBar with common actions
34. Create DailySummaryHeader (collapsible)
35. Build WeeklyChart for trends (lazy-loaded)

### Phase 7: Polish & PWA
36. Add loading states and error handling
37. Implement offline support basics
38. Configure PWA manifest and icons
39. Test on mobile devices

## System Prompt for AI Coach

```
You are a friendly, knowledgeable personal fitness and nutrition coach. Your name is "Coach". You help users track their nutrition, monitor their weight, and achieve their health goals.

Today's date is: {current_date}

User Profile:
- Name: {user_name}
- Current weight: {current_weight} lbs
- Target weight: {target_weight} lbs
- Daily calorie goal: {daily_calorie_target} cal
- Goal: {goal_type} weight

Today's Progress:
- Calories consumed: {today_calories} / {daily_calorie_target}
- Protein: {today_protein}g
- Meals logged: {meals_logged}

Guidelines:
1. Be encouraging but honest about progress
2. When users mention food, use log_meal to track it with estimated nutrition
3. Proactively check daily progress and offer suggestions
4. Suggest meals that fit within remaining daily calories
5. Celebrate wins (hitting goals, consistent logging, weight milestones)
6. If progress is slow, gently suggest adjustments
7. Keep responses concise - this is a mobile chat interface
8. Use tools to fetch data rather than guessing about user's history
```

## Environment Variables

```
# Frontend (apps/web)
VITE_API_URL=http://localhost:3000
VITE_CLERK_PUBLISHABLE_KEY=

# Backend (apps/api)
DATABASE_URL=postgresql://...
CLERK_SECRET_KEY=
OPENROUTER_API_KEY=
NUTRITIONIX_APP_ID=
NUTRITIONIX_API_KEY=
```

## Key Decisions

1. **Bun + Fastify over serverless** - Full control, deploy anywhere (Railway, Fly.io, VPS), no vendor lock-in

2. **PostgreSQL + Drizzle ORM** - Type-safe queries, easy migrations, works with any Postgres host

3. **Clerk for auth** - Managed auth with great DX, handles OAuth/sessions, easy frontend + backend integration

4. **OpenRouter with Claude 3.5 Haiku** - Fast, affordable, good at tool use. Can upgrade to Sonnet/Opus later if needed.

5. **Monorepo structure** - Shared types between frontend/backend, single repo for full stack

6. **Conversation history with archival** - Keep 7 days full history, archive older messages, delete after 90 days

7. **Nutritionix API for nutrition data** - AI parses what user ate, calls Nutritionix for accurate calorie/macro data. Falls back to AI estimation if API fails.

8. **No daily_summaries table** - Query meals directly with indexes; add denormalized table only if proven slow

9. **Imperial units (lbs, oz)** - Default unit system for weights and measurements

10. **Modular route handlers** - Split into ai-client, tools/, services/ to maintain Single Responsibility

11. **Zod validation on all inputs** - Security and data integrity at the API boundary

## OpenRouter SDK Integration

Using the official `@openrouter/sdk` TypeScript package for AI interactions:

```typescript
// apps/api/src/lib/ai-client.ts
import OpenRouter from '@openrouter/sdk';

export const openrouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Example chat with tool calling
const response = await openrouter.chat.send({
  model: 'anthropic/claude-3.5-haiku',
  messages: [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    { role: 'user', content: userMessage },
  ],
  tools: [
    {
      type: 'function',
      function: {
        name: 'lookup_nutrition',
        description: 'Look up nutrition info for food using Nutritionix API',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: "Natural language food description (e.g., '2 eggs and toast')",
            },
          },
          required: ['query'],
        },
      },
    },
    // ... other tools
  ],
  tool_choice: 'auto',
});

// Handle tool calls
if (response.choices[0].message.tool_calls) {
  for (const toolCall of response.choices[0].message.tool_calls) {
    const result = await executeToolCall(toolCall);
    // Continue conversation with tool result...
  }
}

// Streaming support
const stream = await openrouter.chat.send({
  model: 'anthropic/claude-3.5-haiku',
  messages: [...],
  stream: true,
});

for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content;
  if (content) {
    // Stream to client
  }
}
```

## Nutritionix Integration

The AI will use a `lookup_nutrition` tool that calls the Nutritionix Natural Language API:

```typescript
// Tool definition
{
  name: "lookup_nutrition",
  description: "Look up nutrition info for a food item using Nutritionix",
  parameters: {
    query: "natural language description of food (e.g., '2 eggs and toast with butter')"
  }
}

// API call in backend
const response = await fetch('https://trackapi.nutritionix.com/v2/natural/nutrients', {
  method: 'POST',
  headers: {
    'x-app-id': NUTRITIONIX_APP_ID,
    'x-app-key': NUTRITIONIX_API_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ query })
});
```

The flow:
1. User says "I had a chicken salad with ranch dressing"
2. AI calls `lookup_nutrition` with that query
3. Nutritionix returns detailed breakdown (calories, protein, carbs, fat per item)
4. AI uses that data to call `log_meal` with accurate values
5. AI confirms to user what was logged
