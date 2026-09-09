import type { ComponentHandler } from '../types/commands';
import previewBrief from './buttons/preview_brief';
import resetWarnsNo from './buttons/reset_warns_no';
import resetWarnsYes from './buttons/reset_warns_yes';
import sendBrief from './buttons/send_brief';
import confessModal from './modals/confess_modal';

/** Every button and modal handler of the bot, matched by custom ID. */
export const components: ComponentHandler[] = [previewBrief, resetWarnsNo, resetWarnsYes, sendBrief, confessModal];
