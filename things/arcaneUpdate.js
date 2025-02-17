// noinspection JSUnresolvedVariable

const { MinecraftServerListPing: mslp } = require("minecraft-status");
const client = require('../index');
const { ChannelType } = require("discord.js");
const util = require('util');

module.exports = async () => {
    const pool = client.arcanePool;
    const guild = client.guilds.cache.get('1108029635096223814');
    const inGameRole = guild.roles.cache.get('1108870536391565422');
    const playerRole = guild.roles.cache.get('1108036097335894026');
    const category = guild.channels.cache.get('1108882661923102740');

    if (!guild || !inGameRole || !playerRole || !category) return console.log('Arcane Update: Something went wrong. (guild, inGameRole, playerRole, category)');

    const players = await pool.query('SELECT user_id, REPLACE(player_uuid, \'-\', \'\') AS player_uuid FROM players WHERE user_id IS NOT NULL');

    try {
        const res = await mslp.ping(4, '82.64.252.221', 32000);

        const sample = res.players.sample;

        if (!sample) {
            category.children.cache.forEach((c) => c.delete());
            guild.members.cache.filter((m) => m.roles.cache.has('1108870536391565422')).forEach((m) => m.roles.remove(inGameRole));
            return;
        }

        sample.forEach((p) => p.id = p.id.replace(/-/g, ''));

        for (const player of sample) {
            if (!category.children.cache.find((c) => c.name === player.name)) await category.children.create({
                name: player.name,
                type: ChannelType.GuildVoice,
                permissionOverwrites: [{ id: guild.id, deny: '1048576' }]
            });
        }

        console.log("Sample:" + util.inspect(sample, false, null, true));

        category.children.cache.filter((c) => !sample.find(p => p.name === c.name)).forEach((c) => c.delete());

        for (const player of players) {
            if (sample.find(p => p.id === player.player_uuid) && guild.members.cache.get(player.user_id).presence && guild.members.cache.get(player.user_id).presence.status !== 'offline') {
                const member = guild.members.cache.get(player.user_id);
                console.log(member.user.username + " is in the sample");
                await member.roles.add(inGameRole);
                await member.roles.add(playerRole);
                if (member.manageable) await member.setNickname(sample.find((p) => p.id === player.player_uuid).name, 'minecraft username check');
            } else {
                if (!guild.members.cache.get(player.user_id)) continue;
                console.log(guild.members.cache.get(player.user_id).user.username + " is not in the sample");
                await guild.members.cache.get(player.user_id).roles.remove(inGameRole);
            }
        }
    } catch (e) {
        console.log("Catch Triggered");
        console.error(e);
        await guild.members.cache.filter((m) => m.roles.cache.has('1108870536391565422')).forEach((m) => m.roles.remove(inGameRole));
        if (category.children) category.children.cache.filter((c) => c.type === 'voice').forEach((c) => c.delete());
    }
};