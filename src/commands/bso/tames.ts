import { Canvas, CanvasRenderingContext2D, createCanvas, Image } from 'canvas';
import { MessageAttachment } from 'discord.js';
import { calcWhatPercent, reduceNumByPercent, Time } from 'e';
import fs from 'fs';
import { CommandStore, KlasaClient, KlasaMessage, KlasaUser } from 'klasa';
import { Bank, Monsters } from 'oldschooljs';
import { ItemBank } from 'oldschooljs/dist/meta/types';

import { badges } from '../../lib/constants';
import { Eatables } from '../../lib/data/eatables';
import { requiresMinion } from '../../lib/minions/decorators';
import getUserFoodFromBank from '../../lib/minions/functions/getUserFoodFromBank';
import { KillableMonster } from '../../lib/minions/types';
import { ClientSettings } from '../../lib/settings/types/ClientSettings';
import { UserSettings } from '../../lib/settings/types/UserSettings';
import { BotCommand } from '../../lib/structures/BotCommand';
import { getUsersTame, tameSpecies } from '../../lib/tames';
import { TameActivityTable } from '../../lib/typeorm/TameActivityTable.entity';
import { TameGrowthStage, TamesTable } from '../../lib/typeorm/TamesTable.entity';
import {
	addBanks,
	formatDuration,
	itemNameFromID,
	patronMaxTripCalc,
	stringMatches,
	toTitleCase,
	updateBankSetting
} from '../../lib/util';
import { canvasImageFromBuffer, canvasToBufferAsync, fillTextXTimesInCtx } from '../../lib/util/canvasUtil';
import findMonster from '../../lib/util/findMonster';
import getOSItem from '../../lib/util/getOSItem';
import { parseStringBank } from '../../lib/util/parseStringBank';
import BankImageTask from '../../tasks/bankImage';

export const feedableItems = [
	[getOSItem('Ori'), '25% extra loot'],
	[getOSItem('Zak'), '+35 minutes longer max trip length'],
	[getOSItem('Abyssal cape'), '25% food reduction']
] as const;

function formatDurationSmall(ms: number) {
	if (ms < 0) ms = -ms;
	const time = {
		d: Math.floor(ms / 86_400_000),
		h: Math.floor(ms / 3_600_000) % 24,
		m: Math.floor(ms / 60_000) % 60,
		s: Math.floor(ms / 1000) % 60
	};
	let nums = Object.entries(time).filter(val => val[1] !== 0);
	if (nums.length === 0) return '1s';
	return nums.map(([key, val]) => `${val}${key}`).join(' ');
}

export async function removeRawFood({
	client,
	user,
	totalHealingNeeded,
	healPerAction,
	raw = false,
	monster,
	quantity,
	tame
}: {
	client: KlasaClient;
	user: KlasaUser;
	totalHealingNeeded: number;
	healPerAction: number;
	raw?: boolean;
	monster: KillableMonster;
	quantity: number;
	tame: TamesTable;
}): Promise<[string, ItemBank]> {
	await user.settings.sync(true);
	if (tame.hasBeenFed('Abyssal cape')) {
		totalHealingNeeded = Math.floor(totalHealingNeeded * 0.75);
		healPerAction = Math.floor(healPerAction * 0.75);
	}

	const foodToRemove = getUserFoodFromBank(user, totalHealingNeeded, raw);
	if (!foodToRemove) {
		throw `You don't have enough Raw food to feed your tame in this trip. You need enough food to heal at least ${totalHealingNeeded} HP (${healPerAction} per action). You can use these food items: ${Eatables.filter(
			i => i.raw
		)
			.map(i => itemNameFromID(i.raw!))
			.join(', ')}.`;
	} else {
		const itemCost = new Bank(foodToRemove);
		if (monster.itemCost) {
			itemCost.add(monster.itemCost.clone().multiply(quantity));
		}
		if (!user.owns(itemCost)) {
			throw `You don't have the required items, you need: ${itemCost}.`;
		}
		await user.removeItemsFromBank(itemCost);

		updateBankSetting(client, ClientSettings.EconomyStats.PVMCost, itemCost);

		return [`${itemCost} from ${user.username}`, itemCost.bank];
	}
}

export async function getTameStatus(user: KlasaUser) {
	const [, currentTask] = await getUsersTame(user);
	if (currentTask) {
		const currentDate = new Date().valueOf();
		switch (currentTask.type) {
			case 'pvm':
				return [
					`Killing ${currentTask.data.quantity.toLocaleString()}x ${
						Monsters.find(m => m.id === currentTask.data.monsterID)!.name
					}`,
					`${formatDurationSmall(currentTask.finishDate.valueOf() - currentDate)} remaining`
				];
		}
	}
	return ['Idle'];
}

let bankTask: BankImageTask | null = null;
// Split sprite into smaller images by coors and size
function getClippedRegion(image: Image | Canvas, x: number, y: number, width: number, height: number) {
	const canvas = createCanvas(0, 0);
	const ctx = canvas.getContext('2d');
	canvas.width = width;
	canvas.height = height;
	ctx.drawImage(image, x, y, width, height, 0, 0, width, height);
	return canvas;
}

function drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number) {
	const baseFill = ctx.fillStyle;
	ctx.fillStyle = '#000000';
	fillTextXTimesInCtx(ctx, text, x, y + 1);
	fillTextXTimesInCtx(ctx, text, x, y - 1);
	fillTextXTimesInCtx(ctx, text, x + 1, y);
	fillTextXTimesInCtx(ctx, text, x - 1, y);
	ctx.fillStyle = baseFill;
	fillTextXTimesInCtx(ctx, text, x, y);
}

async function getItem(item: number) {
	return bankTask?.getItemImage(item, 1).catch(() => {
		console.error(`Failed to load item image for item with id: ${item}`);
	});
}

export default class extends BotCommand {
	public tameSprites: {
		base?: {
			image: Image;
			slot: Canvas;
			selectedSlot: Canvas;
			shinyIcon: Canvas;
		};
		tames?: {
			id: number;
			name: string;
			image: Image;
			sprites: {
				type: number;
				growthStage: {
					[TameGrowthStage.Baby]: Canvas;
					[TameGrowthStage.Juvenile]: Canvas;
					[TameGrowthStage.Adult]: Canvas;
				};
			}[];
		}[];
	} = {};

	public constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {
			oneAtTime: true,
			altProtection: true,
			categoryFlags: ['minion'],
			description: 'Use to control and manage your tames.',
			examples: ['+tames k fire giant', '+tames', '+tames select 1', '+tames setname LilBuddy'],
			subcommands: true,
			usage: '[k|select|setname|feed|merge] [input:...str]',
			usageDelim: ' ',
			aliases: ['tame', 't']
		});
	}

	async init() {
		const tameSpriteBase = await canvasImageFromBuffer(
			fs.readFileSync('./src/lib/resources/images/tames/tame_sprite.png')
		);
		this.tameSprites.base = {
			image: tameSpriteBase,
			slot: getClippedRegion(tameSpriteBase, 0, 0, 256, 128),
			selectedSlot: getClippedRegion(tameSpriteBase, 0, 128, 256, 128),
			shinyIcon: getClippedRegion(tameSpriteBase, 256, 0, 24, 24)
		};
		this.tameSprites.tames = await Promise.all(
			tameSpecies.map(async value => {
				const tameImage = await canvasImageFromBuffer(
					fs.readFileSync(`./src/lib/resources/images/tames/${value.id}_sprite.png`)
				);
				const vars = [...value.variants];
				if (value.shinyVariant) vars.push(value.shinyVariant);
				return {
					id: value.id,
					name: value.name,
					image: tameImage,
					sprites: vars.map(v => {
						return {
							type: v,
							growthStage: {
								[TameGrowthStage.Baby]: getClippedRegion(tameImage, (v - 1) * 96, 0, 96, 96),
								[TameGrowthStage.Juvenile]: getClippedRegion(tameImage, (v - 1) * 96, 96, 96, 96),
								[TameGrowthStage.Adult]: getClippedRegion(tameImage, (v - 1) * 96, 96 * 2, 96, 96)
							}
						};
					})
				};
			})
		);
	}

	async setname(msg: KlasaMessage, [name = '']: [string]) {
		if (
			!name ||
			typeof name !== 'string' ||
			name.length < 2 ||
			name.length > 30 ||
			['\n', '`', '@', '<', ':'].some(char => name.includes(char))
		) {
			return msg.channel.send("That's not a valid name for your tame.");
		}
		const [selectedTame] = await getUsersTame(msg.author);
		if (!selectedTame) {
			return msg.channel.send('You have no selected tame to set a nickname for, select one first.');
		}
		selectedTame.nickname = name;
		await selectedTame.save();
		return msg.channel.send(`Updated the nickname of your selected tame to ${name}.`);
	}

	async tameList(msg: KlasaMessage) {
		if (this.client.owners.has(msg.author) && msg.flagArgs.reload) await this.init();
		const userTames = await TamesTable.find({
			where: {
				userID: msg.author.id
			},
			order: {
				id: 'ASC'
			}
		});

		if (userTames.length === 0) {
			return msg.channel.send("You don't have any tames.");
		}

		let mainTame: [TamesTable | undefined, TameActivityTable | undefined] | undefined = undefined;
		try {
			mainTame = await getUsersTame(msg.author);
		} catch (e) {}

		// Init the background images if they are not already
		if (!bankTask) bankTask = this.client.tasks.get('bankImage') as BankImageTask;

		let {
			sprite,
			uniqueSprite,
			background: userBgImage
		} = bankTask.getBgAndSprite(msg.author.settings.get(UserSettings.BankBackground) ?? 1);
		const hexColor = msg.author.settings.get(UserSettings.BankBackgroundHex);

		const tamesPerLine = 4;

		const canvas = createCanvas(
			12 + 10 + (256 + 10) * Math.min(userTames.length, tamesPerLine),
			12 + 10 + (128 + 10) * Math.ceil(userTames.length / tamesPerLine)
		);

		const ctx = canvas.getContext('2d');

		ctx.font = '16px OSRSFontCompact';
		ctx.imageSmoothingEnabled = false;

		ctx.fillStyle = userBgImage.transparent
			? hexColor
				? hexColor
				: 'transparent'
			: ctx.createPattern(sprite.repeatableBg, 'repeat');

		ctx.fillRect(0, 0, canvas.width, canvas.height);

		if (!uniqueSprite) {
			let imgHeight = 0;
			let imgWidth = 0;
			const ratio1 = canvas.height / userBgImage.image!.height;
			const ratio2 = canvas.width / userBgImage.image!.width;
			imgWidth = userBgImage.image!.width * (ratio1 > ratio2 ? ratio1 : ratio2);
			imgHeight = userBgImage.image!.height * (ratio1 > ratio2 ? ratio1 : ratio2);
			ctx.drawImage(
				userBgImage.image!,
				(canvas.width - imgWidth) / 2,
				(canvas.height - imgHeight) / 2,
				imgWidth,
				imgHeight
			);
		}

		if (!userBgImage.transparent) bankTask?.drawBorder(ctx, sprite, false);

		ctx.translate(16, 16);
		let i = 0;
		for (const tame of userTames) {
			let isTameActive = false;
			let selectedTame = mainTame && mainTame[0] && mainTame[0].id === tame.id;
			if (selectedTame) isTameActive = (await getTameStatus(msg.author)).length > 1;

			const x = i % tamesPerLine;
			const y = Math.floor(i / tamesPerLine);
			ctx.drawImage(
				selectedTame ? this.tameSprites.base!.selectedSlot : this.tameSprites.base!.slot,
				(10 + 256) * x,
				(10 + 128) * y,
				256,
				128
			);
			// Draw tame
			ctx.drawImage(
				this.tameSprites.tames!.find(t => t.id === tame.species.id)!.sprites.find(f => f.type === tame.variant)!
					.growthStage[tame.growthStage],
				(10 + 256) * x + (isTameActive ? 96 : 256 - 96) / 2,
				(10 + 128) * y + 10,
				96,
				96
			);

			// Draw tame name / level / stats
			ctx.fillStyle = '#ffffff';
			ctx.textAlign = 'left';
			drawText(
				ctx,
				`${tame.id}. ${tame.nickname ? `${tame.nickname} (${tame.species.name})` : tame.species.name}`,
				(10 + 256) * x + 5,
				(10 + 128) * y + 16
			);
			// Shiny indicator
			if (tame.variant === tame.species.shinyVariant) {
				ctx.drawImage(this.tameSprites.base!.shinyIcon, (10 + 256) * x + 5, (10 + 128) * y + 18, 16, 16);
				drawText(
					ctx,
					'Shiny!',
					(10 + 256) * x + 3 + this.tameSprites.base!.shinyIcon.width,
					(10 + 128) * y + 18 + this.tameSprites.base!.shinyIcon.height / 2
				);
			}

			ctx.textAlign = 'right';
			drawText(ctx, `Combat: ${tame.combatLvl}`, (10 + 256) * x + 256 - 5, (10 + 128) * y + 16);
			ctx.textAlign = 'right';
			drawText(ctx, `Artisan. ${tame.artisanLvl}`, (10 + 256) * x + 256 - 5, (10 + 128) * y + 128 - 5);
			ctx.textAlign = 'left';
			drawText(ctx, `Gatherer. ${tame.gathererLvl}`, (10 + 256) * x + 5, (10 + 128) * y + 128 - 5);
			ctx.textAlign = 'center';
			const grouthStage =
				tame.growthStage === 'adult'
					? tame.growthStage
					: `${tame.growthStage} (${tame.currentGrowthPercent.toFixed(2)}%)`;
			drawText(ctx, `${toTitleCase(grouthStage)}`, (10 + 256) * x + 256 / 2, (10 + 128) * y + 128 - 5);

			// Draw tame status (idle, in activity)
			if (selectedTame) {
				const mtText = await getTameStatus(msg.author);
				ctx.textAlign = 'right';
				for (let i = 0; i < mtText.length; i++) {
					drawText(ctx, mtText[i], (10 + 256) * x + 256 - 5, (10 + 128) * y + 28 + i * 12);
				}
			} else {
				ctx.textAlign = 'right';
				drawText(ctx, 'Not selected', (10 + 256) * x + 256 - 5, (10 + 128) * y + 28);
			}

			// Draw tame boosts
			let prevWidth = 0;
			let feedQty = 0;
			for (const [item] of feedableItems) {
				if (tame.fedItems[item.id]) {
					const itemImage = await getItem(item.id);
					if (itemImage) {
						let ratio = 19 / itemImage.height;
						const yLine = Math.floor(feedQty / 3);
						if (feedQty % 3 === 0) prevWidth = 0;
						ctx.drawImage(
							itemImage,
							(10 + 256) * x + 250 - prevWidth - Math.ceil(itemImage.width * ratio),
							(10 + 128) * y + 35 + 52 - yLine * 20,
							Math.floor(itemImage.width * ratio),
							Math.floor(itemImage.height * ratio)
						);

						prevWidth += Math.ceil(itemImage.width * ratio);
						feedQty++;
					}
				}
			}
			i++;
		}

		const rawBadges = msg.author.settings.get(UserSettings.Badges);
		const badgesStr = rawBadges.map(num => badges[num]).join(' ');

		return msg.channel.send({
			content: `${badgesStr}${msg.author.username}, ${
				userTames.length > 1 ? 'there are your tames' : 'this is your tame'
			}!`,
			files: [
				new MessageAttachment(
					await canvasToBufferAsync(canvas, 'image/png'),
					`${msg.author.username}_${msg.author.discriminator}_tames.png`
				)
			]
		});
	}

	@requiresMinion
	async run(msg: KlasaMessage, [input]: [string | undefined]) {
		if (input) {
			const allTames = await TamesTable.find({
				where: { userID: msg.author.id }
			});
			const tame = allTames.find(
				t => stringMatches(t.id.toString(), input) || stringMatches(t.nickname ?? '', input)
			);
			if (!tame) {
				return msg.channel.send('No matching tame found.');
			}
			return msg.channel.sendBankImage({
				content: `${tame!.toString()}`,
				flags: msg.flagArgs,
				bank: tame.totalLoot,
				title: `All Loot ${tame.name} Has Gotten You`
			});
		}
		return this.tameList(msg);
	}

	async select(msg: KlasaMessage, [str = '']: [string]) {
		const tames = await TamesTable.find({ where: { userID: msg.author.id } });
		const toSelect = tames.find(t => stringMatches(str, t.id.toString()) || stringMatches(str, t.nickname ?? ''));
		if (!toSelect) {
			return msg.channel.send("Couldn't find a tame to select.");
		}
		const [, currentTask] = await getUsersTame(msg.author);
		if (currentTask) {
			return msg.channel.send("You can't select a different tame, because your current one is busy.");
		}
		await msg.author.settings.update(UserSettings.SelectedTame, toSelect.id);
		return msg.channel.send(`You selected your ${toSelect.name}.`);
	}

	async feed(msg: KlasaMessage, [str = '']: [string]) {
		const [selectedTame] = await getUsersTame(msg.author);
		if (!selectedTame) {
			return msg.channel.send('You have no selected tame.');
		}

		let rawBank = parseStringBank(str);
		let bankToAdd = new Bank();
		let userBank = msg.author.bank();
		for (const [item, qty] of rawBank) {
			let qtyOwned = userBank.amount(item.id);
			if (qtyOwned === 0) continue;
			let qtyToUse = !qty ? 1 : qty > qtyOwned ? qtyOwned : qty;
			bankToAdd.add(item.id, qtyToUse);
		}
		if (!str || bankToAdd.length === 0) {
			return msg.channel.sendBankImage({
				bank: selectedTame.fedItems,
				title: 'Items Fed To This Tame',
				content: `The items which give a perk/usage when fed are: ${feedableItems
					.map(i => `${i[0].name} (${i[1]})`)
					.join(', ')}.`
			});
		}

		if (!userBank.fits(bankToAdd)) {
			return msg.channel.send("You don't have enough items.");
		}

		let specialStrArr = [];
		for (const [i, perk] of feedableItems) {
			if (bankToAdd.has(i.id)) {
				specialStrArr.push(`**${i.name}**: ${perk}`);
			}
		}
		let specialStr = specialStrArr.length === 0 ? '' : `\n\n${specialStrArr.join(', ')}`;
		await msg.confirm(
			`Are you sure you want to feed \`${bankToAdd}\` to ${selectedTame.name}? You **cannot** get these items back after they're eaten by your tame.${specialStr}`
		);
		await msg.author.removeItemsFromBank(bankToAdd);
		selectedTame.fedItems = addBanks([selectedTame.fedItems, bankToAdd.bank]);
		await selectedTame.save();
		return msg.channel.send(`You fed \`${bankToAdd}\` to ${selectedTame.name}.${specialStr}`);
	}

	async k(msg: KlasaMessage, [str = '']: [string]) {
		const [selectedTame, currentTask] = await getUsersTame(msg.author);
		if (!selectedTame) {
			return msg.channel.send('You have no selected tame.');
		}
		if (currentTask) {
			return msg.channel.send(`${selectedTame.name} is busy.`);
		}
		const monster = findMonster(str);
		if (!monster) {
			return msg.channel.send("That's not a valid monster.");
		}

		// Get the amount stronger than minimum, and set boost accordingly:
		const [speciesMinCombat, speciesMaxCombat] = selectedTame.species.combatLevelRange;
		// Example: If combat level is 80/100 with 70 min, give a 10% boost.
		const combatLevelBoost = calcWhatPercent(selectedTame.maxCombatLevel - speciesMinCombat, speciesMaxCombat);

		// Increase trip length based on minion growth:
		let speed = monster.timeToFinish * selectedTame.growthLevel;

		// Apply calculated boost:
		speed = reduceNumByPercent(speed, combatLevelBoost);

		let boosts = [];
		let maxTripLength = Time.Minute * 20 * (4 - selectedTame.growthLevel);
		if (selectedTame.hasBeenFed('Zak')) {
			maxTripLength += Time.Minute * 35;
			boosts.push('+35mins trip length (ate a Zak)');
		}
		maxTripLength += patronMaxTripCalc(msg.author) * 2;
		// Calculate monster quantity:
		const quantity = Math.floor(maxTripLength / speed);
		if (quantity < 1) {
			return msg.channel.send("Your tame can't kill this monster fast enough.");
		}
		const [foodStr] = await removeRawFood({
			client: this.client,
			totalHealingNeeded: (monster.healAmountNeeded ?? 1) * quantity,
			healPerAction: monster.healAmountNeeded ?? 1,
			raw: true,
			user: msg.author,
			monster,
			quantity,
			tame: selectedTame
		});
		const duration = Math.floor(quantity * speed);

		const activity = new TameActivityTable();
		activity.userID = msg.author.id;
		activity.startDate = new Date();
		activity.finishDate = new Date(Date.now() + duration);
		activity.completed = false;
		activity.type = 'pvm';
		activity.data = {
			type: 'pvm',
			monsterID: monster.id,
			quantity
		};
		activity.channelID = msg.channel.id;
		activity.duration = duration;
		activity.tame = selectedTame;
		await activity.save();

		return msg.channel.send(
			`${selectedTame.name} is now killing ${quantity}x ${monster.name}. The trip will take ${formatDuration(
				duration
			)}.\n\nRemoved ${foodStr}`
		);
	}

	async merge(msg: KlasaMessage, [tame = '']: [string]) {
		const tames = await TamesTable.find({ where: { userID: msg.author.id } });
		const toSelect = tames.find(t => stringMatches(tame, t.id.toString()) || stringMatches(tame, t.nickname ?? ''));
		if (!toSelect) return msg.channel.send("Couldn't find a tame to merge.");

		const [currentTame, currentTask] = await getUsersTame(msg.author);
		if (currentTask) return msg.channel.send('Your tame is busy. Wait for it to be free to do this.');
		if (currentTame!.species.id !== toSelect.species.id)
			return msg.channel.send("You can't merge different species of tames!");
		if (currentTame!.id === toSelect.id) return msg.channel.send('You can not merge your tame into itself!');

		const mergeStuff = {
			totalLoot: new Bank(currentTame!.totalLoot).add(toSelect.totalLoot).bank,
			fedItems: new Bank(currentTame!.fedItems).add(toSelect.fedItems).bank,
			maxCombatLevel: Math.max(currentTame!.maxCombatLevel, toSelect.maxCombatLevel),
			maxArtisanLevel: Math.max(currentTame!.maxArtisanLevel, toSelect.maxArtisanLevel),
			maxGathererLevel: Math.max(currentTame!.maxGathererLevel, toSelect.maxGathererLevel),
			maxSupportLevel: Math.max(currentTame!.maxSupportLevel, toSelect.maxSupportLevel)
		};

		delete msg.flagArgs.cf;
		delete msg.flagArgs.confirm;

		await msg.confirm(
			`Are you sure you want to merge **${toSelect.name}** (Tame ID: ${toSelect.id}) into **${
				currentTame!.name
			}** (Tame ID: ${currentTame!.id})?\n\n${
				currentTame!.name
			} will receive all the items fed and all loot obtained from ${
				toSelect.name
			}, and will have its stats match the highest of both tames.\n\n**THIS ACTION CAN NOT BE REVERSED!**`
		);

		// Set the merged tame activities to the tame that is consuming it
		await TameActivityTable.update(
			{
				tame: toSelect.id
			},
			{
				tame: currentTame!.id
			}
		);
		// Delete merged tame
		await TamesTable.delete({
			id: toSelect.id
		});

		await TamesTable.update(
			{
				id: currentTame!.id
			},
			{
				totalLoot: mergeStuff.totalLoot,
				fedItems: mergeStuff.fedItems,
				maxCombatLevel: mergeStuff.maxCombatLevel,
				maxArtisanLevel: mergeStuff.maxArtisanLevel,
				maxGathererLevel: mergeStuff.maxGathererLevel,
				maxSupportLevel: mergeStuff.maxSupportLevel
			}
		);

		return msg.channel.send(`${currentTame!.name} consumed ${toSelect.name} and all its attributes.`);
	}
}
