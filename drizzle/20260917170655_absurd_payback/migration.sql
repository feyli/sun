CREATE TABLE "polls" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"guild_id" varchar(30) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "guilds" RENAME COLUMN "guild_id" TO "id";--> statement-breakpoint
ALTER TABLE "polls" ADD CONSTRAINT "polls_guild_id_guilds_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "guilds"("id");