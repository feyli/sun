CREATE TABLE "awaiting_confessions" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"guild_id" varchar(30) NOT NULL,
	"confession" text NOT NULL,
	"release_date" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "commands" DROP CONSTRAINT "type_value", ADD CONSTRAINT "type_value" CHECK ("type" >= 1 AND
    "type"
    <=
    4);