import { CommandStore, KlasaMessage } from 'klasa';

import { BotCommand } from '../../lib/structures/BotCommand';

export default class extends BotCommand {
	public constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {
			description: 'Shows the link to the help page for old school bot',
			examples: ['+help'],
			categoryFlags: ['utility']
		});
	}

	async run(msg: KlasaMessage) {
		return msg.channel.send('https://www.oldschool.gg/oldschoolbot');
	}
}
