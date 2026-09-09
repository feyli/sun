# Sun
An **open-source** Discord bot made by [Feyli](https://feyli.dev)

![GitHub commit activity](https://img.shields.io/github/commit-activity/w/feyli/sun)
## Features

- **Slash commands**
- Linked **database**
- **Moderation** and **utility** commands
- **Automated** systems (welcome message, auto role)
- **AI** integrations
## Using the Bot

Want to give this bot a try? You can install it to your Discord server by clicking [here](https://discord.com/oauth2/authorize?client_id=743826135061889028).

Sun is also available as a **user-wide app**, which means you can [add it](https://discord.com/oauth2/authorize?client_id=743826135061889028) to your Discord account and invoke it **anywhere**!
## FAQ

#### What is this repository for?

Sun's code is stored in this repository. I made it public so anyone can check it out and see what a Discord bot looks like from the inside.

#### What am I allowed to do with this code?

You may use **some** of this code. However, you **may not** use the code as a whole, and you **may not** publish this code as your own product. If your code uses a significant portion of mine, **credit** is required.

#### Who are you, and how can we get in touch?

I'm **Feyli**! Get to know me [here](https://feyli.dev). You can find all my socials there, so feel free to contact me on any of them—though I prefer Discord, it's really up to you. Can't wait to hear from you! 😊
## Environment Variables

To run this project, you'll need to add the following environment variables to your `.env` file:

- `TOKEN`
- `POSTGRES_PASSWORD`
- `ARCANEDBPASSWORD`
- `OPENAIKEY`

Bun loads the `.env` file automatically. Optionally, `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER` and `POSTGRES_DATABASE` override the PostgreSQL defaults in `src/db/connection.ts`.

The non-secret configuration (IDs, the Arcane Blades host) lives in `src/config.ts`, which is gitignored: copy `src/config.example.ts` to `src/config.ts` and adjust it.

## Local Development

Install the [source code](https://github.com/feyli/sun) from **GitHub**

```bash
$ git clone https://github.com/feyli/sun.git
$ cd sun
```

The bot is written in **TypeScript** and runs on [Bun](https://bun.sh), which executes TypeScript directly (no build step).

Add the [required environment variables](#Environment-Variables) and the configuration file, then run:
```bash
bun install
cp src/config.example.ts src/config.ts
bun run start
```

To type-check the project:
```bash
bun run typecheck
```
## Commands

Commands are plain objects built by a factory, in the style of the official discord.js guide. Each file default-exports one command, and `src/commands/index.ts` is the single place new commands get registered.

```ts
export default defineSlashCommand({
    data: guildsOnly(
        new SlashCommandBuilder()
            .setName('example')
            .setDescription('Does something useful.')
            .addStringOption((option) => option.setName('input').setDescription('Some text.').setRequired(true)),
    ),
    category: 'Utility',
    cooldown: 5000,
    guildOnly: true,
    async execute(interaction) {
        // `interaction.guild` is non-null here, because guildOnly narrows the type
        await interaction.reply(interaction.options.getString('input', true));
    },
});
```

Notes on the shape:

- **`data` is a builder**, not hand-written JSON. Names, lengths and option types are validated when the module loads rather than rejected by Discord at deploy time.
- **`guildOnly: true`** both narrows `interaction` to a cached-guild interaction and installs the runtime guard, so guild commands never hand-roll that check.
- **`anywhere()` / `guildsOnly()`** set the install and context scopes, which otherwise repeat on every command.
- **No `client` parameter.** `src/types/discord.d.ts` augments discord.js's `Client`, so `interaction.client.db` and `interaction.client.commands` are typed everywhere.

The same factories cover the other interaction kinds: `defineMessageCommand`, `defineUserCommand`, `defineButton`, `defineModal` and `defineEvent`. Buttons and modals live in `src/components/` and are matched by custom ID.

## Database

The bot's own data lives in **PostgreSQL**, accessed through [Drizzle ORM](https://orm.drizzle.team) using Bun's native SQL driver. The schema is declared in `src/db/schema.ts` and migrations live in `drizzle/`.

```bash
bun run db:generate   # create a migration from schema changes
bun run db:migrate    # apply pending migrations
bun run db:check      # verify migrations are consistent
bun run db:studio     # browse the data
```

The Arcane Blades database is a separate **MariaDB** instance shared with the Minecraft server plugin. It is intentionally outside the Drizzle setup and is still queried through the `mariadb` pool.

## Support & Community

We have a **support** and **community** Discord server! Join it [here](https://discord.com/invite/q5x2tUr2rr).
## Logo

![Logo](https://cdn.discordapp.com/avatars/743826135061889028/1c7fda307d3c78723c85dffed3bbae1b.webp?size=4096&format=webp&width=0&height=512)

This logo was entirely created by [Feyli](https://feyli.dev) and is inspired by his own logo. It features a **simplified fox**, split into two complementary parts.
This logo may not be used by anyone, anywhere, without the explicit approval of the author.
