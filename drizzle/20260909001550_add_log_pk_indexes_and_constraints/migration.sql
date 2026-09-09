ALTER TABLE "command_logs" ADD COLUMN "id" integer GENERATED ALWAYS AS IDENTITY (sequence name "command_logs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1);--> statement-breakpoint
ALTER TABLE "command_logs" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "warns" ALTER COLUMN "creator_id" SET DATA TYPE varchar(30) USING "creator_id"::varchar(30);--> statement-breakpoint
CREATE INDEX "command_logs_timestamp_idx" ON "command_logs" ("timestamp" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "guilds_member_counter_channel_id_idx" ON "guilds" ("member_counter_channel_id");--> statement-breakpoint
CREATE INDEX "mcstatus_counter_channel_id_idx" ON "mcstatus" ("counter_channel_id");--> statement-breakpoint
CREATE INDEX "warns_guild_id_user_id_idx" ON "warns" ("guild_id","user_id");--> statement-breakpoint
ALTER TABLE "mcstatus" ADD CONSTRAINT "mcstatus_port_range" CHECK ("port" BETWEEN 0 AND 65535);--> statement-breakpoint
ALTER TABLE "commands" DROP CONSTRAINT "type_value", ADD CONSTRAINT "type_value" CHECK ("type" >= 1 AND "type" <= 4);