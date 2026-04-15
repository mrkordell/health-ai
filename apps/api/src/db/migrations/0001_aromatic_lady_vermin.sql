CREATE TYPE "public"."activity_level" AS ENUM('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active');--> statement-breakpoint
CREATE TYPE "public"."frequency" AS ENUM('never', 'rarely', 'sometimes', 'often', 'daily');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('male', 'female', 'other', 'prefer_not_to_say');--> statement-breakpoint
CREATE TYPE "public"."onboarding_status" AS ENUM('not_started', 'in_progress', 'completed', 'skipped');--> statement-breakpoint
CREATE TABLE "onboarding_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"preferred_name" varchar(100),
	"age" integer,
	"gender" "gender",
	"current_weight_kg" numeric(5, 2),
	"current_weight_lbs" numeric(5, 2),
	"height_cm" numeric(5, 1),
	"height_feet" integer,
	"height_inches" integer,
	"activity_level" "activity_level",
	"exercise_frequency" integer,
	"workout_types" text,
	"meals_per_day" integer,
	"cooking_frequency" "frequency",
	"eating_out_frequency" "frequency",
	"preferred_cuisines" text,
	"favorite_foods" text,
	"disliked_foods" text,
	"allergies" text,
	"intolerances" text,
	"dietary_restrictions" text,
	"onboarding_status" "onboarding_status" DEFAULT 'not_started',
	"onboarding_completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "onboarding_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "onboarding_complete" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "onboarding_profiles" ADD CONSTRAINT "onboarding_profiles_user_id_users_clerk_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("clerk_user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_onboarding_profiles_user_id" ON "onboarding_profiles" USING btree ("user_id");