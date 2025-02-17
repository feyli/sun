// noinspection JSUnresolvedVariable

const client = require('../index');

module.exports = async() => {
    const conn = client.arcanePool.getConnection();
    const players = await conn.query('SELECT player_uuid FROM players');
    const playerArray = [];
    for (const player of players) {
        const res = await fetch("https://sessionserver.mojang.com/session/minecraft/profile/" + player.player_uuid).then(res => res.json()).catch(() => null);
        if (!res) continue;
        const username = res.name;
        playerArray.push([player.player_uuid, username, username]);
    }
    await conn.batch('INSERT INTO players (player_uuid, player_name) VALUES (?, ?) ON DUPLICATE KEY UPDATE player_name=?', playerArray);
}