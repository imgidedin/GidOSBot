import { Time } from 'e';
import { CommandStore, KlasaMessage } from 'klasa';

import { Activity } from '../../lib/constants';
import { minionNotBusy, requiresMinion } from '../../lib/minions/decorators';
import { ClientSettings } from '../../lib/settings/types/ClientSettings';
import { UserSettings } from '../../lib/settings/types/UserSettings';
import Agility from '../../lib/skilling/skills/agility';
import { SkillsEnum } from '../../lib/skilling/types';
import { BotCommand } from '../../lib/structures/BotCommand';
import { AgilityActivityTaskOptions } from '../../lib/types/minions';
import { formatDuration, stringMatches, updateBankSetting } from '../../lib/util';
import addSubTaskToActivityTask from '../../lib/util/addSubTaskToActivityTask';
import { calculateAlchItemByTripDuration } from './alch';

function alching(msg: KlasaMessage, tripLength: number) {
	if (msg.author.skillLevel(SkillsEnum.Magic) < 55) return null;
	return calculateAlchItemByTripDuration({
		user: msg.author,
		duration: tripLength,
		calculateByRunesOwned: true
	});
}

export default class extends BotCommand {
	public constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {
			altProtection: true,
			oneAtTime: true,
			cooldown: 1,
			usage: '[quantity:int{1}|name:...string] [name:...string]',
			usageDelim: ' ',
			description: 'Sends your minion to do laps of an agility course.',
			examples: ['+laps gnome', '+laps 5 draynor'],
			categoryFlags: ['minion', 'skilling']
		});
	}

	@requiresMinion
	@minionNotBusy
	async run(msg: KlasaMessage, [quantity, name = '']: [null | number | string, string]) {
		if (typeof quantity === 'string') {
			name = quantity;
			quantity = null;
		}

		const course = Agility.Courses.find(course => course.aliases.some(alias => stringMatches(alias, name)));

		if (!course) {
			return msg.channel.send(
				`Thats not a valid course. Valid courses are ${Agility.Courses.map(course => course.name).join(', ')}.`
			);
		}

		if (msg.author.skillLevel(SkillsEnum.Agility) < course.level) {
			return msg.channel.send(
				`${msg.author.minionName} needs ${course.level} agility to train at ${course.name}.`
			);
		}

		if (course.qpRequired && msg.author.settings.get(UserSettings.QP) < course.qpRequired) {
			return msg.channel.send(`You need atleast ${course.qpRequired} Quest Points to do this course.`);
		}

		const maxTripLength = msg.author.maxTripLength(Activity.Agility);

		// If no quantity provided, set it to the max.
		const timePerLap = course.lapTime * Time.Second;
		if (quantity === null) {
			quantity = Math.floor(maxTripLength / timePerLap);
		}
		const duration = quantity * timePerLap;

		if (duration > maxTripLength) {
			return msg.channel.send(
				`${msg.author.minionName} can't go on trips longer than ${formatDuration(
					maxTripLength
				)}, try a lower quantity. The highest amount of ${course.name} laps you can do is ${Math.floor(
					maxTripLength / timePerLap
				)}.`
			);
		}

		let response = `${msg.author.minionName} is now doing ${quantity}x ${
			course.name
		} laps, it'll take around ${formatDuration(duration)} to finish.`;

		const alchResult = course.name === 'Ape Atoll Agility Course' ? false : alching(msg, duration);
		if (alchResult) {
			const removedItems = alchResult.items.clone().add(alchResult.runes);
			await msg.author.removeItemsFromBank(removedItems);
			response += `\n\nYour minion is alching ${alchResult.items} while training. Removed ${alchResult.runes} from your bank.`;
			updateBankSetting(this.client, ClientSettings.EconomyStats.MagicCostBank, removedItems);
		}

		await addSubTaskToActivityTask<AgilityActivityTaskOptions>({
			courseID: course.name,
			userID: msg.author.id,
			channelID: msg.channel.id,
			quantity,
			duration,
			type: Activity.Agility,
			alch: alchResult ? alchResult.items.bank : null
		});

		return msg.channel.send(response);
	}
}
