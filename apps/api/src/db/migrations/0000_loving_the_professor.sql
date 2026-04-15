CREATE TYPE "public"."data_source" AS ENUM('ai_estimate', 'nutritionix', 'user_manual');--> statement-breakpoint
CREATE TYPE "public"."goal_type" AS ENUM('lose_weight', 'maintain', 'gain_muscle', 'general_health');--> statement-breakpoint
CREATE TYPE "public"."meal_type" AS ENUM('breakfast', 'lunch', 'dinner', 'snack');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'assistant', 'system');--> statement-breakpoint
CREATE TYPE "public"."preferred_units" AS ENUM('metric', 'imperial');--> statement-breakpoint
CREATE TABLE "conversation_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"role" "role" NOT NULL,
	"content" text NOT NULL,
	"tool_calls" text,
	"tool_results" text,
	"model" varchar(100),
	"tokens_used" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"meal_type" "meal_type" NOT NULL,
	"description" text NOT NULL,
	"calories" integer NOT NULL,
	"protein_g" numeric(6, 2) NOT NULL,
	"carbs_g" numeric(6, 2) NOT NULL,
	"fat_g" numeric(6, 2) NOT NULL,
	"notes" text,
	"logged_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"data_source" "data_source" DEFAULT 'ai_estimate'
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"goal_type" "goal_type",
	"target_weight_kg" numeric(5, 2),
	"target_weight_lbs" numeric(5, 2),
	"daily_calorie_target" integer,
	"daily_protein_target_g" integer,
	"daily_carbs_target_g" integer,
	"daily_fat_target_g" integer,
	"preferred_units" "preferred_units" DEFAULT 'metric',
	"timezone" varchar(50) DEFAULT 'UTC' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"clerk_user_id" varchar(255) PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"full_name" varchar(255),
	"profile_image_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "weight_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"weight_kg" numeric(5, 2) NOT NULL,
	"weight_lbs" numeric(5, 2) NOT NULL,
	"notes" text,
	"logged_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "conversation_history" ADD CONSTRAINT "conversation_history_user_id_users_clerk_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("clerk_user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meals" ADD CONSTRAINT "meals_user_id_users_clerk_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("clerk_user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_users_clerk_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("clerk_user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weight_logs" ADD CONSTRAINT "weight_logs_user_id_users_clerk_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("clerk_user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_conversation_user_date" ON "conversation_history" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_meals_user_date" ON "meals" USING btree ("user_id","logged_at");--> statement-breakpoint
CREATE INDEX "idx_meals_user_type" ON "meals" USING btree ("user_id","meal_type");--> statement-breakpoint
CREATE INDEX "idx_meals_logged_at" ON "meals" USING btree ("logged_at");--> statement-breakpoint
CREATE INDEX "idx_user_profiles_user_id" ON "user_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_weight_logs_user_date" ON "weight_logs" USING btree ("user_id","logged_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_weight_logs_unique_timestamp" ON "weight_logs" USING btree ("user_id","logged_at");--> statement-breakpoint
ALTER TABLE "meals" ADD CONSTRAINT "meals_calories_check" CHECK ("calories" >= 0);--> statement-breakpoint
ALTER TABLE "meals" ADD CONSTRAINT "meals_protein_check" CHECK ("protein_g" >= 0);--> statement-breakpoint
ALTER TABLE "meals" ADD CONSTRAINT "meals_carbs_check" CHECK ("carbs_g" >= 0);--> statement-breakpoint
ALTER TABLE "meals" ADD CONSTRAINT "meals_fat_check" CHECK ("fat_g" >= 0);--> statement-breakpoint
ALTER TABLE "weight_logs" ADD CONSTRAINT "weight_logs_kg_check" CHECK ("weight_kg" > 0 AND "weight_kg" < 500);--> statement-breakpoint
ALTER TABLE "weight_logs" ADD CONSTRAINT "weight_logs_lbs_check" CHECK ("weight_lbs" > 0 AND "weight_lbs" < 1100);