import { CommandStore, KlasaMessage } from 'klasa';

import { BotCommand } from '../../lib/structures/BotCommand';

export default class extends BotCommand {
	public constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {
			description: 'Displays the invite link for the bot.',
			examples: ['+invite'],
			categoryFlags: ['utility']
		});
	}

	async run(msg: KlasaMessage) {
		return msg.channel.send(
			`You can invite the bot to your server using this link: https://discord.com/oauth2/authorize?client_id=729244028989603850&scope=bot+applications.commands&permissions=537259072
			
**This is *Bot School Old*, separate to the real bot.**`
		);
	}
}
