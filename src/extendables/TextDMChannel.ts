import { DMChannel, MessageAttachment, MessageOptions, Permissions, TextChannel } from 'discord.js';
import { Extendable, ExtendableStore, KlasaUser } from 'klasa';

import { bankImageCache } from '../lib/constants';
import { ItemBank } from './../lib/types/index';

export default class extends Extendable {
	public constructor(store: ExtendableStore, file: string[], directory: string) {
		super(store, file, directory, { appliesTo: [TextChannel, DMChannel] });
	}

	// @ts-ignore 2784
	get attachable(this: TextChannel) {
		return (
			!this.guild ||
			(this.postable && this.permissionsFor(this.guild.me!)!.has(Permissions.FLAGS.ATTACH_FILES, false))
		);
	}

	// @ts-ignore 2784
	get embedable(this: TextChannel) {
		return (
			!this.guild ||
			(this.postable && this.permissionsFor(this.guild.me!)!.has(Permissions.FLAGS.EMBED_LINKS, false))
		);
	}

	// @ts-ignore 2784
	get postable(this: TextChannel) {
		return (
			!this.guild ||
			this.permissionsFor(this.guild.me!)!.has(
				[Permissions.FLAGS.VIEW_CHANNEL, Permissions.FLAGS.SEND_MESSAGES],
				false
			)
		);
	}

	// @ts-ignore 2784
	get readable(this: TextChannel) {
		return !this.guild || this.permissionsFor(this.guild.me!)!.has(Permissions.FLAGS.VIEW_CHANNEL, false);
	}

	async sendBankImage(
		this: TextChannel,
		{
			bank,
			content,
			title,
			background,
			flags,
			user,
			cl
		}: {
			bank: ItemBank;
			content?: string;
			title?: string;
			background?: number;
			flags?: Record<string, string>;
			user?: KlasaUser;
			cl?: ItemBank;
		}
	) {
		const { image, cacheKey, isTransparent } = await this.client.tasks
			.get('bankImage')!
			.generateBankImage(bank, title, true, { background: background ?? 1, ...flags }, user, cl);

		let cached = bankImageCache.get(cacheKey);
		if (cached) {
			console.log('Using cached bank image');
		}

		if (cached && content) {
			content += `\n${cached}`;
		}
		let options: MessageOptions = { content: content ?? cached };

		if (image && !cached) {
			options.files = [new MessageAttachment(image!, isTransparent ? 'bank.png' : 'bank.jpg')];
		}
		const sent = await this.send(options);

		const url = sent.attachments.first()?.proxyURL;
		if (url) {
			bankImageCache.set(cacheKey, url);
		}
		return sent;
	}
}
