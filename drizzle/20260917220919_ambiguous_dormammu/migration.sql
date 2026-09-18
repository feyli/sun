DROP TABLE "polls";--> statement-breakpoint
ALTER TABLE "command_logs" RENAME CONSTRAINT "command_logs_commands_id_fk" TO "command_logs_command_id_commands_id_fkey";--> statement-breakpoint
ALTER TABLE "guilds" ADD COLUMN "poll_channel_id" varchar(30);--> statement-breakpoint
ALTER TABLE "mcstatus" ADD CONSTRAINT "mcstatus_guild_id_guilds_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "guilds"("id");