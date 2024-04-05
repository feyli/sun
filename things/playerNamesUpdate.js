// noinspection JSUnresolvedVariable

const client = require('../index');

module.exports = async() => {
    const db = client.arcaneDb;
    const players = await db.query('SELECT player_uuid FROM players');
    await console.log(players);
    const playerArray = [];
    for (const player of players) {
        const res = await fetch("https://sessionserver.mojang.com/session/minecraft/profile/" + player.player_uuid).then(res => res.json()).catch(() => null);
        if (!res) continue;
        console.log("Player: " + player.player_uuid + " Name: " + res.name)
        const username = res.name;
        playerArray.push([player.player_uuid, username, username]);
    }
    console.log(playerArray);
    await db.batch('INSERT INTO players (player_uuid, player_name) VALUES (?, ?) ON DUPLICATE KEY UPDATE player_name=?', playerArray);
}