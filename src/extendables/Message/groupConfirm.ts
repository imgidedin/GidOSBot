import { Message, MessageButton } from 'discord.js';
import { chunk, Time } from 'e';
import { Extendable, ExtendableStore, KlasaMessage, KlasaUser } from 'klasa';

import { SILENT_ERROR } from '../../lib/constants';

export default class extends Extendable {
	public constructor(store: ExtendableStore, file: string[], directory: string) {
		super(store, file, directory, { appliesTo: [Message] });
	}

	async groupConfirm(
		this: KlasaMessage,
		options: { str: string; type: string[]; successStr: string; errorStr: string; users: KlasaUser[] }
	) {
		if (!options.users) {
			await this.channel.send('No valid users.');
			throw new Error(SILENT_ERROR);
		}
		const uniqueUsers = [...new Set([this.author, ...options.users])];
		if (uniqueUsers.length < 2) {
			await this.channel.send('Not enough users for a group confirmation.');
			throw new Error(SILENT_ERROR);
		}
		const confirmation = options.type[0] || 'confirmation';
		const confirmed = options.type[1] || 'confirmed';
		const users = uniqueUsers.map(u => {
			return {
				user: u,
				confirmed: false,
				btn: new MessageButton({
					label: `${u.username} ${confirmation}`,
					style: 'PRIMARY',
					customID: u.id
				})
			};
		});
		const components = [
			...chunk(
				[
					...users.map(u => u.btn),
					new MessageButton({
						label: 'Cancel',
						style: 'DANGER',
						customID: 'cancel'
					})
				],
				5
			)
		];
		const message = await this.channel.send({
			content: options.str,
			components
		});

		const end = async (reason: string, error = false) => {
			await message.edit({ components: [], content: `${message.content}\n\n${reason}` });
			if (error) throw new Error(SILENT_ERROR);
			return message;
		};

		try {
			while (users.filter(u => !u.confirmed).length > 0) {
				const selection = await message.awaitMessageComponentInteraction({
					filter: i => {
						if (
							!components
								.map(c => c.map(b => b.customID))
								.flat(10)
								.includes(i.user.id)
						) {
							i.reply({ ephemeral: true, content: 'This is not your confirmation message.' });
							return false;
						}
						if (i.customID !== i.user.id && i.customID !== 'cancel') {
							i.reply({ ephemeral: true, content: 'Please, use your own button.' });
							return false;
						}
						return true;
					},
					time: Time.Second * 15
				});
				if (selection.customID === 'cancel') {
					return end(`${selection.user.username} decided to cancel.`, true);
				}
				const selectedUser = users.find(u => u.user.id === selection.customID);
				selectedUser!.confirmed = true;
				selectedUser!.btn.label = `${selectedUser!.user.username} ${confirmed}`;
				selectedUser!.btn.style = 'SUCCESS';
				selectedUser!.btn.disabled = true;
				await message.edit({ components });
				await selection.deferUpdate();
			}
		} catch (e) {
			return end(options.errorStr || 'Cancelling. Everyone must confirm it', true);
		}
		if (users.filter(u => !u.confirmed).length > 0) return;
		return end(`${options.successStr || 'Everyone confirmed.'}`);
	}
}
