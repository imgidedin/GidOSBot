import {
	DMChannel,
	MessageActionRowComponentResolvable,
	MessageButton,
	MessageButtonOptions,
	MessageComponentInteraction,
	MessageOptions,
	NewsChannel,
	TextChannel,
	ThreadChannel
} from 'discord.js';
import { chunk, objectEntries, objectValues, Time } from 'e';
import { KlasaClient, KlasaMessage, KlasaUser } from 'klasa';

import { SILENT_ERROR } from '../constants';

export type customComponentButtonFunction =
	| ((msg: KlasaMessage) => Promise<KlasaMessage | KlasaMessage[] | null>)
	| ((msg: KlasaMessage) => void);

export type TComponentSelection = Record<string, { function?: customComponentButtonFunction; char?: string }>;

export type customMessageButtonOptions = MessageButtonOptions & {
	onClick?: customComponentButtonFunction;
	messageCharacter?: string;
};

interface IOptions {
	time: number;
	chunkSize: number;
	timeLimitMessage?: string;
	timeLimitThrows?: boolean;
	deleteOnSuccess?: boolean;
}

const userCache: Record<string, string> = {};

export class customMessageComponents {
	public buttons: MessageActionRowComponentResolvable[] = [];
	public functions: TComponentSelection = {};
	public options: IOptions = {
		time: Time.Second * 15,
		chunkSize: 5
	};

	private _client: KlasaClient | undefined = undefined;

	public setClient(value: KlasaClient | undefined = undefined) {
		this._client = value;
		return this;
	}

	public setOptions(newOptions: Partial<IOptions>) {
		this.options = { ...this.options, ...newOptions };
		return this;
	}

	public addButton(b: customMessageButtonOptions | customMessageButtonOptions[]) {
		if (Array.isArray(b)) {
			b.map(_b => this.addButton(_b));
			return this;
		}
		if (b.onClick) {
			if (this.functions[b.customID!]) {
				this.functions[b.customID!].function = b.onClick;
			} else {
				this.functions[b.customID!] = { function: b.onClick };
			}
		}
		if (b.messageCharacter) {
			b.label = `[${b.messageCharacter.toUpperCase()}] ${b.label}`;
			if (this.functions[b.customID!]) {
				this.functions[b.customID!].char = b.messageCharacter;
			} else {
				this.functions[b.customID!] = { char: b.messageCharacter };
			}
		}
		this.buttons.push(new MessageButton(b));
		return this;
	}

	public getButtons() {
		return this.buttons.length > 0 ? [...chunk(this.buttons, this.options.chunkSize)] : undefined;
	}

	public getFunctions() {
		return Object.keys(this.functions).length > 0 ? this.functions : undefined;
	}

	public async clearMessage(message: KlasaMessage, type?: string) {
		if (type !== 'error') {
			await message.edit({
				content:
					type === 'timelimit' && this.options.timeLimitMessage
						? this.options.timeLimitMessage
						: message.content.replace(/\*\* \*\* \*\* \*\*\n(.+?)\*\* \*\* \*\* \*\*/, ''),
				components: []
			});
		} else {
			await message.edit({ components: [] });
		}
		if ((type === 'timelimit' && this.options.timeLimitThrows) || type === 'error') {
			throw new Error(SILENT_ERROR);
		} else if (type === 'sucess' && this.options.deleteOnSuccess) {
			await message.delete();
		}
	}

	/**
	 * Send a message to the channel specified, with all the buttons created that only the user specified can react to.
	 * @param options
	 */
	public async sendMessage(options: {
		msg?: KlasaMessage;
		data: string | MessageOptions;
		user?: KlasaUser;
		channel?: TextChannel | DMChannel | NewsChannel | ThreadChannel;
	}) {
		let { data, channel, user, msg } = options;
		if (!user && msg) user = msg.author;
		if (!channel && msg) channel = msg.channel;
		if (!channel || !user) return;
		if (typeof data === 'string') data = { content: data };
		if (this.getButtons()) data.components = this.getButtons();

		const allowsTypedChars = objectValues(this.functions)
			.filter(f => f.char)
			.map(f => f.char!.toLowerCase());

		if (allowsTypedChars.length > 0) {
			data.content += '\n** ** ** **\n';
		}
		const textShortcuts = [];
		for (const d of this.buttons as customMessageButtonOptions[]) {
			if (this.functions[d.customID!]) {
				textShortcuts.push(
					`${(d as customMessageButtonOptions).label!.replace(/\[/g, '`').replace(/]/g, '`')}`
				);
			}
		}
		if (textShortcuts.length > 0) data.content += `${textShortcuts.join(', ')}** ** ** **`;

		const message = await channel.send(data);
		userCache[user.id] = message.id;
		if (data.components) {
			try {
				const selection = await Promise.race([
					message.channel.awaitMessages({
						time: this.options.time,
						max: 1,
						errors: ['time'],
						filter: _msg => {
							return (
								allowsTypedChars.length > 0 &&
								_msg.author.id === user!.id &&
								allowsTypedChars.includes(_msg.content.toLowerCase())
							);
						}
					}),
					message.awaitMessageComponentInteraction({
						filter: i => {
							if (i.user.id !== user!.id) {
								i.reply({ ephemeral: true, content: 'This is not your confirmation message.' });
								return false;
							}
							return true;
						},
						time: this.options.time
					})
				]);

				if (user.minionIsBusy || (this._client && this._client.oneCommandAtATimeCache.has(user.id))) {
					await this.clearMessage(message, 'busy_or_one_at_time');
					return message;
				}

				let response = '';
				// noinspection SuspiciousTypeOfGuard
				if (selection instanceof MessageComponentInteraction) {
					response = selection.customID;
				} else {
					// Ignore text responses from old messages
					if (userCache[user.id] !== message.id) {
						await this.clearMessage(message, 'old_message_text_reply');
						return message;
					}
					response = selection.entries().next().value[1].content.toLowerCase();
					const functionExists = objectEntries(this.functions).find(f => {
						return f[1].char?.toLowerCase() === response.toLowerCase();
					});
					if (functionExists) {
						// eslint-disable-next-line prefer-destructuring
						response = functionExists[0];
					}
				}
				if (this._client !== undefined) {
					this._client.oneCommandAtATimeCache.add(user.id);
				}
				if (this.functions && this.functions[response] && this.functions[response].function) {
					message.author = user;
					this.functions[response].function!(message);
				}
				await this.clearMessage(message, 'sucess');
			} catch (e) {
				await this.clearMessage(message, e instanceof Error ? 'error' : 'timelimit');
			} finally {
				if (userCache[user.id] === message.id) delete userCache[user.id];
				if (this._client !== undefined) {
					setTimeout(() => this._client!.oneCommandAtATimeCache.delete(user!.id), 300);
				}
			}
		}
		return message;
	}
}
