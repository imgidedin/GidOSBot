import { Command, CommandStore, KlasaMessage } from 'klasa';

import { GuildSettings } from '../../lib/settings/types/GuildSettings';
import { BotCommand } from '../../lib/structures/BotCommand';

export default class extends BotCommand {
	public constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {
			runIn: ['text'],
			cooldown: 2,
			subcommands: true,
			usage: '<enable|disable> <command:cmd>',
			usageDelim: ' ',
			permissionLevel: 7,
			description: 'Allows you to enable or disable commands in your server.',
			examples: ['+cmd enable casket', '+cmd disable casket'],
			categoryFlags: ['settings']
		});
	}

	// @ts-ignore 2416
	async enable(msg: KlasaMessage, [command]: [Command]) {
		if (!msg.guild!.settings.get(GuildSettings.DisabledCommands).includes(command.name)) {
			return msg.channel.send("That command isn't disabled.");
		}
		await msg.guild!.settings.update('disabledCommands', command.name, {
			arrayAction: 'remove'
		});
		return msg.channel.send(`Successfully enabled the \`${command.name}\` command.`);
	}

	// @ts-ignore 2416
	async disable(msg: KlasaMessage, [command]: [Command]) {
		if (msg.guild!.settings.get(GuildSettings.DisabledCommands).includes(command.name)) {
			return msg.channel.send('That command is already disabled.');
		}
		await msg.guild!.settings.update(GuildSettings.DisabledCommands, command.name, {
			arrayAction: 'add'
		});
		return msg.channel.send(`Successfully disabled the \`${command.name}\` command.`);
	}
}
