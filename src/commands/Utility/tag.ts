import { Util } from 'discord.js';
import { CommandStore, KlasaMessage } from 'klasa';

import { GuildSettings } from '../../lib/settings/types/GuildSettings';
import { BotCommand } from '../../lib/structures/BotCommand';

export default class extends BotCommand {
	public constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {
			description: 'Allows you to create, remove or show tags.',
			examples: ['+tag add test Hello', '+test'],
			runIn: ['text'],
			subcommands: true,
			usage: '<add|remove|source|list|show:default> (tag:string) [content:...string]',
			usageDelim: ' ',
			categoryFlags: ['utility']
		});
		this.createCustomResolver('string', (arg, possible, message, [action]) => {
			if (action === 'list') {
				return arg;
			}
			return this.client.arguments.get('string')!.run(arg, possible, message);
		});
	}

	async add(message: KlasaMessage, [tag, content]: [string, string]) {
		const isStaff = await message.hasAtLeastPermissionLevel(6);
		if (!message.member || !isStaff) {
			return message.channel.send('You must be a staff of this server to add tags.');
		}

		if (!content || content.length === 0) {
			return message.channel.send('You must provide content for the tag.');
		}

		if (message.guild!.settings.get(GuildSettings.Tags).some(_tag => _tag[0] === tag.toLowerCase())) {
			return message.channel.send('That tag already exists.');
		}
		await message.guild!.settings.update(
			GuildSettings.Tags,
			[...message.guild!.settings.get(GuildSettings.Tags), [tag.toLowerCase(), content]],
			{ arrayAction: 'overwrite' }
		);

		return message.channel.send(
			`Added the tag \`${message.cmdPrefix + tag}\` with content: \`\`\`${Util.escapeMarkdown(content)}\`\`\``
		);
	}

	async remove(message: KlasaMessage, [tag]: [string]) {
		const isStaff = await message.hasAtLeastPermissionLevel(6);
		if (!message.member || !isStaff) return;
		if (!message.guild!.settings.get(GuildSettings.Tags).some(_tag => _tag[0] === tag.toLowerCase())) {
			return message.channel.send("That tag doesn't exist.");
		}
		const filtered = message.guild!.settings.get(GuildSettings.Tags).filter(([name]) => name !== tag.toLowerCase());
		await message.guild!.settings.update(GuildSettings.Tags, filtered, {
			arrayAction: 'overwrite'
		});
		return message.channel.send(`Removed the tag \`${tag}\`.`);
	}

	list(message: KlasaMessage) {
		return message.channel.send(
			`Tags for this guild are: ${message
				.guild!.settings.get(GuildSettings.Tags)
				.map(([name]) => name)
				.join(', ')}`
		);
	}

	show(message: KlasaMessage, [tag]: [string]) {
		const emote = message.guild!.settings.get(GuildSettings.Tags).find(([name]) => name === tag.toLowerCase());
		if (!emote) {
			return null;
		}
		return message.channel.send(emote[1]);
	}

	source(message: KlasaMessage, [tag]: [string]) {
		const emote = message.guild!.settings.get(GuildSettings.Tags).find(([name]) => name === tag.toLowerCase());
		if (!emote) {
			return message.channel.send("That emote doesn't exist.");
		}
		return message.channel.send(`\`\`\`${Util.escapeMarkdown(emote[1])}\`\`\``);
	}
}
