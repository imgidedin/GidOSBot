import { CommandStore, KlasaMessage } from 'klasa';

import { UserSettings } from '../../lib/settings/types/UserSettings';
import { BotCommand } from '../../lib/structures/BotCommand';
import { ActivityTable } from '../../lib/typeorm/ActivityTable.entity';
import { GiveawayTable } from '../../lib/typeorm/GiveawayTable.entity';
import { MinigameTable } from '../../lib/typeorm/MinigameTable.entity';
import { PoHTable } from '../../lib/typeorm/PoHTable.entity';
import { XPGainsTable } from '../../lib/typeorm/XPGainsTable.entity';

export default class extends BotCommand {
	public constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {
			oneAtTime: true,
			cooldown: 1
		});
	}

	async run(msg: KlasaMessage) {
		/**
		 * If the user is an ironman already, lets ask them if they want to de-iron.
		 */
		if (msg.author.isIronman) {
			return msg.channel.send("You're already an ironman.");
		}

		if (msg.author.minionIsBusy) {
			return msg.channel.send('Your minion is still on a trip.');
		}

		const existingGiveaways = await GiveawayTable.find({
			userID: msg.author.id,
			completed: false
		});

		if (existingGiveaways.length !== 0) {
			return msg.channel.send("You can't become an ironman because you have active giveaways.");
		}

		await msg.channel.send(
			`Are you sure you want to start over and play as an ironman?
:warning: **Read the following text before confirming. This is your only warning. ** :warning:
The following things will be COMPLETELY reset/wiped from your account, with no chance of being recovered: Your entire bank, collection log, GP/Coins, QP/Quest Points, Clue Scores, Monster Scores, all XP. If you type \`confirm\`, they will all be wiped.
After becoming an ironman:
	- You will no longer be able to receive GP from  \`=daily\`
	- You will no longer be able to use \`=pay\`, \`=duel\`, \`=sellto\`, \`=sell\`, \`=dice\`, \`=gri\`
	- You **cannot** de-iron, it is PERMANENT.
    - Your entire BSO account, EVERYTHING, will be reset.
Type \`confirm permanent ironman\` if you understand the above information, and want to become an ironman now.`
		);

		try {
			await msg.channel.awaitMessages({
				max: 1,
				time: 15000,
				errors: ['time'],
				filter: answer => answer.author.id === msg.author.id && answer.content === 'confirm permanent ironman'
			});

			msg.author.log(
				`just became an ironman, previous settings: ${JSON.stringify(msg.author.settings.toJSON())}`
			);

			await msg.author.settings.reset();

			try {
				await PoHTable.delete({ userID: msg.author.id });
				await MinigameTable.delete({ userID: msg.author.id });
				await ActivityTable.delete({ userID: msg.author.id });
				await XPGainsTable.delete({ userID: msg.author.id });
			} catch (_) {}

			await msg.author.settings.update([
				[UserSettings.Minion.Ironman, true],
				[UserSettings.Minion.HasBought, true]
			]);
			return msg.channel.send('You are now an ironman.');
		} catch (err) {
			return msg.channel.send('Cancelled ironman swap.');
		}
	}
}
