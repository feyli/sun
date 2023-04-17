const { ChannelType } = require('discord.js')

module.exports = {
  name: 'counters',
  description: 'Counters',
  command_data: {
    name: 'counters',
    description: 'Counter-related commands.',
    type: 1,
    default_member_permissions: 16,
    dm_permission: false,
    options: [
      {
        name: 'members',
        description: 'Member counter-related options.',
        type: 2,
        options: [
          {
            name: 'enable',
            description: 'Enables the member counter.',
            type: 1,
          },
          {
            name: 'disable',
            description: 'Disables the member counter.',
            type: 1,
          },
          {
            name: 'setstyle',
            description: 'Sets the style for the member counter.',
            type: 1,
            options: [
              {
                name: 'name',
                description: 'The name of the channel.',
                type: 3,
                required: true,
                max_length: 75,
              },
            ],
          },
          {
            name: 'status',
            description: 'Displays the status of the member counter.',
            type: 1,
          },
          {
            name: 'help',
            description: 'Displays help for the member counter.',
            type: 1,
          },
        ],
      },
    ],
  },
  category: 'Utility',
  cooldown: 5000,
  async run (client, interaction) {
    await interaction.deferReply({ ephemeral: false })

    const db = client.db
    const group = interaction.options.getSubcommandGroup()
    const command = interaction.options.getSubcommand()

    if (group === 'members') {
      if (command === 'enable' || command === 'disable' || command === 'setstyle' || command ===
        'status') {
        // noinspection JSUnresolvedVariable
        let dbChannelID = await db.query(
          'SELECT member_counter_channel_id FROM guilds WHERE guild_id = ?',
          [interaction.guild.id]).then((res) => res[0].member_counter_channel_id)

        let counterChannel = interaction.guild.channels.cache.get(dbChannelID)

        if (command === 'enable') {
          const humanCount = interaction.guild.members.cache.filter((m) => !m.user.bot).size
          if (counterChannel) return interaction.editReply(
            `The member counter is already enabled (${counterChannel}) and is at position ${counterChannel.position +
            1} (voice channels only).`)

          ChannelType.GuildVoice = 2
          const channel = await interaction.guild.channels.create(
            {
              name: 'Members: ' + humanCount,
              type: ChannelType.GuildVoice,
              permissionOverwrites: [{ id: interaction.guild.id, deny: '1048576' }],
            })
          db.query(
            'UPDATE guilds SET member_counter_channel_id = ? WHERE guild_id = ?',
            [channel.id, interaction.guild.id])
          await interaction.editReply(
            `${channel} has been created and will now update everytime someone joins or leaves the server.`)
        }
        if (command === 'disable') {
          if (!dbChannelID) return interaction.editReply(
            'No member counter has been set up in this server!')
          db.query(
            'UPDATE guilds SET member_counter_channel_id = ?, member_counter_style = ? WHERE guild_id = ?',
            [null, null, interaction.guild.id])
          counterChannel.delete()
          await interaction.editReply('Member counter has been disabled!')
        }

        if (command === 'setstyle') {
          const humanCount = interaction.guild.members.cache.filter((m) => !m.user.bot).size
          if (!dbChannelID) return interaction.editReply(
            'No member counter has been set up in this server!')
          const name = interaction.options.getString('name')
          if (!name.includes('{fullLength}') &&
            !name.includes('{thousandLength}')) return interaction.editReply(
            'The name must include `{fullLength}` or `{thousandLength}`.')
          db.query('UPDATE guilds SET member_counter_style = ? WHERE guild_id = ?',
            [name, interaction.guild.id])

          ChannelType.GuildVoice = 2
          if (!counterChannel) {
            counterChannel = await interaction.guild.channels.create(
              {
                name: 'Members: ' + interaction.guild.memberCount,
                type: ChannelType.GuildVoice,
                permissionOverwrites: [{ id: interaction.guild.id, deny: '1048576' }],
              })
            db.query('UPDATE guilds SET member_counter_channel_id = ? WHERE guild_id = ?',
              [counterChannel.id, interaction.guild.id])
          }
          await counterChannel.setName(
            name.replaceAll('{fullLength}', humanCount).
              replace('{thousandLength}', (humanCount / 1000).toFixed(2) + 'k'))
          await interaction.editReply(
            `The member counter style has been set to \`${name}\` and the channel has been updated.`)
        }

        if (command === 'status') {
          if (dbChannelID && !counterChannel) {
            db.query(
              'UPDATE guilds SET member_counter_channel_id = ? WHERE guild_id = ?',
              [null, interaction.guild.id])
            dbChannelID = null
          }

          // noinspection JSUnresolvedVariable
          let embed = {
            title: 'Member Counter Status',
            author: {
              name: interaction.guild.name,
              iconURL: interaction.guild.iconURL({ dynamic: true }),
            },
            fields: [
              {
                name: 'Enabled',
                value: dbChannelID ? 'Yes' : 'No',
                inline: true,
              },
              {
                name: 'Channel',
                value: counterChannel?.toString() ?? 'None',
                inline: true,
              },
              {
                name: 'Channel Position',
                value: counterChannel ? counterChannel.position + 1 : 'None',
                inline: true,
              },
              {
                name: 'Channel ID',
                value: dbChannelID ?? 'None',
                inline: true,
              },
              {
                name: 'Style',
                value: await db.query(
                  'SELECT member_counter_style FROM guilds WHERE guild_id = ?',
                  [interaction.guild.id]).then((res) => res[0].member_counter_style) ?? 'None',
                inline: true,
              },
            ],
          }
          await interaction.editReply({ embeds: [embed] })
        }
      }
      if (command === 'help') {
        let embed = {
          title: 'Member Counter Help',
          description: 'Here you will mainly find the syntax regarding the counters (when setting a custom style). Once created, a counter channel will be automatically updated everytime sometimes joins or leaves the server (this also works for bans). You can move the channel as you wish and edit all of its properties but the name will automatically go back to what you set.',
          fields: [
            {
              name: '`{fullLength}`',
              value: 'The full length of the counter (e.g. 128 544).',
              inline: true,
            },
            {
              name: '`{thousandLength}`',
              value: 'The length of the counter, showing only per thousands (e.g. 128k).',
              inline: true,
            },
            {
              name: '`.comma`',
              value: 'Use a comma to separate thousands (e.g. 128,544).',
              inline: true,
            },
            {
              name: '`.space`',
              value: 'Use a space to separate thousands (e.g. 128 544).',
              inline: true,
            },
          ],
        }
        await interaction.editReply({ embeds: [embed] })
      }
    }
  },
}