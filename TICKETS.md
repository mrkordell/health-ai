# Health AI - MVP Tickets

> **MVP Goal**: Working chat interface where users can log meals, track weight, and get AI coaching with accurate nutrition data.

---

## Epic 1: Project Foundation

### TICKET-001: Initialize Monorepo Structure
**Priority**: P0 | **Estimate**: 1-2 hours

**Description**: Set up the monorepo with Bun workspaces containing web and api apps.

**Acceptance Criteria**:
- [ ] Root `package.json` with Bun workspaces configured
- [ ] `apps/web` - empty Vite + React + TypeScript project
- [ ] `apps/api` - empty Bun + Fastify project
- [ ] `packages/shared` - shared types package
- [ ] All packages can be installed with single `bun install`
- [ ] Scripts: `bun run dev` starts both apps concurrently

**Files to create**:
- `package.json`
- `apps/web/package.json`
- `apps/api/package.json`
- `packages/shared/package.json`
- `apps/web/vite.config.ts`
- `apps/api/src/index.ts`

---

### TICKET-002: Configure Frontend Tooling
**Priority**: P0 | **Estimate**: 1 hour

**Description**: Set up Tailwind CSS and design tokens in the web app.

**Acceptance Criteria**:
- [ ] Tailwind CSS installed and configured
- [ ] Design tokens file created (`src/lib/tokens.ts`)
- [ ] Custom colors added to Tailwind config (emerald brand, indigo accent)
- [ ] Inter font loaded
- [ ] Base styles applied (background, font-family)

**Dependencies**: TICKET-001

---

### TICKET-003: Set Up PostgreSQL + Drizzle ORM
**Priority**: P0 | **Estimate**: 2 hours

**Description**: Configure database connection and create initial schema.

**Acceptance Criteria**:
- [ ] Drizzle ORM installed in api app
- [ ] Database connection configured (supports DATABASE_URL env var)
- [ ] Schema defined for all tables: `users`, `user_profiles`, `meals`, `weight_logs`, `conversation_history`
- [ ] Initial migration created and runs successfully
- [ ] Indexes created for performance-critical queries

**Files to create**:
- `apps/api/src/db/index.ts`
- `apps/api/src/db/schema.ts`
- `apps/api/drizzle.config.ts`
- `apps/api/src/db/migrations/0000_initial.sql`

**Dependencies**: TICKET-001

---

### TICKET-004: Set Up Clerk Authentication
**Priority**: P0 | **Estimate**: 2-3 hours

**Description**: Integrate Clerk for authentication in both frontend and backend.

**Acceptance Criteria**:
- [ ] Clerk React SDK installed in web app
- [ ] `ClerkProvider` wrapping app with publishable key
- [ ] Sign-in/sign-up pages working
- [ ] Clerk middleware installed in Fastify backend
- [ ] Protected routes require valid JWT
- [ ] User ID extractable from Clerk session in API routes

**Files to create**:
- `apps/web/src/lib/clerk.ts`
- `apps/api/src/lib/clerk.ts`
- `apps/api/src/middleware/auth.ts`

**Dependencies**: TICKET-001

---

### TICKET-005: User Sync (Clerk → Database)
**Priority**: P1 | **Estimate**: 1-2 hours

**Description**: Sync Clerk users to local database on first login.

**Acceptance Criteria**:
- [ ] When user authenticates, check if user exists in DB
- [ ] If not, create user record with Clerk ID, email, name
- [ ] Create empty user_profile record
- [ ] Service function: `getOrCreateUser(clerkUserId)`

**Files to create**:
- `apps/api/src/services/user-service.ts`

**Dependencies**: TICKET-003, TICKET-004

---

## Epic 2: Core Chat UI

### TICKET-006: App Shell & Layout
**Priority**: P0 | **Estimate**: 2 hours

**Description**: Create the main app layout with mobile-first design.

**Acceptance Criteria**:
- [ ] `AppShell` component with proper viewport handling
- [ ] Safe area padding for mobile devices
- [ ] Flex layout: header → content → input area
- [ ] Proper keyboard handling (input stays above keyboard)
- [ ] Background color from design tokens

**Files to create**:
- `apps/web/src/components/Layout/AppShell.tsx`
- `apps/web/src/App.tsx` (update)

**Dependencies**: TICKET-002, TICKET-004

---

### TICKET-007: Chat Message Components
**Priority**: P0 | **Estimate**: 2-3 hours

**Description**: Build the chat message UI components.

**Acceptance Criteria**:
- [ ] `UserMessage` - right-aligned, emerald background, white text
- [ ] `CoachMessage` - left-aligned, gray background, with avatar placeholder
- [ ] `MessageList` - scrollable container, auto-scrolls to bottom
- [ ] Proper spacing between messages (8px same sender, 16px different)
- [ ] Messages have max-width ~80%

**Files to create**:
- `apps/web/src/components/Chat/MessageList.tsx`
- `apps/web/src/components/Chat/UserMessage.tsx`
- `apps/web/src/components/Chat/CoachMessage.tsx`

**Dependencies**: TICKET-006

---

### TICKET-008: Chat Input Component
**Priority**: P0 | **Estimate**: 2 hours

**Description**: Build the chat input with send functionality.

**Acceptance Criteria**:
- [ ] Text input that grows up to 3 lines
- [ ] Send button (disabled when empty)
- [ ] Enter to send (Shift+Enter for newline)
- [ ] Input clears after sending
- [ ] Minimum 44px touch target for send button
- [ ] Calls `onSend(message)` prop

**Files to create**:
- `apps/web/src/components/Chat/ChatInput.tsx`

**Dependencies**: TICKET-006

---

### TICKET-009: Typing Indicator
**Priority**: P1 | **Estimate**: 30 min

**Description**: Show typing indicator while AI is responding.

**Acceptance Criteria**:
- [ ] Three-dot animation component
- [ ] Appears in CoachMessage bubble style
- [ ] Shown when `isLoading` prop is true

**Files to create**:
- `apps/web/src/components/Chat/TypingIndicator.tsx`

**Dependencies**: TICKET-007

---

### TICKET-010: Chat Container & State
**Priority**: P0 | **Estimate**: 2-3 hours

**Description**: Wire up chat components with state management.

**Acceptance Criteria**:
- [ ] `ChatContainer` orchestrates all chat components
- [ ] `useChat` hook manages messages state
- [ ] Sends message to API, receives response
- [ ] Shows typing indicator during API call
- [ ] Handles errors gracefully (toast or inline error)
- [ ] Initial "Coach" greeting message on load

**Files to create**:
- `apps/web/src/components/Chat/ChatContainer.tsx`
- `apps/web/src/hooks/useChat.ts`
- `apps/web/src/lib/api.ts`

**Dependencies**: TICKET-007, TICKET-008, TICKET-009

---

## Epic 3: AI Backend

### TICKET-011: OpenRouter SDK Setup
**Priority**: P0 | **Estimate**: 1-2 hours

**Description**: Configure OpenRouter SDK client with tool definitions.

**Acceptance Criteria**:
- [ ] `@openrouter/sdk` installed
- [ ] Client initialized with API key from env
- [ ] Helper function to send chat with tools
- [ ] All 8 tools defined with proper schemas
- [ ] Model configurable (default: claude-3.5-haiku)

**Files to create**:
- `apps/api/src/lib/ai-client.ts`
- `apps/api/src/lib/tool-definitions.ts`

**Dependencies**: TICKET-001

---

### TICKET-012: Chat API Route
**Priority**: P0 | **Estimate**: 3-4 hours

**Description**: Create the main chat endpoint that handles AI conversations.

**Acceptance Criteria**:
- [ ] `POST /api/chat` route
- [ ] Accepts `{ message: string }` body
- [ ] Requires authenticated user (Clerk middleware)
- [ ] Builds system prompt with user context
- [ ] Sends to OpenRouter with conversation history
- [ ] Handles tool calls (executes and continues conversation)
- [ ] Returns final assistant message
- [ ] Persists messages to conversation_history table

**Files to create**:
- `apps/api/src/routes/chat.ts`
- `apps/api/src/lib/system-prompt.ts`

**Dependencies**: TICKET-004, TICKET-005, TICKET-011

---

### TICKET-013: Tool Execution Framework
**Priority**: P0 | **Estimate**: 2 hours

**Description**: Create the framework for executing AI tool calls.

**Acceptance Criteria**:
- [ ] Tool registry mapping tool names to handlers
- [ ] `executeToolCall(toolCall, userId)` function
- [ ] Each handler receives parsed arguments + userId
- [ ] Returns result to be sent back to AI
- [ ] Error handling for failed tool executions

**Files to create**:
- `apps/api/src/tools/index.ts`
- `apps/api/src/tools/types.ts`

**Dependencies**: TICKET-011

---

## Epic 4: Core Tool Implementations

### TICKET-014: Nutritionix Integration
**Priority**: P0 | **Estimate**: 2 hours

**Description**: Implement nutrition lookup via Nutritionix API.

**Acceptance Criteria**:
- [ ] `lookup_nutrition` tool handler
- [ ] Calls Nutritionix Natural Language API
- [ ] Returns calories, protein, carbs, fat for queried food
- [ ] Handles API errors gracefully
- [ ] Falls back to "unable to look up" message on failure

**Files to create**:
- `apps/api/src/tools/nutrition-lookup.ts`
- `apps/api/src/lib/nutritionix.ts`

**Dependencies**: TICKET-013

---

### TICKET-015: Log Meal Tool
**Priority**: P0 | **Estimate**: 1-2 hours

**Description**: Implement meal logging to database.

**Acceptance Criteria**:
- [ ] `log_meal` tool handler
- [ ] Validates: meal_type, description, calories, protein, carbs, fat
- [ ] Inserts into meals table with user_id and timestamp
- [ ] Returns confirmation message with logged values

**Files to create**:
- `apps/api/src/tools/meal-logger.ts`
- `apps/api/src/services/meal-service.ts`

**Dependencies**: TICKET-003, TICKET-013

---

### TICKET-016: Log Weight Tool
**Priority**: P0 | **Estimate**: 1 hour

**Description**: Implement weight logging to database.

**Acceptance Criteria**:
- [ ] `log_weight` tool handler
- [ ] Validates: weight (positive number), optional notes
- [ ] Inserts into weight_logs table with user_id and timestamp
- [ ] Returns confirmation message

**Files to create**:
- `apps/api/src/tools/weight-logger.ts`
- `apps/api/src/services/weight-service.ts`

**Dependencies**: TICKET-003, TICKET-013

---

### TICKET-017: Get Today Summary Tool
**Priority**: P0 | **Estimate**: 1-2 hours

**Description**: Fetch today's nutrition totals for the AI.

**Acceptance Criteria**:
- [ ] `get_today_summary` tool handler
- [ ] Queries meals table for today (user's timezone)
- [ ] Returns: total calories, protein, carbs, fat, meal count
- [ ] Returns user's daily targets for comparison

**Files to create**:
- `apps/api/src/tools/progress-fetcher.ts` (partial)

**Dependencies**: TICKET-003, TICKET-013

---

### TICKET-018: Get Weight History Tool
**Priority**: P1 | **Estimate**: 1 hour

**Description**: Fetch weight history for trend analysis.

**Acceptance Criteria**:
- [ ] `get_weight_history` tool handler
- [ ] Accepts `days` parameter (default 30)
- [ ] Returns array of { date, weight } entries
- [ ] Sorted by date ascending

**Dependencies**: TICKET-003, TICKET-013

---

### TICKET-019: Update Goals Tool
**Priority**: P1 | **Estimate**: 1 hour

**Description**: Allow AI to update user's fitness goals.

**Acceptance Criteria**:
- [ ] `update_goals` tool handler
- [ ] Can update: daily_calorie_target, target_weight, goal_type
- [ ] Updates user_profiles table
- [ ] Returns confirmation with new values

**Dependencies**: TICKET-003, TICKET-013

---

### TICKET-020: Suggest Meal Tool
**Priority**: P2 | **Estimate**: 1-2 hours

**Description**: AI generates meal suggestions (no external API needed).

**Acceptance Criteria**:
- [ ] `suggest_meal` tool handler
- [ ] Accepts: meal_type, max_calories, available_ingredients (optional)
- [ ] Returns prompt for AI to generate suggestion based on constraints
- [ ] (AI itself generates the suggestion, tool just provides context)

**Dependencies**: TICKET-013, TICKET-017

---

### TICKET-021: Get Weekly Progress Tool
**Priority**: P2 | **Estimate**: 1-2 hours

**Description**: Fetch week's progress for coaching insights.

**Acceptance Criteria**:
- [ ] `get_weekly_progress` tool handler
- [ ] Returns last 7 days of: daily calories, meals logged
- [ ] Returns weight change if weigh-ins exist
- [ ] Calculates average daily calories

**Dependencies**: TICKET-003, TICKET-013

---

## Epic 5: Quick Actions & Progress UI

### TICKET-022: Quick Actions Bar
**Priority**: P1 | **Estimate**: 2 hours

**Description**: Add quick action buttons above chat input.

**Acceptance Criteria**:
- [ ] `QuickActionsBar` with horizontally scrollable pills
- [ ] Actions: "Log Meal", "Weigh In", "Meal Ideas"
- [ ] Tapping inserts pre-filled text into chat input
- [ ] 36px height pills with 44px touch targets

**Files to create**:
- `apps/web/src/components/QuickActions/QuickActionsBar.tsx`
- `apps/web/src/components/QuickActions/ActionButton.tsx`

**Dependencies**: TICKET-008

---

### TICKET-023: Daily Summary Header
**Priority**: P1 | **Estimate**: 2-3 hours

**Description**: Collapsible header showing today's progress.

**Acceptance Criteria**:
- [ ] `DailySummaryHeader` component
- [ ] Collapsed: "1,240 / 1,800 cal | 3 meals"
- [ ] Expanded: shows protein, carbs, fat breakdown
- [ ] Tap to toggle expand/collapse
- [ ] Fetches data from `/api/progress/today` endpoint
- [ ] Sticky at top of chat

**Files to create**:
- `apps/web/src/components/Progress/DailySummaryHeader.tsx`
- `apps/web/src/hooks/useProgress.ts`
- `apps/api/src/routes/progress.ts`

**Dependencies**: TICKET-006, TICKET-017

---

## Epic 6: Voice Input (Stretch)

### TICKET-024: Voice Input Button
**Priority**: P2 | **Estimate**: 3-4 hours

**Description**: Add voice input using Web Speech API.

**Acceptance Criteria**:
- [ ] `VoiceButton` component next to send button
- [ ] Uses Web Speech API for transcription
- [ ] Shows waveform/pulse animation while listening
- [ ] Transcribed text appears in input field
- [ ] Handles browsers without speech support gracefully

**Files to create**:
- `apps/web/src/components/Chat/VoiceButton.tsx`
- `apps/web/src/hooks/useVoiceInput.ts`

**Dependencies**: TICKET-008

---

## Epic 7: Polish & Deploy

### TICKET-025: Environment & Deployment Config
**Priority**: P1 | **Estimate**: 1-2 hours

**Description**: Finalize environment setup and deployment configs.

**Acceptance Criteria**:
- [ ] `.env.example` with all required variables documented
- [ ] API CORS configured for production domain
- [ ] Frontend API URL configurable via env
- [ ] Basic Dockerfile for API (optional)
- [ ] Vercel/Railway config for easy deployment

**Files to create**:
- `.env.example`
- `apps/api/Dockerfile` (optional)

**Dependencies**: All previous tickets

---

### TICKET-026: Error Handling & Loading States
**Priority**: P1 | **Estimate**: 2 hours

**Description**: Add proper error handling and loading states throughout.

**Acceptance Criteria**:
- [ ] Toast component for success/error messages
- [ ] Chat shows error message if API fails
- [ ] Retry button on failed messages
- [ ] Skeleton loading for DailySummaryHeader
- [ ] Graceful handling of network errors

**Files to create**:
- `apps/web/src/components/Feedback/Toast.tsx`
- `apps/web/src/components/Feedback/Skeleton.tsx`

**Dependencies**: TICKET-010, TICKET-023

---

### TICKET-027: PWA Configuration
**Priority**: P2 | **Estimate**: 1-2 hours

**Description**: Make the app installable as a PWA.

**Acceptance Criteria**:
- [ ] `vite-plugin-pwa` installed and configured
- [ ] App manifest with name, icons, theme color
- [ ] Service worker for basic caching
- [ ] App installable on mobile devices

**Files to create**:
- `apps/web/public/manifest.json`
- `apps/web/public/icons/` (various sizes)
- Update `vite.config.ts`

**Dependencies**: TICKET-002

---

## Ticket Summary

| Priority | Tickets | Description |
|----------|---------|-------------|
| **P0** | 001-008, 010-017 | Core functionality - must have for MVP |
| **P1** | 005, 009, 018-019, 022-023, 025-026 | Important but can ship without |
| **P2** | 020-021, 024, 027 | Nice to have, stretch goals |

## Suggested Sprint Plan

### Sprint 1: Foundation (3-4 days)
- TICKET-001: Monorepo setup
- TICKET-002: Frontend tooling
- TICKET-003: Database + Drizzle
- TICKET-004: Clerk auth
- TICKET-005: User sync

### Sprint 2: Chat UI (2-3 days)
- TICKET-006: App shell
- TICKET-007: Message components
- TICKET-008: Chat input
- TICKET-009: Typing indicator
- TICKET-010: Chat container

### Sprint 3: AI Backend (3-4 days)
- TICKET-011: OpenRouter SDK
- TICKET-012: Chat API route
- TICKET-013: Tool framework
- TICKET-014: Nutritionix
- TICKET-015: Log meal
- TICKET-016: Log weight
- TICKET-017: Today summary

### Sprint 4: Polish & Ship (2-3 days)
- TICKET-022: Quick actions
- TICKET-023: Daily summary header
- TICKET-025: Deployment config
- TICKET-026: Error handling

**Total MVP Estimate: ~10-14 days**
