import { defineButton } from '../../types/commands';
import { sendMissionBrief } from '../../utils/missionBrief';

export default defineButton({
    customId: 'send_brief',
    guildOnly: true,
    execute: (interaction) => sendMissionBrief(interaction),
});
