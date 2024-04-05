// noinspection JSUnresolvedVariable

const client = require('../index');

module.exports = async() => {
    const db = client.arcaneDb;
    const players = db.query('SELECT player_uuid FROM players');
    const playerArray = []
    for (let player in players) {
        const res = await fetch("https://sessionserver.mojang.com/session/minecraft/profile/" + player.player_uuid).then(res => res.json()).catch(() => null);
        if (!res) continue;
        const username = res.name;
        playerArray.push([player.player_uuid, username, username]);
    }
    await db.batch('INSERT INTO players (player_uuid, player_name) VALUES (?, ?) ON DUPLICATE KEY UPDATE player_name=?', playerArray);
}