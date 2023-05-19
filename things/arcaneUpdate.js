// noinspection JSUnresolvedVariable

const { MinecraftServerListPing: mslp } = require("minecraft-status");
const client = require('../index');
const { ChannelType } = require("discord.js");

module.exports = async () => {
    const db = client.db;
    const guild = client.guilds.cache.get('1108029635096223814');
    const inGameRole = guild.roles.cache.get('1108870536391565422');
    const playerRole = guild.roles.cache.get('1108036097335894026');
    const category = guild.channels.cache.get('1108882661923102740');

    if (!guild || !inGameRole || !playerRole || !category) return console.log('Arcane Update: Something went wrong. (guild, inGameRole, playerRole, category)');

    const players = await db.query('SELECT * FROM arcane_players');

    try {
        const res = await mslp.ping(4, '88.170.151.90', 32768);

        const sample = res.players.sample;

        for (const player of players) {
            if (sample.find(p => p.name === player.player_username) && guild.members.cache.get(player.user_id).presence.status !== 'offline') {
                const member = guild.members.cache.get(player.user_id);
                await member.roles.add(inGameRole);
                await member.roles.add(playerRole);
                if (!category.children.cache.find((c) => c.name === player.player_username)) await category.children.create({
                    name: player.player_username,
                    type: ChannelType.GuildVoice,
                    permissionOverwrites: [{ id: guild.id, deny: '1048576' }]
                });
                if (member.manageable) await member.setNickname(player.player_username, 'minecraft username check');
            } else {
                await guild.members.cache.get(player.user_id).roles.remove(inGameRole);
                if (category.children.cache.find((c) => c.name === player.player_username)) await category.children.cache.find((c) => c.name === player.player_username).delete();
            }
        }
    } catch (e) {
        console.log("Catch Triggered");
        await guild.members.cache.filter((m) => m.roles.cache.has('1108870536391565422')).forEach((m) => m.roles.remove(inGameRole));
        if (category.children) category.children.cache.filter((c) => c.type === 'voice').forEach((c) => c.delete());
    }
};