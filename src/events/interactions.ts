import { ButtonInteraction, Message, MessageComponentInteraction } from 'discord.js';
import { Event, EventStore } from 'klasa';

import { proccessVoting } from '../commands/Utility/vote';
import { Interactions } from '../lib/typeorm/Interactions.entity';

export const enum EInteractionTypes {
	Voting = 'voting'
}

export default class extends Event {
	public constructor(store: EventStore, file: string[], directory: string) {
		super(store, file, directory, {
			once: false,
			event: 'interaction'
		});
	}

	async run(interaction: MessageComponentInteraction) {
		const interactionFound = await Interactions.findOne({
			where: {
				messageID: interaction.message.id
			}
		});
		if (!interactionFound) {
			await interaction.reply({
				content: 'This is not a valid interaction to reply to.',
				ephemeral: true
			});
			return (interaction.message as Message).edit({ components: [] });
		}
		switch (interactionFound.type) {
			case EInteractionTypes.Voting:
				return proccessVoting(this.client, interaction as ButtonInteraction);
		}
	}
}
