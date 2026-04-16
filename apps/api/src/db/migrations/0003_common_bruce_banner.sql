CREATE TABLE "conversation_summaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"summary" text NOT NULL,
	"messages_from" timestamp with time zone NOT NULL,
	"messages_to" timestamp with time zone NOT NULL,
	"message_count" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "conversation_summaries" ADD CONSTRAINT "conversation_summaries_user_id_users_clerk_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("clerk_user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_conversation_summaries_user" ON "conversation_summaries" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_conversation_summaries_user_date" ON "conversation_summaries" USING btree ("user_id","messages_to");