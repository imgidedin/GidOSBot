import { randArrItem, Time } from 'e';
import { CommandStore, KlasaMessage } from 'klasa';
import { Bank } from 'oldschooljs';

import { Activity } from '../../lib/constants';
import { minionNotBusy, requiresMinion } from '../../lib/minions/decorators';
import {
	fightingMessages,
	getMonkeyPhrase,
	getRandomMonkey,
	monkeyHeadImage,
	monkeyTierOfUser,
	monkeyTiers,
	TOTAL_MONKEYS
} from '../../lib/monkeyRumble';
import { UserSettings } from '../../lib/settings/types/UserSettings';
import { SkillsEnum } from '../../lib/skilling/types';
import { BotCommand } from '../../lib/structures/BotCommand';
import { MonkeyRumbleOptions } from '../../lib/types/minions';
import { stringMatches } from '../../lib/util';
import addSubTaskToActivityTask from '../../lib/util/addSubTaskToActivityTask';
import chatHeadImage from '../../lib/util/chatHeadImage';

const buyables = monkeyTiers.map((t, index) => ({
	item: t.greegree,
	gamesReq: t.gamesReq,
	strengthLevelReq: t.strengthLevelReq,
	cost: (index + 1) * 100,
	aliases: [t.name, t.greegree.name]
}));

export default class extends BotCommand {
	public constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {
			oneAtTime: true,
			altProtection: true,
			categoryFlags: ['minion', 'pvm', 'minigame'],
			description: 'Sends your minion to do barbarian assault, or buy rewards and gamble.',
			examples: ['+barbassault [start]'],
			subcommands: true,
			usage: '[start|level|buy] [buyableOrGamble:...string]',
			usageDelim: ' ',
			aliases: ['mr', 'mmr', 'rumble']
		});
	}

	@requiresMinion
	async run(msg: KlasaMessage) {
		const tier = monkeyTiers.find(t => t.id === monkeyTierOfUser(msg.author))!;
		return msg.channel.send(
			`Monkeys fought: ${msg.author.settings.get(UserSettings.MonkeysFought).length}/${TOTAL_MONKEYS}
Greegree Level: ${tier.id}/${monkeyTiers.length}`
		);
	}

	async buy(msg: KlasaMessage, [input = '']: [string]) {
		const buyable = buyables.find(i => stringMatches(input, i.item.name));
		if (!buyable) {
			return msg.channel.send(
				`Here are the items you can buy: \n\n${buyables
					.map(i => `**${i.item.name}:** ${i.cost} points`)
					.join('\n')}.`
			);
		}

		if (msg.author.skillLevel(SkillsEnum.Strength) < buyable.strengthLevelReq) {
			return msg.channel.send(`You need atleast level ${buyable.strengthLevelReq} Strength to buy this.`);
		}

		const score = await msg.author.getMinigameScore('MadMarimbosMonkeyRumble');
		if (score < buyable.gamesReq) {
			return msg.channel.send(
				`You need to have completed atleast ${
					buyable.gamesReq
				} rumble matches before you can buy this, you have ${buyable.gamesReq - score} remaining.`
			);
		}

		const { item, cost } = buyable;
		const bank = msg.author.bank();
		const balance = bank.amount('Rumble token');
		if (balance < cost) {
			return msg.channel.send(
				`You don't have enough Rumble tokens to buy the ${item.name}. You need ${cost}, but you have only ${balance}.`
			);
		}

		await msg.author.removeItemsFromBank(new Bank().add('Rumble token', cost));
		await msg.author.addItemsToBank({ [item.id]: 1 }, true);

		return msg.channel.send(`Successfully purchased 1x ${item.name} for ${cost} Rumble tokens.`);
	}

	@minionNotBusy
	@requiresMinion
	async start(msg: KlasaMessage) {
		if (!msg.author.hasItemEquippedAnywhere("M'speak amulet")) {
			return msg.channel.send({
				files: [
					await chatHeadImage({
						head: 'placeHolderName',
						content: getMonkeyPhrase()
					})
				]
			});
		}

		const monkey = getRandomMonkey();

		const fightDuration = Time.Minute * 5;
		const quantity = Math.floor(msg.author.maxTripLength(Activity.MonkeyRumble) / fightDuration);
		const duration = quantity * fightDuration;

		await addSubTaskToActivityTask<MonkeyRumbleOptions>({
			userID: msg.author.id,
			channelID: msg.channel.id,
			quantity,
			duration,
			type: Activity.MonkeyRumble,
			minigameID: 'MadMarimbosMonkeyRumble',
			monkey
		});

		if (!msg.author.settings.get(UserSettings.MonkeysFought).includes(monkey.nameKey)) {
			await msg.author.settings.update(UserSettings.MonkeysFought, monkey.nameKey);
		}

		return msg.channel.send({
			content: `You are fighting ${quantity}x rounds with ${monkey.name}.`,
			files: [await monkeyHeadImage({ monkey, content: randArrItem(fightingMessages) })]
		});
	}
}
