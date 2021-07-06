import { Time } from 'e';
import LootTable from 'oldschooljs/dist/structures/LootTable';

import { GearSetupTypes, GearStat } from './gear/types';
import { GrimyHerbTable } from './minions/data/killableMonsters/custom/Treebeard';
import { KillableMonster } from './minions/types';
import { SeedTable } from './simulation/seedTable';
import resolveItems from './util/resolveItems';
import { makeKillTable } from './util/setCustomMonster';

export const allKalphiteKingItems = resolveItems([
	'Drygore mace',
	'Offhand drygore mace',
	'Drygore longsword',
	'Offhand drygore longsword',
	'Drygore rapier',
	'Offhand drygore rapier',
	'Perfect chitin',
	'Baby kalphite king'
]);

export const KalphiteKingMonster: KillableMonster = {
	id: 23483,
	name: 'Kalphite King',
	aliases: ['kk'],
	timeToFinish: Time.Minute * 25,
	notifyDrops: allKalphiteKingItems,
	table: {
		kill: makeKillTable(
			new LootTable()
				.tertiary(80, 'Clue scroll (grandmaster)')
				.tertiary(6000, 'Baby kalphite king')
				.tertiary(2500, 'Perfect chitin')
				.tertiary(
					150,
					new LootTable()
						.add('Drygore rapier')
						.add('Drygore longsword')
						.add('Drygore mace')
						.add('Offhand drygore rapier')
						.add('Offhand drygore longsword')
						.add('Offhand drygore mace')
				)
				.add(GrimyHerbTable)
				.add(SeedTable)
				.add('Super restore(4)', [1, 5])
				.add('Coins', [100_000, 2_000_000])
		)
	},
	emoji: '',
	wildy: false,
	difficultyRating: 10,
	qpRequired: 0,
	groupKillable: true,
	respawnTime: Time.Second * 10,
	levelRequirements: {
		prayer: 95,
		attack: 90,
		strength: 90,
		defence: 90
	},
	healAmountNeeded: 120 * 20,
	attackStyleToUse: GearStat.AttackCrush,
	attackStylesUsed: [GearStat.AttackCrush],
	minimumGearRequirements: {
		[GearSetupTypes.Melee]: {
			[GearStat.AttackCrush]: 8 + 12 + 12 + 6 + 16 + 95
		}
	}
};
