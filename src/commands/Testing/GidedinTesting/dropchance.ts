import { MessageAttachment } from 'discord.js';
import { objectEntries } from 'e';
import { CommandStore, KlasaMessage } from 'klasa';
import { LootTable, Monsters } from 'oldschooljs';
import { LootTableItem } from 'oldschooljs/dist/meta/types';
import SimpleMonster from 'oldschooljs/dist/structures/SimpleMonster';
import { table } from 'table';

import { BotCommand } from '../../../lib/structures/BotCommand';
import { addArrayOfNumbers, cleanString, stringMatches } from '../../../lib/util';
import getOSItem from '../../../lib/util/getOSItem';

interface IItemData {
	qty: number | number[];
	type?: 'Always' | 'Tertiary';
	chance: number;
}
type TToReturn = Record<number, IItemData[]>;

function addItems(toReturn: TToReturn, item: number, chance: IItemData[]) {
	if (toReturn[item]) {
		for (const data of chance) {
			if (data.type === 'Always' && data.chance === 1) {
				const found = toReturn[item].find(f => f.type === 'Always' && f.chance === 1)!;
				if (found) {
					if (found.chance === 1 && data.chance === 1) {
						if (typeof found.qty === 'number') found.qty = [found.qty];
						if (typeof data.qty === 'number') found.qty.push(data.qty);
						else found.qty.push(...data.qty);
						found.qty = found.qty.reduce((p, c) => p + c);
					} else if (found.chance !== 1) found.type = undefined;
					continue;
				}
			}
			toReturn[item].push(data);
		}
	} else toReturn[item] = chance;
}

function generateLoot(param: {
	toReturn: TToReturn;
	data: number | LootTable | LootTableItem[];
	itemChance: number;
	failedChance?: number;
	quantity: number | number[];
	type?: 'Always' | 'Tertiary';
}) {
	if (param.data instanceof LootTable) {
		for (const [_item, _chance] of objectEntries(generateLootTable(param.data, param.itemChance))) {
			addItems(param.toReturn, _item, _chance);
		}
	} else if (Array.isArray(param.data)) {
		for (const arrayItem of param.data) {
			generateLoot({
				toReturn: param.toReturn,
				data: arrayItem.item,
				itemChance: param.itemChance,
				failedChance: param.failedChance,
				type: param.type,
				quantity: param.quantity
			});
		}
	} else {
		addItems(param.toReturn, param.data, [
			{ chance: param.itemChance * (param.failedChance ?? 1), qty: param.quantity, type: param.type }
		]);
	}
}

function generateLootTable(table: LootTable, baseChance: number) {
	const toReturn: TToReturn = {};
	const totalWeight = table.limit || table.totalWeight;
	// Check oneIn
	let chanceFailOneIns = 1;
	for (const oneIn of table.oneInItems) chanceFailOneIns *= 1 - 1 / oneIn.chance;
	// Check Every
	for (const data of table.everyItems)
		generateLoot({ toReturn, data: data.item, quantity: data.quantity, itemChance: baseChance, type: 'Always' });
	// Tertiary
	for (const data of table.tertiaryItems)
		generateLoot({
			toReturn,
			data: data.item,
			quantity: data.quantity,
			itemChance: (1 / data.chance) * baseChance,
			type: 'Tertiary'
		});
	// Check Normal
	for (const data of table.table) {
		const thisItemChance = (data.weight ?? 1) / totalWeight;
		generateLoot({
			toReturn,
			data: data.item,
			quantity: data.quantity,
			itemChance: thisItemChance * baseChance,
			failedChance: chanceFailOneIns
		});
	}
	// Check oneIn
	let failedItemChance = baseChance;
	for (const data of table.oneInItems) {
		const thisItemChance = failedItemChance * (1 / data.chance);
		failedItemChance *= 1 - 1 / data.chance;
		generateLoot({
			toReturn,
			data: data.item,
			quantity: data.quantity,
			itemChance: thisItemChance * baseChance,
			failedChance: chanceFailOneIns
		});
	}

	return toReturn;
}

function round(number: number, pow: number = 4) {
	const rounding = Math.pow(10, pow);
	return Math.round((number + Number.EPSILON) * rounding) / rounding;
}

export default class extends BotCommand {
	public constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {
			usage: '<monster:string>'
		});
	}

	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	async run(msg: KlasaMessage, [_monster]: [string, string]) {
		let monster = Monsters.find(
			e => stringMatches(e.name, _monster) || e.aliases.some(a => stringMatches(a, _monster))
		) as SimpleMonster;
		if (!monster) {
		}
		if (monster) {
			if (!monster.table) {
				return msg.channel.send(`**${monster.name}** does have a loot table configured.`);
			}

			// --------------------------------------------------------
			// --------------------------------------------------------
			// --------------------------------------------------------
			const lootTable = generateLootTable(monster.table, 1);
			const toReturn: { id: number; item: string; chances: number; qty: string[]; type: string }[] = [];
			let averageValuePerKill = 0;
			for (const [lootItem, chances] of objectEntries(lootTable)) {
				const thisItem = getOSItem(lootItem)!;
				averageValuePerKill += chances
					.map(
						c =>
							c.chance *
							thisItem.price *
							// Multiply by the qty dropped or average if multiple
							(typeof c.qty === 'number' ? c.qty : addArrayOfNumbers(c.qty) / c.qty.length)
					)
					.reduce((p, c) => p + c);
				const _data = {
					id: lootItem,
					item: thisItem.name,
					chances:
						Math.min(
							1,
							chances.map(c => c.chance).reduce((p, c) => p + c)
						) * 100,
					qty: [
						...new Set(
							// This ts-ignore is here to disable the error on the index (i) variable for not being used
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-ignore
							chances.map((c, i, a) => {
								let qtyStr = '';
								if (typeof c.qty === 'number') {
									qtyStr = c.qty.toLocaleString();
								} else {
									qtyStr = c.qty.map(q => q.toLocaleString()).join(' - ');
								}
								if (!c.type && a.length > 1) qtyStr += ` (${(c.chance * 100).toFixed(4)}%)`;
								return qtyStr;
							})
						)
					],
					type: [...new Set(chances.map(c => c.type))].filter(f => f).join(', ')
				};
				toReturn.push(_data);
			}

			const monsterTable: string[][] = [];
			for (const data of toReturn.sort((a, b) => b.type.localeCompare(a.type) | (b.chances - a.chances))) {
				const oneIn = Math.ceil((1 / data.chances) * 100);
				monsterTable.push([
					data.item,
					data.qty.join(', '),
					`${round(data.chances)}%`,
					`${oneIn.toLocaleString()}`,
					data.type
				]);
			}

			let content = `**${
				monster.name
			}** - Loot Table\n<:RSGP:369349580040437770> **Average value per kill**: ${Math.floor(
				averageValuePerKill
			).toLocaleString()}`;

			const normalTable = table([['Item', 'Quantity', '%', '1 in X Kills', 'Drop Type'], ...monsterTable]);
			return msg.author.send({
				content,
				files: [
					new MessageAttachment(
						Buffer.from(normalTable),
						`${cleanString(monster.name)}_lootTable.txt`.toLowerCase()
					)
				]
			});

			// --------------------------------------------------------
			// --------------------------------------------------------
			// --------------------------------------------------------
		}
		return msg.channel.send(`**${_monster}** is not a valid monster.`.trim());
	}
}
