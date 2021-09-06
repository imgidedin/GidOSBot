import { ButtonInteraction, Message, MessageComponentInteraction } from 'discord.js';
import { Event, EventStore } from 'klasa';

import { proccessVoting } from '../commands/Utility/vote';
import { EInteractionTypes, Interactions } from '../lib/typeorm/Interactions.entity';

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
				content: 'This is not a valid message you can interact with.',
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
