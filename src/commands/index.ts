import type { Command } from '../types/commands';
import ask from './ai/ask';
import fixSpelling from './ai/fix_spelling';
import summary from './ai/summary';
import help from './bot/help';
import invite from './bot/invite';
import ping from './bot/ping';
import status from './bot/status';
import setBrief from './contextual/set_brief';
import showAvatar from './contextual/show_avatar';
import leaderboard from './exclusive/leaderboard';
import mcpseudo from './exclusive/mcpseudo';
import profile from './exclusive/profile';
import confessionSettings from './high/confessionsettings';
import mcsettings from './high/mcsettings';
import membercounter from './high/membercounter';
import welcome from './high/welcome';
import clear from './mod/clear';
import warn from './mod/warn';
import evalCommand from './owner/eval';
import test from './owner/test';
import confess from './util/confess';
import mcstatus from './util/mcstatus';
import rolesort from './util/rolesort';
import brief from './wt_campaign/brief';
import briefchannel from './wt_campaign/briefchannel';

/** Every application command of the bot. Add new commands here to have them deployed. */
export const commands: Command[] = [
    // AI
    ask,
    fixSpelling,
    summary,
    // Bot
    help,
    invite,
    ping,
    status,
    // Context menus
    setBrief,
    showAvatar,
    // Arcane Blades (guild-exclusive)
    leaderboard,
    mcpseudo,
    profile,
    // System management
    confessionSettings,
    mcsettings,
    membercounter,
    welcome,
    // Moderation
    clear,
    warn,
    // Owner
    evalCommand,
    test,
    // Utility
    confess,
    mcstatus,
    rolesort,
    // War Thunder campaign (guild-exclusive)
    brief,
    briefchannel,
];
