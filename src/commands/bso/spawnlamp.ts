import { MessageEmbed } from 'discord.js';
import { randInt, Time } from 'e';
import { CommandStore, KlasaMessage } from 'klasa';
import { convertLVLtoXP } from 'oldschooljs/dist/util';

import { BitField, Channel, Color, PerkTier, SupportServer } from '../../lib/constants';
import { UserSettings } from '../../lib/settings/types/UserSettings';
import { BotCommand } from '../../lib/structures/BotCommand';
import { formatDuration } from '../../lib/util';
import { LampTable } from '../../lib/xpLamps';

export default class extends BotCommand {
	public constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {
			oneAtTime: true
		});
	}

	async run(msg: KlasaMessage) {
		const bf = msg.author.settings.get(UserSettings.BitField);

		const hasPerm = bf.includes(BitField.HasPermanentSpawnLamp);
		const hasTier5 = msg.author.perkTier >= PerkTier.Five;
		const hasTier4 = !hasTier5 && msg.author.perkTier === PerkTier.Four;

		if (!hasPerm && !hasTier5 && !hasTier4) {
			return;
		}

		if (!msg.guild || msg.guild.id !== SupportServer) {
			return msg.channel.send('You can only do this in the Oldschool.gg server.');
		}

		if (![Channel.BSOChannel, Channel.General, Channel.BSOGeneral].includes(msg.channel.id)) {
			return msg.channel.send("You can't use spawnlamp in this channel.");
		}

		const currentDate = Date.now();
		const lastDate = msg.author.settings.get(UserSettings.LastSpawnLamp);
		const difference = currentDate - lastDate;

		let cooldown = [PerkTier.Six, PerkTier.Five].includes(msg.author.perkTier) ? Time.Hour * 12 : Time.Hour * 24;

		if (!hasTier5 && !hasTier4 && hasPerm) {
			cooldown = Time.Hour * 48;
		}

		//                                                                                      Kyra user
		if (difference < cooldown && !(this.client.owners.has(msg.author) || msg.author.id === '242043489611808769')) {
			const duration = formatDuration(Date.now() - (lastDate + cooldown));
			return msg.channel.send(`You can spawn another lamp in ${duration}.`);
		}
		await msg.author.settings.update(UserSettings.LastSpawnLamp, currentDate);

		const level = randInt(1, 99);
		const xp = randInt(convertLVLtoXP(level), convertLVLtoXP(level + 1) - 1);

		const embed = new MessageEmbed()
			.setColor(Color.Orange)
			.setThumbnail('https://static.runelite.net/cache/item/icon/11157.png')
			.setTitle(
				`Answer me this, for a random XP Lamp! What level would you be at with ${xp.toLocaleString()} XP?`
			);

		await msg.channel.send({ embeds: [embed] });

		try {
			const collected = await msg.channel.awaitMessages({
				max: 1,
				time: 14_000,
				errors: ['time'],
				filter: _msg =>
					_msg.content === level.toString() &&
					(!_msg.author.isIronman || (_msg.author.isIronman && _msg.author.id === msg.author.id))
			});

			const col = collected.first();
			if (!col) return;
			const winner = col.author!;
			const box = LampTable.roll();
			await winner.addItemsToBank(box);
			return msg.channel.send(
				`Congratulations, ${winner}! You got it! It was: ${level}. I've given you: **${box}**.`
			);
		} catch (err) {
			return msg.channel.send('Nobody got it! :(');
		}
	}
}
