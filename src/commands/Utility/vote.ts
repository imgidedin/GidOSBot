import { ButtonInteraction, Message, MessageActionRow, MessageButton } from 'discord.js';
import { objectEntries } from 'e';
import { CommandStore, KlasaClient, KlasaMessage } from 'klasa';

import { BitField, Emoji } from '../../lib/constants';
import { UserSettings } from '../../lib/settings/types/UserSettings';
import { BotCommand } from '../../lib/structures/BotCommand';
import { EInteractionTypes, Interactions } from '../../lib/typeorm/Interactions.entity';
import { Voting } from '../../lib/typeorm/Voting.entity';

export async function proccessVoting(client: KlasaClient, interaction: ButtonInteraction) {
	await interaction.deferUpdate();
	// Check if it is a valid voting
	const vote = await Voting.findOne({
		where: {
			messageID: interaction.message.id
		}
	});

	if (!vote) {
		await interaction.reply({
			content: 'Sorry, but this vote is either invalid or not active anymore.',
			ephemeral: true
		});
		return interaction.update({ components: [] });
	}

	const messageContent = interaction.message.content;
	const question = messageContent.substr(messageContent.indexOf('Question:') + 'Question:'.length).trim();

	// Valid voting
	if (['yes', 'no'].includes(interaction.customID)) {
		let replyMessage = `Vote Confirmation - Question: ${question}`;
		if (vote.votes[interaction.user.id] !== interaction.customID) {
			replyMessage += `\nYour vote was stored as ${interaction.customID.toLocaleUpperCase()}`;
			vote.votes[interaction.user.id] = interaction.customID;
		} else {
			replyMessage += '\nYou removed your vote.';
			delete vote.votes[interaction.user.id];
		}
		await vote.save();

		const votingButtons = (interaction.message.components as MessageActionRow[]).map(mar => {
			return mar.components.map(c => {
				if (c instanceof MessageButton) {
					if (c.customID === 'voteCount') c.label = `# of Votes: ${Object.keys(vote.votes).length}`;
				}
				return c;
			});
		});
		await interaction.user.send({ content: replyMessage });
		return (interaction.message as Message).edit({ components: votingButtons });
	}

	const canCheckData = (() => {
		const userBfs = interaction.user.settings.get(UserSettings.BitField);
		const isMod = userBfs.includes(BitField.isModerator);
		const isContrib = userBfs.includes(BitField.isModerator);
		const isOwner = client.owners.has(interaction.user);
		const isOP = interaction.user.id === vote.userID;
		if (isMod || isContrib || isOwner) return 1;
		if (isOP) return 2;
		return false;
	})();
	if (interaction.customID === 'data' && canCheckData) {
		const votesValues = Object.entries(vote.votes);
		const totalVotes = votesValues.length;
		const groupByVote: Record<string, { total: number; users: string[] }> = {};
		for (const [user, val] of votesValues) {
			if (!groupByVote[val]) groupByVote[val] = { total: 0, users: [] };
			groupByVote[val].total += 1;
			const _user = await client.users.fetch(user);
			if (canCheckData !== 2) groupByVote[val].users.push(_user ? _user.username : user);
		}
		await interaction.user.send({
			content: `**📊 VOTING RESULTS**\n\nQuestion: ${question}\nTotal Votes: ${totalVotes.toLocaleString()}\nVotes: ${objectEntries(
				groupByVote
			)
				.map(v => `${v[0]} - ${v[1].total} vote${v[1].total > 1 ? 's' : ''} [${v[1].users.join(', ')}]`)
				.join('\n')}`
		});
	}
}

export default class extends BotCommand {
	public constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {
			usage: '<question:string>',
			aliases: ['vote', 'newvote', 'voting', 'votesystem'],
			description: 'Add a new poll/vote',
			examples: ['+vote Should we do A or B? --options="A,B"'],
			categoryFlags: ['utility']
		});
	}

	async run(msg: KlasaMessage, [question]: [string]) {
		await msg.delete();
		const votingMessage = await msg.channel.send({
			content: `Question: ${question}`,
			components: [
				[
					new MessageButton({
						style: 'SUCCESS',
						label: 'Yes',
						emoji: Emoji.Happy,
						customID: 'yes',
						type: 'BUTTON',
						disabled: false
					}),
					new MessageButton({
						style: 'DANGER',
						label: 'No',
						emoji: Emoji.Sad,
						customID: 'no',
						type: 'BUTTON',
						disabled: false
					}),
					new MessageButton({
						style: 'SECONDARY',
						label: '# of Votes: 0',
						customID: 'voteCount',
						type: 'BUTTON',
						disabled: true
					}),
					new MessageButton({
						style: 'SECONDARY',
						label: 'Get Voting Data',
						emoji: Emoji.Spanner,
						customID: 'data',
						type: 'BUTTON',
						disabled: false
					})
				]
			]
		});
		// Save the interaction
		const interaction = new Interactions();
		interaction.messageID = votingMessage.id;
		interaction.type = EInteractionTypes.Voting;
		await interaction.save();

		// Save the vote
		const vote = new Voting();
		vote.userID = msg.author.id;
		vote.messageID = votingMessage.id;
		await vote.save();
	}
}
