import { MessageButton, MessageSelectMenu } from 'discord.js';
import { objectEntries, objectKeys, randArrItem, Time } from 'e';
import { CommandStore, KlasaMessage, KlasaUser } from 'klasa';
import { Bank } from 'oldschooljs';
import { resolveBank } from 'oldschooljs/dist/util';

import { Emoji, skillEmoji } from '../../lib/constants';
import { minionNotBusy, requiresMinion } from '../../lib/minions/decorators';
import { UserSettings } from '../../lib/settings/types/UserSettings';
import { SkillsEnum } from '../../lib/skilling/types';
import { BotCommand } from '../../lib/structures/BotCommand';
import { ItemBank, Skills } from '../../lib/types';
import { formatSkillRequirements, stringMatches } from '../../lib/util';

export const enum Quests {
	Grandfathered = 0,
	CooksAssistant = 1000,
	DemonSlayer = 2000,
	TheRestlessGhost = 3000,
	RomeoAndJuliet = 4000,
	SheepShearer = 5000,
	ShieldofArrav = 6000,
	ErnesttheChicken = 7000,
	VampyreSlayer = 8000,
	ImpCatcher = 9000,
	PrinceAliRescue = 10_000,
	DoricsQuest = 11_000,
	BlackKnightsFortress = 12_000,
	WitchsPotion = 13_000,
	TheKnightsSword = 14_000,
	GoblinDiplomacy = 15_000,
	PiratesTreasure = 16_000,
	DragonSlayerI = 17_000,
	DruidicRitual = 18_000,
	LostCity = 19_000,
	WitchsHouse = 20_000,
	MerlinsCrystal = 21_000,
	HeroesQuest = 22_000,
	ScorpionCatcher = 23_000,
	FamilyCrest = 24_000,
	TribalTotem = 25_000,
	FishingContest = 26_000,
	MonksFriend = 27_000,
	TempleofIkov = 28_000,
	ClockTower = 29_000,
	HolyGrail = 30_000,
	TreeGnomeVillage = 31_000,
	FightArena = 32_000,
	HazeelCult = 33_000,
	SheepHerder = 34_000,
	PlagueCity = 35_000,
	SeaSlug = 36_000,
	WaterfallQuest = 37_000,
	Biohazard = 38_000,
	JunglePotion = 39_000,
	TheGrandTree = 40_000,
	ShiloVillage = 41_000,
	UndergroundPass = 42_000,
	ObservatoryQuest = 43_000,
	TheTouristTrap = 44_000,
	Watchtower = 45_000,
	DwarfCannon = 46_000,
	MurderMystery = 47_000,
	TheDigSite = 48_000,
	GertrudesCat = 49_000,
	LegendsQuest = 50_000,
	RuneMysteries = 51_000,
	BigChompyBirdHunting = 52_000,
	ElementalWorkshopI = 53_000,
	PriestinPeril = 54_000,
	NatureSpirit = 55_000,
	DeathPlateau = 56_000,
	TrollStronghold = 57_000,
	TaiBwoWannaiTrio = 58_000,
	Regicide = 59_000,
	EadgarsRuse = 60_000,
	ShadesofMortton = 61_000,
	TheFremennikTrials = 62_000,
	HorrorfromtheDeep = 63_000,
	ThroneofMiscellania = 64_000,
	MonkeyMadnessI = 65_000,
	HauntedMine = 66_000,
	TrollRomance = 67_000,
	InSearchoftheMyreque = 68_000,
	CreatureofFenkenstrain = 69_000,
	RovingElves = 70_000,
	GhostsAhoy = 71_000,
	OneSmallFavour = 72_000,
	MountainDaughter = 73_000,
	BetweenaRock = 74_000,
	TheFeud = 75_000,
	TheGolem = 76_000,
	DesertTreasure = 77_000,
	IcthlarinsLittleHelper = 78_000,
	TearsofGuthix = 79_000,
	ZogreFleshEaters = 80_000,
	TheLostTribe = 81_000,
	TheGiantDwarf = 82_000,
	RecruitmentDrive = 83_000,
	MourningsEndPartI = 84_000,
	ForgettableTaleofaDrunkenDwarf = 85_000,
	GardenofTranquillity = 86_000,
	ATailofTwoCats = 87_000,
	Wanted = 88_000,
	MourningsEndPartII = 89_000,
	RumDeal = 90_000,
	ShadowoftheStorm = 91_000,
	MakingHistory = 92_000,
	Ratcatchers = 93_000,
	SpiritsoftheElid = 94_000,
	DeviousMinds = 95_000,
	TheHandintheSand = 96_000,
	EnakhrasLament = 97_000,
	CabinFever = 98_000,
	FairyTaleIGrowingPains = 99_000,
	RecipeforDisaster = 100_000,
	RecipeforDisasterDwarf = 100_100,
	RecipeforDisasterGoblin = 100_200,
	RecipeforDisasterPirate = 100_300,
	RecipeforDisasterGuide = 100_400,
	RecipeforDisasterDave = 100_500,
	RecipeforDisasterMonkey = 100_600,
	RecipeforDisasterSirAmik = 100_700,
	RecipeforDisasterSkrach = 100_800,
	RecipeforDisasterCooks = 100_900,
	InAidoftheMyreque = 101_000,
	ASoulsBane = 102_000,
	RagandBoneManI = 103_000,
	RagandBoneManII = 104_000,
	SwanSong = 105_000,
	RoyalTrouble = 106_000,
	DeathtotheDorgeshuun = 107_000,
	FairyTaleIICureaQueen = 108_000,
	LunarDiplomacy = 109_000,
	TheEyesofGlouphrie = 110_000,
	DarknessofHallowvale = 111_000,
	TheSlugMenace = 112_000,
	ElementalWorkshopII = 113_000,
	MyArmsBigAdventure = 114_000,
	EnlightenedJourney = 115_000,
	EaglesPeak = 116_000,
	AnimalMagnetism = 117_000,
	Contact = 118_000,
	ColdWar = 119_000,
	TheFremennikIsles = 120_000,
	TowerofLife = 121_000,
	TheGreatBrainRobbery = 122_000,
	WhatLiesBelow = 123_000,
	OlafsQuest = 124_000,
	AnotherSliceofHAM = 125_000,
	DreamMentor = 126_000,
	GrimTales = 127_000,
	KingsRansom = 128_000,
	MonkeyMadnessII = 129_000,
	MisthalinMystery = 130_000,
	ClientofKourend = 131_000,
	BoneVoyage = 132_000,
	TheQueenofThieves = 133_000,
	TheDepthsofDespair = 134_000,
	TheCorsairCurse = 135_000,
	DragonSlayerII = 136_000,
	TaleoftheRighteous = 137_000,
	ATasteofHope = 138_000,
	MakingFriendswithMyArm = 139_000,
	TheForsakenTower = 140_000,
	TheAscentofArceuus = 141_000,
	XMarkstheSpot = 142_000,
	SongoftheElves = 143_000,
	TheFremennikExiles = 144_000,
	SinsoftheFather = 145_000,
	APorcineofInterest = 146_000,
	GettingAhead = 147_000,
	BelowIceMountain = 148_000,
	ANightattheTheatre = 149_000,
	AKingdomDivide = 150_000
}

interface ICustomRewardDirect {
	function: () => ['xp' | 'item', Skills | ItemBank];
	type: 'direct_reward';
}

interface ICustomRewardCollect {
	function: (msg: KlasaMessage) => Promise<boolean>;
	type: 'collect_reward';
	id: number;
}

interface IQuestRequirements {
	level?: Skills;
	ironLevel?: Skills[];
	items?: ItemBank;
	quests?: Quests[];
	qp?: number;
	combatLevel?: number;
}

interface IQuestRewards {
	xp?: Skills;
	items?: ItemBank;
	qp: number;
	customLogic?: (ICustomRewardDirect | ICustomRewardCollect)[];
}

interface IQuest {
	id: Quests;
	name: string;
	time: number;
	rewards: IQuestRewards;
	requirements?: IQuestRequirements;
}

const QuestList: IQuest[] = [
	{
		id: Quests.CooksAssistant,
		name: "Cook's Assistant",
		time: Time.Minute * 3,
		rewards: { qp: 1, xp: { [SkillsEnum.Cooking]: 300 } }
	},
	{
		id: Quests.DemonSlayer,
		name: 'Demon Slayer',
		time: Time.Minute * 4,
		rewards: { qp: 3, items: { Silverlight: 1 } }
	},
	{
		id: Quests.TheRestlessGhost,
		name: 'The Restless Ghost',
		time: Time.Minute * 3,
		rewards: { qp: 1, xp: { [SkillsEnum.Prayer]: 1125 }, items: { 'Ghostspeak amulet': 1 } }
	},
	{ id: Quests.RomeoAndJuliet, name: 'Romeo & Juliet', time: Time.Minute * 3, rewards: { qp: 5 } },
	{
		id: Quests.SheepShearer,
		name: 'Sheep Shearer',
		time: Time.Minute * 3,
		rewards: { qp: 1, xp: { [SkillsEnum.Crafting]: 150 }, items: { 995: 60 } }
	},
	{
		id: Quests.ShieldofArrav,
		name: 'Shield of Arrav',
		time: Time.Minute * 7,
		rewards: { qp: 1, items: { 995: 600 } }
	},
	{
		id: Quests.ErnesttheChicken,
		name: 'Ernest the Chicken',
		time: Time.Minute * 7,
		rewards: { qp: 4, items: { 995: 300 } }
	},
	{
		id: Quests.VampyreSlayer,
		name: 'Vampyre Slayer',
		time: Time.Minute * 4,
		rewards: { qp: 3, xp: { [SkillsEnum.Attack]: 4825 } }
	},
	{
		id: Quests.ImpCatcher,
		name: 'Imp Catcher',
		time: Time.Minute * 3,
		rewards: { qp: 1, xp: { [SkillsEnum.Magic]: 875 }, items: { 'Amulet of accuracy': 1 } }
	},
	{
		id: Quests.PrinceAliRescue,
		name: 'Prince Ali Rescue',
		time: Time.Minute * 9,
		rewards: { qp: 3, items: { 995: 700 } }
	},
	{
		id: Quests.DoricsQuest,
		name: "Doric's Quest",
		time: Time.Minute * 3,
		rewards: { qp: 1, xp: { [SkillsEnum.Mining]: 1300 }, items: { 995: 180 } }
	},
	{
		id: Quests.BlackKnightsFortress,
		name: "Black Knights' Fortress",
		time: Time.Minute * 7,
		rewards: { qp: 3, items: { 995: 2500 } }
	},
	{
		id: Quests.WitchsPotion,
		name: "Witch's Potion",
		time: Time.Minute * 4,
		rewards: { qp: 1, xp: { [SkillsEnum.Magic]: 325 } }
	},
	{
		id: Quests.TheKnightsSword,
		name: "The Knight's Sword",
		time: Time.Minute * 12,
		requirements: { level: { [SkillsEnum.Mining]: 10 } },
		rewards: { qp: 1, xp: { [SkillsEnum.Smithing]: 12_725 }, items: { 'Blurite sword': 1 } }
	},
	{
		id: Quests.GoblinDiplomacy,
		name: 'Goblin Diplomacy',
		time: Time.Minute * 4,
		rewards: { qp: 5, xp: { [SkillsEnum.Crafting]: 200 }, items: { 'Gold bar': 1 } }
	},
	{
		id: Quests.PiratesTreasure,
		name: "Pirate's Treasure",
		time: Time.Minute * 7,
		rewards: {
			qp: 2,
			items: {
				'Gold ring': 1,
				Emerald: 1,
				995: 450
			}
		}
	},
	{
		id: Quests.DragonSlayerI,
		name: 'Dragon Slayer I',
		time: Time.Minute * 33,
		requirements: {
			level: {
				[SkillsEnum.Magic]: 33,
				[SkillsEnum.Prayer]: 37
			},
			ironLevel: [
				{
					[SkillsEnum.Crafting]: 8,
					[SkillsEnum.Smithing]: 34
				}
			],
			qp: 32
		},
		rewards: {
			qp: 2,
			xp: {
				[SkillsEnum.Strength]: 18_650,
				[SkillsEnum.Defence]: 18_650
			}
		}
	},
	{
		id: Quests.DruidicRitual,
		name: 'Druidic Ritual',
		time: Time.Minute * 4,
		rewards: { qp: 4, xp: { [SkillsEnum.Herblore]: 250 } }
	},
	{
		id: Quests.LostCity,
		name: 'Lost City',
		time: Time.Minute * 13,
		requirements: {
			level: {
				[SkillsEnum.Crafting]: 31,
				[SkillsEnum.Woodcutting]: 36
			}
		},
		rewards: {
			qp: 3,
			items: {
				'Dramen staff': 1
			}
		}
	},
	{
		id: Quests.WitchsHouse,
		name: "Witch's House",
		time: Time.Minute * 12,
		rewards: {
			qp: 4,
			xp: {
				[SkillsEnum.Hitpoints]: 6325
			}
		}
	},
	{
		id: Quests.MerlinsCrystal,
		name: "Merlin's Crystal",
		time: Time.Minute * 13,
		rewards: {
			qp: 6,
			items: {
				Excalibur: 1
			}
		}
	},
	{
		id: Quests.HeroesQuest,
		name: "Heroes' Quest",
		time: Time.Minute * 27,
		requirements: {
			level: {
				[SkillsEnum.Cooking]: 53,
				[SkillsEnum.Fishing]: 53,
				[SkillsEnum.Herblore]: 25,
				[SkillsEnum.Mining]: 50
			},
			quests: [Quests.ShieldofArrav, Quests.LostCity, Quests.MerlinsCrystal, Quests.DragonSlayerI],
			qp: 55
		},
		rewards: {
			qp: 1,
			xp: {
				[SkillsEnum.Attack]: 3075,
				[SkillsEnum.Defence]: 3075,
				[SkillsEnum.Strength]: 3075,
				[SkillsEnum.Hitpoints]: 3075,
				[SkillsEnum.Ranged]: 2075,
				[SkillsEnum.Fishing]: 2725,
				[SkillsEnum.Cooking]: 2825,
				[SkillsEnum.Woodcutting]: 1575,
				[SkillsEnum.Firemaking]: 1575,
				[SkillsEnum.Smithing]: 2257,
				[SkillsEnum.Mining]: 2575,
				[SkillsEnum.Herblore]: 1325
			}
		}
	},
	{
		id: Quests.ScorpionCatcher,
		name: 'Scorpion Catcher',
		time: Time.Minute * 16,
		requirements: {
			level: {
				[SkillsEnum.Prayer]: 31
			}
		},
		rewards: {
			qp: 1,
			xp: {
				[SkillsEnum.Strength]: 6625
			}
		}
	},
	{
		id: Quests.FamilyCrest,
		name: 'Family Crest',
		time: Time.Minute * 22,
		requirements: {
			level: {
				[SkillsEnum.Mining]: 40,
				[SkillsEnum.Smithing]: 40,
				[SkillsEnum.Magic]: 59,
				[SkillsEnum.Crafting]: 40
			}
		},
		rewards: { qp: 1 }
	},
	{
		id: Quests.TribalTotem,
		name: 'Tribal Totem',
		time: Time.Minute * 7,
		requirements: { level: { [SkillsEnum.Thieving]: 21 } },
		rewards: { qp: 1, xp: { [SkillsEnum.Thieving]: 1175 }, items: { Swordfish: 5 } }
	},
	{
		id: Quests.FishingContest,
		name: 'Fishing Contest',
		time: Time.Minute * 7,
		requirements: { level: { [SkillsEnum.Fishing]: 10 } },
		rewards: { qp: 1, xp: { [SkillsEnum.Fishing]: 2437 } }
	},
	{
		id: Quests.MonksFriend,
		name: "Monk's Friend",
		time: Time.Minute * 4,
		requirements: {},
		rewards: {
			qp: 1,
			xp: { [SkillsEnum.Woodcutting]: 2000 },
			items: {
				'Law rune': 8
			}
		}
	},
	{
		id: Quests.TempleofIkov,
		name: 'Temple of Ikov',
		time: Time.Minute * 9,
		requirements: {
			level: {
				[SkillsEnum.Thieving]: 42,
				[SkillsEnum.Ranged]: 40
			}
		},
		rewards: {
			qp: 1,
			xp: {
				[SkillsEnum.Ranged]: 10_500,
				[SkillsEnum.Fletching]: 8000
			},
			items: {
				'Boots of lightness': 1,
				'Armadyl pendant': 1,
				'Pendant of Lucien': 1
			}
		}
	},
	{
		id: Quests.ClockTower,
		name: 'Clock Tower',
		time: Time.Minute * 7,
		requirements: {},
		rewards: { qp: 1, items: { 995: 500 } }
	},
	{
		id: Quests.HolyGrail,
		name: 'Holy Grail',
		time: Time.Minute * 18,
		requirements: {
			level: {
				[SkillsEnum.Attack]: 20
			},
			quests: [Quests.MerlinsCrystal]
		},
		rewards: {
			qp: 2,
			xp: {
				[SkillsEnum.Prayer]: 11_000,
				[SkillsEnum.Defence]: 15_300
			}
		}
	},
	{
		id: Quests.TreeGnomeVillage,
		name: 'Tree Gnome Village',
		time: Time.Minute * 19,
		requirements: {},
		rewards: {
			qp: 2,
			xp: {
				[SkillsEnum.Attack]: 11_450
			},
			items: {
				'Gnome amulet': 1
			}
		}
	},
	{
		id: Quests.FightArena,
		name: 'Fight Arena',
		time: Time.Minute * 15,
		requirements: {},
		rewards: {
			qp: 2,
			xp: {
				[SkillsEnum.Attack]: 12_175,
				[SkillsEnum.Thieving]: 2175
			},
			items: {
				995: 1000,
				'Khazard armour': 1
			}
		}
	},
	{
		id: Quests.HazeelCult,
		name: 'Hazeel Cult',
		time: Time.Minute * 7,
		requirements: {},
		rewards: {
			qp: 1,
			xp: { [SkillsEnum.Thieving]: 1500 },
			items: {
				995: 2005,
				"Hazeel's mark ": 1,
				'Carnillean armour': 1
			}
		}
	},
	{
		id: Quests.SheepHerder,
		name: 'Sheep Herder',
		time: Time.Minute * 13,
		requirements: {},
		rewards: { qp: 4, items: { 995: 3100 } }
	},
	{
		id: Quests.PlagueCity,
		name: 'Plague City',
		time: Time.Minute * 7,
		requirements: {},
		rewards: { qp: 1, xp: { [SkillsEnum.Mining]: 2425 } }
	},
	{
		id: Quests.SeaSlug,
		name: 'Sea Slug',
		time: Time.Minute * 7,
		requirements: { level: { [SkillsEnum.Firemaking]: 30 } },
		rewards: { qp: 1, xp: { [SkillsEnum.Fishing]: 7175 } }
	},
	{
		id: Quests.WaterfallQuest,
		name: 'Waterfall Quest',
		time: Time.Minute * 13,
		requirements: {},
		rewards: {
			qp: 1,
			xp: {
				[SkillsEnum.Strength]: 13_750,
				[SkillsEnum.Attack]: 13_750
			},
			items: {
				Diamond: 2,
				'Gold bar': 2,
				'Mithril seeds': 40
			}
		}
	},
	{
		id: Quests.Biohazard,
		name: 'Biohazard',
		time: Time.Minute * 19,
		requirements: { quests: [Quests.PlagueCity] },
		rewards: { qp: 3, xp: { [SkillsEnum.Thieving]: 1250 } }
	},
	{
		id: Quests.JunglePotion,
		name: 'Jungle Potion',
		time: Time.Minute * 13,
		requirements: {
			level: {
				[SkillsEnum.Herblore]: 3
			},
			quests: [Quests.DruidicRitual]
		},
		rewards: { qp: 1, xp: { [SkillsEnum.Herblore]: 775 } }
	},
	{
		id: Quests.TheGrandTree,
		name: 'The Grand Tree',
		time: Time.Minute * 21,
		requirements: {
			level: { [SkillsEnum.Agility]: 25 }
		},
		rewards: {
			qp: 5,
			xp: {
				[SkillsEnum.Attack]: 18_400,
				[SkillsEnum.Agility]: 7900,
				[SkillsEnum.Magic]: 2150
			}
		}
	},
	{
		id: Quests.ShiloVillage,
		name: 'Shilo Village',
		time: Time.Minute * 33,
		requirements: {
			level: {
				[SkillsEnum.Crafting]: 20,
				[SkillsEnum.Agility]: 32
			},
			ironLevel: [
				{
					[SkillsEnum.Smithing]: 4
				}
			],
			quests: [Quests.JunglePotion]
		},
		rewards: { qp: 2, xp: { [SkillsEnum.Crafting]: 3875 } }
	},
	{
		id: Quests.UndergroundPass,
		name: 'Underground Pass',
		time: Time.Minute * 69,
		requirements: {
			level: { [SkillsEnum.Ranged]: 25 },
			quests: [Quests.Biohazard, Quests.PlagueCity]
		},
		rewards: {
			qp: 5,
			xp: {
				[SkillsEnum.Agility]: 3000,
				[SkillsEnum.Attack]: 3000
			},
			items: {
				"Iban's staff": 1
			}
		}
	},
	{
		id: Quests.ObservatoryQuest,
		name: 'Observatory Quest',
		time: Time.Minute * 16,
		requirements: {},
		rewards: {
			qp: 2,
			xp: { [SkillsEnum.Crafting]: 2250 },
			items: {
				'Uncut sapphire': 1
			},
			customLogic: [
				{
					type: 'direct_reward',
					function: () => {
						return randArrItem([
							['xp', { [SkillsEnum.Attack]: 875 }],
							['xp', { [SkillsEnum.Defence]: 875 }],
							['xp', { [SkillsEnum.Strength]: 875 }],
							['xp', { [SkillsEnum.Hitpoints]: 875 }],
							['item', { 'Water rune': 25 }],
							['item', { 'Amulet of defence': 1 }],
							['item', { 'Black 2h sword': 1 }],
							['item', { 'Law rune': 3 }],
							['item', { Tuna: 3 }],
							['item', { 'Maple longbow': 1 }],
							['item', { 'Weapon poison': 1 }],
							['item', { 'Super strength(1)': 1 }]
						]);
					}
				}
			]
		}
	},
	{
		id: Quests.TheTouristTrap,
		name: 'The Tourist Trap',
		time: Time.Minute * 27,
		requirements: {
			level: {
				[SkillsEnum.Fletching]: 10,
				[SkillsEnum.Smithing]: 20
			}
		},
		rewards: {
			qp: 2,
			customLogic: [1, 2].map(id => {
				return {
					type: 'collect_reward',
					id,
					function: msg => {
						return xpReward(msg, {
							[SkillsEnum.Agility]: 4650,
							[SkillsEnum.Fletching]: 4650,
							[SkillsEnum.Smithing]: 4650,
							[SkillsEnum.Thieving]: 4650
						});
					}
				};
			})
		}
	},
	{
		id: Quests.Watchtower,
		name: 'Watchtower',
		time: Time.Minute * 27,
		requirements: {
			level: {
				[SkillsEnum.Magic]: 14,
				[SkillsEnum.Thieving]: 15,
				[SkillsEnum.Agility]: 25,
				[SkillsEnum.Herblore]: 14,
				[SkillsEnum.Mining]: 40
			}
		},
		rewards: {
			qp: 4,
			xp: {
				[SkillsEnum.Magic]: 15_250
			},
			items: {
				995: 5000
			}
		}
	},
	{
		id: Quests.DwarfCannon,
		name: 'Dwarf Cannon',
		time: Time.Minute * 12,
		requirements: {},
		rewards: { qp: 1, xp: { [SkillsEnum.Crafting]: 750 } }
	},
	{
		id: Quests.MurderMystery,
		name: 'Murder Mystery',
		time: Time.Minute * 7,
		requirements: {},
		rewards: { qp: 3, xp: { [SkillsEnum.Crafting]: 1406 }, items: { 995: 2000 } }
	},
	{
		id: Quests.TheDigSite,
		name: 'The Dig Site',
		time: Time.Minute * 21,
		requirements: {
			level: {
				[SkillsEnum.Agility]: 10,
				[SkillsEnum.Herblore]: 10,
				[SkillsEnum.Thieving]: 25
			}
		},
		rewards: {
			qp: 2,
			xp: {
				[SkillsEnum.Mining]: 15_300,
				[SkillsEnum.Herblore]: 2000
			},
			items: {
				'Gold bar': 2
			}
		}
	},
	{
		id: Quests.GertrudesCat,
		name: "Gertrude's Cat",
		time: Time.Minute * 7,
		requirements: {},
		rewards: {
			qp: 1,
			xp: {
				[SkillsEnum.Cooking]: 1525
			},
			items: {
				'Chocolate cake': 1,
				Stew: 1
			},
			customLogic: [
				{
					type: 'direct_reward',
					function: () => {
						// Give a random pet kitten
						return randArrItem([
							['item', { 1555: 1 }],
							['item', { 1556: 1 }],
							['item', { 1557: 1 }],
							['item', { 1558: 1 }],
							['item', { 1559: 1 }],
							['item', { 1560: 1 }]
						]);
					}
				}
			]
		}
	},
	{
		id: Quests.LegendsQuest,
		name: "Legends' Quest",
		time: Time.Minute * 84,
		requirements: {
			qp: 107,
			level: {
				[SkillsEnum.Agility]: 50,
				[SkillsEnum.Crafting]: 50,
				[SkillsEnum.Herblore]: 45,
				[SkillsEnum.Magic]: 56,
				[SkillsEnum.Mining]: 52,
				[SkillsEnum.Prayer]: 42,
				[SkillsEnum.Smithing]: 50,
				[SkillsEnum.Strength]: 50,
				[SkillsEnum.Thieving]: 50,
				[SkillsEnum.Woodcutting]: 50
			},
			quests: [
				Quests.FamilyCrest,
				Quests.HeroesQuest,
				Quests.ShiloVillage,
				Quests.UndergroundPass,
				Quests.WaterfallQuest
			]
		},
		rewards: {
			qp: 4,
			customLogic: [1, 2, 3, 4].map(id => {
				return {
					type: 'collect_reward',
					id,
					function: msg => {
						return xpReward(msg, {
							[SkillsEnum.Attack]: 7650,
							[SkillsEnum.Defence]: 7650,
							[SkillsEnum.Strength]: 7650,
							[SkillsEnum.Hitpoints]: 7650,
							[SkillsEnum.Prayer]: 7650,
							[SkillsEnum.Magic]: 7650,
							[SkillsEnum.Woodcutting]: 7650,
							[SkillsEnum.Crafting]: 7650,
							[SkillsEnum.Smithing]: 7650,
							[SkillsEnum.Herblore]: 7650,
							[SkillsEnum.Agility]: 7650,
							[SkillsEnum.Thieving]: 7650
						});
					}
				};
			})
		}
	},
	{
		id: Quests.RuneMysteries,
		name: 'Rune Mysteries',
		time: Time.Minute * 4,
		requirements: {},
		rewards: { qp: 1, items: { 'Air talisman': 1 } }
	},
	{
		id: Quests.BigChompyBirdHunting,
		name: 'Big Chompy Bird Hunting',
		time: Time.Minute * 12,
		requirements: {
			level: {
				[SkillsEnum.Fletching]: 5,
				[SkillsEnum.Cooking]: 30,
				[SkillsEnum.Ranged]: 30
			}
		},
		rewards: {
			qp: 2,
			xp: {
				[SkillsEnum.Fletching]: 262,
				[SkillsEnum.Cooking]: 1470,
				[SkillsEnum.Ranged]: 735
			},
			items: {
				'Ogre bow': 1
			}
		}
	},
	{
		id: Quests.ElementalWorkshopI,
		name: 'Elemental Workshop I',
		time: Time.Minute * 7,
		requirements: {
			level: {
				[SkillsEnum.Mining]: 20,
				[SkillsEnum.Smithing]: 20,
				[SkillsEnum.Crafting]: 20
			},
			ironLevel: [
				{
					[SkillsEnum.Mining]: 30
				}
			]
		},
		rewards: {
			qp: 1,
			xp: {
				[SkillsEnum.Crafting]: 5000,
				[SkillsEnum.Smithing]: 5000
			},
			items: {
				'Elemental shield': 1
			}
		}
	},
	{
		id: Quests.PriestinPeril,
		name: 'Priest in Peril',
		time: Time.Minute * 18,
		requirements: {},
		rewards: {
			qp: 1,
			xp: {
				[SkillsEnum.Prayer]: 1406
			},
			items: { Wolfbane: 1 }
		}
	},
	{
		id: Quests.NatureSpirit,
		name: 'Nature Spirit',
		time: Time.Minute * 13,
		requirements: {
			ironLevel: [
				{
					[SkillsEnum.Crafting]: 18
				}
			]
		},
		rewards: {
			qp: 2,
			xp: {
				[SkillsEnum.Crafting]: 3000,
				[SkillsEnum.Defence]: 2000,
				[SkillsEnum.Hitpoints]: 2000
			},
			items: {
				'Silver sickle (b)': 1,
				'Meat pie': 3,
				'Apple pie': 3
			}
		}
	},
	{
		id: Quests.DeathPlateau,
		name: 'Death Plateau',
		time: Time.Minute * 13,
		requirements: {},
		rewards: {
			qp: 1,
			xp: {
				[SkillsEnum.Attack]: 3000
			},
			items: {
				'Steel claws': 1,
				'Climbing boots': 1
			}
		}
	},
	{
		id: Quests.TrollStronghold,
		name: 'Troll Stronghold',
		time: Time.Minute * 16,
		requirements: {
			quests: [Quests.DeathPlateau],
			level: {
				[SkillsEnum.Agility]: 15
			}
		},
		rewards: {
			qp: 1,
			items: {
				'Law talisman': 1
			}
		}
	},
	{
		id: Quests.TaiBwoWannaiTrio,
		name: 'Tai Bwo Wannai Trio',
		time: Time.Minute * 30,
		requirements: {
			quests: [Quests.JunglePotion],
			level: {
				[SkillsEnum.Agility]: 15,
				[SkillsEnum.Firemaking]: 30,
				[SkillsEnum.Cooking]: 30,
				[SkillsEnum.Fishing]: 5
			},
			ironLevel: [
				{
					[SkillsEnum.Fishing]: 65,
					[SkillsEnum.Herblore]: 34
				}
			]
		},
		rewards: {
			qp: 2,
			xp: {
				[SkillsEnum.Cooking]: 5000,
				[SkillsEnum.Fishing]: 5000,
				[SkillsEnum.Attack]: 2500,
				[SkillsEnum.Strength]: 2500
			},
			items: {
				995: 2000,
				'Rune spear(kp)': 1
			}
		}
	},
	{
		id: Quests.Regicide,
		name: 'Regicide',
		time: Time.Minute * 78,
		requirements: {
			quests: [Quests.UndergroundPass],
			level: {
				[SkillsEnum.Crafting]: 10,
				[SkillsEnum.Agility]: 56
			},
			ironLevel: [
				{
					[SkillsEnum.Crafting]: 10
				}
			]
		},
		rewards: {
			qp: 3,
			xp: {
				[SkillsEnum.Agility]: 13_750
			},
			items: {
				995: 15_000
			}
		}
	},
	{
		id: Quests.EadgarsRuse,
		name: "Eadgar's Ruse",
		time: Time.Minute * 31,
		requirements: {
			quests: [Quests.DruidicRitual, Quests.TrollStronghold],
			level: {
				[SkillsEnum.Herblore]: 31
			}
		},
		rewards: { qp: 1, xp: { [SkillsEnum.Herblore]: 11_000 }, items: { 'Burnt meat': 1, Goutweed: 1 } }
	},
	{
		id: Quests.ShadesofMortton,
		name: "Shades of Mort'ton",
		time: Time.Minute * 19,
		requirements: {
			quests: [Quests.PriestinPeril],
			level: {
				[SkillsEnum.Crafting]: 20,
				[SkillsEnum.Herblore]: 15,
				[SkillsEnum.Firemaking]: 5
			}
		},
		rewards: { qp: 3, xp: { [SkillsEnum.Herblore]: 2335, [SkillsEnum.Crafting]: 2000 } }
	},
	{
		id: Quests.TheFremennikTrials,
		name: 'The Fremennik Trials',
		time: Time.Minute * 40,
		requirements: {
			level: {
				[SkillsEnum.Fletching]: 25,
				[SkillsEnum.Woodcutting]: 40,
				[SkillsEnum.Crafting]: 40
			}
		},
		rewards: {
			qp: 3,
			xp: {
				[SkillsEnum.Agility]: 2812,
				[SkillsEnum.Attack]: 2812,
				[SkillsEnum.Crafting]: 2812,
				[SkillsEnum.Defence]: 2812,
				[SkillsEnum.Fishing]: 2812,
				[SkillsEnum.Fletching]: 2812,
				[SkillsEnum.Hitpoints]: 2812,
				[SkillsEnum.Strength]: 2812,
				[SkillsEnum.Thieving]: 2812,
				[SkillsEnum.Woodcutting]: 2812
			},
			items: {
				'Enchanted lyre(i)': 1
			}
		}
	},
	{
		id: Quests.HorrorfromtheDeep,
		name: 'Horror from the Deep',
		time: Time.Minute * 18,
		requirements: {
			level: {
				[SkillsEnum.Agility]: 35
			}
		},
		rewards: {
			qp: 2,
			xp: {
				[SkillsEnum.Magic]: 4662,
				[SkillsEnum.Strength]: 4662,
				[SkillsEnum.Ranged]: 4662
			},
			items: {
				// Damaged books
				3839: 1,
				3841: 1,
				3843: 1,
				12_607: 1,
				12_609: 1,
				12_611: 1
			}
		}
	},
	{
		id: Quests.ThroneofMiscellania,
		name: 'Throne of Miscellania',
		time: Time.Minute * 43,
		requirements: {
			quests: [Quests.HeroesQuest, Quests.TheFremennikTrials]
		},
		rewards: { qp: 1, items: { 995: 10_000 } }
	},
	{
		id: Quests.MonkeyMadnessI,
		name: 'Monkey Madness I',
		time: Time.Minute * 75,
		requirements: {
			quests: [Quests.TheGrandTree, Quests.TreeGnomeVillage]
		},
		rewards: {
			qp: 3,
			items: {
				Diamond: 3,
				995: 10_000,
				'Karamjan monkey greegree': 1,
				'Zombie monkey greegree': 1,
				'Ancient gorilla greegree': 1,
				'Bearded gorilla greegree': 1,
				'Gorilla greegree': 1,
				'Ninja monkey greegree': 1
			},
			customLogic: [
				{
					type: 'collect_reward',
					id: 1,
					function: msg => {
						return xpReward(msg, [
							{
								[SkillsEnum.Attack]: 35_000,
								[SkillsEnum.Defence]: 35_000,
								[SkillsEnum.Strength]: 20_000,
								[SkillsEnum.Hitpoints]: 20_000
							},
							{
								[SkillsEnum.Strength]: 35_000,
								[SkillsEnum.Hitpoints]: 35_000,
								[SkillsEnum.Attack]: 20_000,
								[SkillsEnum.Defence]: 20_000
							}
						]);
					}
				}
			]
		}
	},
	{
		id: Quests.HauntedMine,
		name: 'Haunted Mine',
		time: Time.Minute * 25,
		requirements: {
			quests: [Quests.PriestinPeril],
			level: {
				[SkillsEnum.Crafting]: 35
			}
		},
		rewards: {
			qp: 2,
			xp: {
				[SkillsEnum.Strength]: 22_000
			},
			items: {
				'Salve amulet': 1
			}
		}
	},
	{
		id: Quests.TrollRomance,
		name: 'Troll Romance',
		time: Time.Minute * 16,
		requirements: {
			level: { [SkillsEnum.Agility]: 28 },
			quests: [Quests.TrollStronghold]
		},
		rewards: {
			qp: 2,
			xp: { [SkillsEnum.Agility]: 8000, [SkillsEnum.Strength]: 4000 },
			items: { 'Uncut diamond': 1, 'Uncut ruby': 2, 'Uncut emerald': 4, Sled: 1 }
		}
	},
	{
		id: Quests.InSearchoftheMyreque,
		name: 'In Search of the Myreque',
		time: Time.Minute * 13,
		requirements: {
			quests: [Quests.NatureSpirit],
			level: {
				[SkillsEnum.Agility]: 25
			}
		},
		rewards: {
			qp: 2,
			xp: {
				[SkillsEnum.Attack]: 600,
				[SkillsEnum.Defence]: 600,
				[SkillsEnum.Strength]: 600,
				[SkillsEnum.Hitpoints]: 600,
				[SkillsEnum.Crafting]: 600
			}
		}
	},
	{
		id: Quests.CreatureofFenkenstrain,
		name: 'Creature of Fenkenstrain',
		time: Time.Minute * 16,
		requirements: {
			quests: [Quests.PriestinPeril, Quests.TheRestlessGhost],
			level: {
				[SkillsEnum.Crafting]: 20,
				[SkillsEnum.Thieving]: 25
			},
			ironLevel: [
				{
					[SkillsEnum.Smithing]: 4
				}
			]
		},
		rewards: { qp: 2, xp: { [SkillsEnum.Thieving]: 1000 }, items: { 'Ring of charos': 1 } }
	},
	{
		id: Quests.RovingElves,
		name: 'Roving Elves',
		time: Time.Minute * 31,
		requirements: {
			quests: [Quests.Regicide, Quests.WaterfallQuest],
			level: { [SkillsEnum.Agility]: 56 }
		},
		rewards: {
			qp: 1,
			xp: { [SkillsEnum.Strength]: 10_000 },
			items: {
				'Crystal bow': 1,
				'Crystal shield': 1
			}
		}
	},
	{
		id: Quests.GhostsAhoy,
		name: 'Ghosts Ahoy',
		time: Time.Minute * 34,
		requirements: {
			quests: [Quests.PriestinPeril, Quests.TheRestlessGhost],
			level: { [SkillsEnum.Agility]: 25, [SkillsEnum.Cooking]: 20 }
		},
		rewards: { qp: 2, xp: { [SkillsEnum.Prayer]: 2400 }, items: { Ectophial: 1 } }
	},
	{
		id: Quests.OneSmallFavour,
		name: 'One Small Favour',
		time: Time.Minute * 63,
		requirements: {
			quests: [Quests.RuneMysteries, Quests.DruidicRitual, Quests.ShiloVillage],
			level: {
				[SkillsEnum.Agility]: 36,
				[SkillsEnum.Crafting]: 25,
				[SkillsEnum.Herblore]: 18,
				[SkillsEnum.Smithing]: 30
			}
		},
		rewards: {
			qp: 2,
			items: { 'Steel key ring': 1 },
			customLogic: [1, 2].map(id => {
				return {
					type: 'collect_reward',
					id,
					function: msg => {
						return xpReward(msg, allSkills(10_000), allSkills(30));
					}
				};
			})
		}
	},
	{
		id: Quests.MountainDaughter,
		name: 'Mountain Daughter',
		time: Time.Minute * 25,
		requirements: {
			level: {
				[SkillsEnum.Agility]: 20
			}
		},
		rewards: { qp: 2, xp: { [SkillsEnum.Prayer]: 2000, [SkillsEnum.Attack]: 1000 }, items: { Bearhead: 1 } }
	},
	{
		id: Quests.BetweenaRock,
		name: 'Between a Rock...',
		time: Time.Minute * 45,
		requirements: {
			quests: [Quests.DwarfCannon, Quests.FishingContest],
			level: {
				[SkillsEnum.Defence]: 30,
				[SkillsEnum.Mining]: 40,
				[SkillsEnum.Smithing]: 50
			}
		},
		rewards: {
			qp: 2,
			xp: {
				[SkillsEnum.Defence]: 5000,
				[SkillsEnum.Mining]: 5000,
				[SkillsEnum.Smithing]: 5000
			},
			items: { 'Rune pickaxe': 1, 'Gold helmet': 1 }
		}
	},
	{
		id: Quests.TheFeud,
		name: 'The Feud',
		time: Time.Minute * 27,
		requirements: { level: { [SkillsEnum.Thieving]: 30 } },
		rewards: {
			qp: 1,
			xp: { [SkillsEnum.Thieving]: 15_000 },
			items: { 995: 500, 'Oak blackjack': 1, 'Willow blackjack': 1, 'Desert disguise': 1, 'Adamant scimitar': 1 }
		}
	},
	{
		id: Quests.TheGolem,
		name: 'The Golem',
		time: Time.Minute * 12,
		requirements: { level: { [SkillsEnum.Crafting]: 20, [SkillsEnum.Thieving]: 25 } },
		rewards: {
			qp: 1,
			xp: { [SkillsEnum.Thieving]: 1000, [SkillsEnum.Crafting]: 1000 },
			items: { Ruby: 2, Emerald: 2, Sapphire: 2 }
		}
	},
	{
		id: Quests.DesertTreasure,
		name: 'Desert Treasure',
		time: Time.Minute * 103,
		requirements: {
			quests: [
				Quests.TheDigSite,
				Quests.TempleofIkov,
				Quests.TheTouristTrap,
				Quests.TrollStronghold,
				Quests.PriestinPeril,
				Quests.WaterfallQuest,
				Quests.NatureSpirit
			],
			level: {
				[SkillsEnum.Thieving]: 53,
				[SkillsEnum.Magic]: 50,
				[SkillsEnum.Firemaking]: 50,
				[SkillsEnum.Slayer]: 10
			}
		},
		rewards: {
			qp: 3,
			xp: { [SkillsEnum.Magic]: 20_000 },
			items: {
				'Ring of visibility': 1,
				'Ancient staff': 1
			}
		}
	},
	{
		id: Quests.IcthlarinsLittleHelper,
		name: "Icthlarin's Little Helper",
		time: Time.Minute * 21,
		requirements: {
			quests: [Quests.GertrudesCat]
		},
		rewards: {
			qp: 2,
			xp: {
				[SkillsEnum.Thieving]: 4500,
				[SkillsEnum.Agility]: 4000,
				[SkillsEnum.Woodcutting]: 4000
			},
			items: { 'Catspeak amulet': 1 }
		}
	},
	{
		id: Quests.TearsofGuthix,
		name: 'Tears of Guthix',
		time: Time.Minute * 9,
		requirements: {
			qp: 43,
			level: {
				[SkillsEnum.Firemaking]: 49,
				[SkillsEnum.Crafting]: 20,
				[SkillsEnum.Mining]: 20
			},
			ironLevel: [{ [SkillsEnum.Smithing]: 49 }, { [SkillsEnum.Thieving]: 26 }, { [SkillsEnum.Slayer]: 35 }]
		},
		rewards: { qp: 1, xp: { [SkillsEnum.Crafting]: 1000 } }
	},
	{
		id: Quests.ZogreFleshEaters,
		name: 'Zogre Flesh Eaters',
		time: Time.Minute * 27,
		requirements: {
			quests: [Quests.BigChompyBirdHunting, Quests.JunglePotion],
			level: {
				[SkillsEnum.Smithing]: 4,
				[SkillsEnum.Herblore]: 8,
				[SkillsEnum.Ranged]: 30
			}
		},
		rewards: {
			qp: 1,
			items: { 'Ourg bones': 3, 'Zogre bones': 2, 995: 5000 },
			xp: { [SkillsEnum.Fletching]: 2000, [SkillsEnum.Ranged]: 2000, [SkillsEnum.Herblore]: 2000 }
		}
	},
	{
		id: Quests.TheLostTribe,
		name: 'The Lost Tribe',
		time: Time.Minute * 22,
		requirements: {
			quests: [Quests.GoblinDiplomacy, Quests.RuneMysteries],
			level: {
				[SkillsEnum.Agility]: 13,
				[SkillsEnum.Thieving]: 13,
				[SkillsEnum.Mining]: 17
			}
		},
		rewards: { qp: 1, items: { 'Ring of life': 1 }, xp: { [SkillsEnum.Mining]: 3000 } }
	},
	{
		id: Quests.TheGiantDwarf,
		name: 'The Giant Dwarf',
		time: Time.Minute * 27,
		requirements: {
			level: {
				[SkillsEnum.Crafting]: 12,
				[SkillsEnum.Firemaking]: 16,
				[SkillsEnum.Magic]: 33,
				[SkillsEnum.Thieving]: 14
			}
		},
		rewards: {
			qp: 2,
			xp: {
				[SkillsEnum.Mining]: 2500,
				[SkillsEnum.Smithing]: 2500,
				[SkillsEnum.Crafting]: 2500,
				[SkillsEnum.Magic]: 1500,
				[SkillsEnum.Thieving]: 1500,
				[SkillsEnum.Firemaking]: 1500
			}
		}
	},
	{
		id: Quests.RecruitmentDrive,
		name: 'Recruitment Drive',
		time: Time.Minute * 13,
		requirements: {
			quests: [Quests.BlackKnightsFortress, Quests.DruidicRitual]
		},
		rewards: {
			qp: 1,
			xp: {
				[SkillsEnum.Prayer]: 1000,
				[SkillsEnum.Agility]: 1000,
				[SkillsEnum.Herblore]: 1000
			},
			items: {
				'Initiate sallet': 1,
				'Initiate cuisse': 1,
				'Initiate hauberk': 1
			}
		}
	},
	{
		id: Quests.MourningsEndPartI,
		name: "Mourning's End Part I",
		time: Time.Minute * 60,
		requirements: {
			quests: [Quests.RovingElves, Quests.BigChompyBirdHunting, Quests.SheepHerder],
			level: {
				[SkillsEnum.Ranged]: 60,
				[SkillsEnum.Thieving]: 50
			}
		},
		rewards: {
			qp: 2,
			xp: { [SkillsEnum.Thieving]: 25_000, [SkillsEnum.Hitpoints]: 25_000 },
			items: {
				'Teleport crystal': 1,
				'Fixed device': 1,
				'Gas mask': 1,
				'Mourner top': 1,
				'Mourner trousers': 1,
				'Mourner boots': 1,
				'Mourner gloves': 1,
				'Mourner cloak': 1
			}
		}
	},
	{
		id: Quests.ForgettableTaleofaDrunkenDwarf,
		name: 'Forgettable Tale of a Drunken Dwarf',
		time: Time.Minute * 84,
		requirements: {
			quests: [Quests.TheGiantDwarf, Quests.FishingContest],
			level: {
				[SkillsEnum.Cooking]: 22,
				[SkillsEnum.Farming]: 17
			}
		},
		rewards: {
			qp: 2,
			xp: { [SkillsEnum.Cooking]: 5000, [SkillsEnum.Farming]: 5000 },
			items: { 'Dwarven stout(m)': 2 }
		}
	},
	{
		id: Quests.GardenofTranquillity,
		name: 'Garden of Tranquillity',
		time: Time.Minute * 84,
		requirements: {
			quests: [Quests.CreatureofFenkenstrain],
			level: {
				[SkillsEnum.Farming]: 25
			}
		},
		rewards: {
			qp: 2,
			xp: { [SkillsEnum.Farming]: 5000 },
			items: { 'Ring of charos(a)': 1, 'Apple tree seed': 1, Acorn: 1, 'Guam seed': 5, Supercompost: 15 }
		}
	},
	{
		id: Quests.ATailofTwoCats,
		name: 'A Tail of Two Cats',
		time: Time.Minute * 45,
		requirements: {
			quests: [Quests.IcthlarinsLittleHelper]
		},
		rewards: {
			qp: 2,
			items: { "Doctor's hat": 1, 'Nurse hat': 1, 'Mouse toy': 1 },
			customLogic: [
				{
					type: 'collect_reward',
					id: 1,
					function: msg => {
						return xpReward(msg, allSkills(2500), allSkills(30));
					}
				}
			]
		}
	},
	{
		id: Quests.Wanted,
		name: 'Wanted!',
		time: Time.Minute * 40,
		requirements: {
			qp: 32,
			// TODO - Add minisquests Miniquests.EnterTheAbyss
			quests: [Quests.RecruitmentDrive, Quests.TheLostTribe, Quests.PriestinPeril]
		},
		rewards: { qp: 1, xp: { [SkillsEnum.Slayer]: 5000 } }
	},
	{
		id: Quests.MourningsEndPartII,
		name: "Mourning's End Part II",
		time: Time.Minute * 82,
		requirements: {
			quests: [Quests.MourningsEndPartI]
		},
		rewards: { qp: 2, xp: { [SkillsEnum.Agility]: 20_000 }, items: { 'Crystal trinket': 1, 'Death talisman': 1 } }
	},
	{
		id: Quests.RumDeal,
		name: 'Rum Deal',
		time: Time.Minute * 30,
		requirements: {
			quests: [Quests.ZogreFleshEaters, Quests.PriestinPeril],
			level: {
				[SkillsEnum.Crafting]: 42,
				[SkillsEnum.Fishing]: 50,
				[SkillsEnum.Farming]: 40,
				[SkillsEnum.Prayer]: 47,
				[SkillsEnum.Slayer]: 42
			}
		},
		rewards: {
			qp: 2,
			items: { 'Holy wrench': 1 },
			xp: {
				[SkillsEnum.Fishing]: 7000,
				[SkillsEnum.Prayer]: 7000,
				[SkillsEnum.Farming]: 7000
			}
		}
	},
	{
		id: Quests.ShadowoftheStorm,
		name: 'Shadow of the Storm',
		time: Time.Minute * 25,
		requirements: {
			quests: [Quests.TheGolem, Quests.DemonSlayer],
			level: { [SkillsEnum.Crafting]: 30 }
		},
		rewards: {
			qp: 1,
			items: { Darklight: 1 },
			customLogic: [
				{
					type: 'collect_reward',
					id: 1,
					function: msg => {
						return xpReward(msg, {
							[SkillsEnum.Attack]: 10_000,
							[SkillsEnum.Strength]: 10_000,
							[SkillsEnum.Defence]: 10_000,
							[SkillsEnum.Hitpoints]: 10_000,
							[SkillsEnum.Ranged]: 10_000,
							[SkillsEnum.Magic]: 10_000
						});
					}
				}
			]
		}
	},
	{
		id: Quests.MakingHistory,
		name: 'Making History',
		time: Time.Minute * 22,
		requirements: {
			quests: [Quests.PriestinPeril, Quests.TheRestlessGhost]
		},
		rewards: {
			qp: 3,
			xp: { [SkillsEnum.Crafting]: 1000, [SkillsEnum.Prayer]: 1000 },
			items: { 995: 750, 'Enchanted key': 1 }
		}
	},
	{
		id: Quests.Ratcatchers,
		name: 'Ratcatchers',
		time: Time.Minute * 48,
		requirements: {
			quests: [Quests.IcthlarinsLittleHelper, Quests.TheGiantDwarf]
		},
		rewards: { qp: 2, xp: { [SkillsEnum.Thieving]: 4500 }, items: { 'Rat pole': 1 } }
	},
	{
		id: Quests.SpiritsoftheElid,
		name: 'Spirits of the Elid',
		time: Time.Minute * 15,
		requirements: {
			level: {
				[SkillsEnum.Magic]: 33,
				[SkillsEnum.Ranged]: 37,
				[SkillsEnum.Mining]: 37,
				[SkillsEnum.Thieving]: 37
			}
		},
		rewards: {
			qp: 2,
			xp: {
				[SkillsEnum.Prayer]: 8000,
				[SkillsEnum.Thieving]: 1000,
				[SkillsEnum.Magic]: 1000
			},
			items: {
				'Robe of elidinis': 1
			}
		}
	},
	{
		id: Quests.DeviousMinds,
		name: 'Devious Minds',
		time: Time.Minute * 12,
		requirements: {
			// TODO - Add miniquest Miniquests.EnterTheAbyss
			quests: [Quests.Wanted, Quests.TrollStronghold, Quests.DoricsQuest],
			level: {
				[SkillsEnum.Smithing]: 65,
				[SkillsEnum.Runecraft]: 50,
				[SkillsEnum.Fletching]: 50
			}
		},
		rewards: {
			qp: 1,
			xp: {
				[SkillsEnum.Fletching]: 5000,
				[SkillsEnum.Runecraft]: 5000,
				[SkillsEnum.Smithing]: 6500
			}
		}
	},
	{
		id: Quests.TheHandintheSand,
		name: 'The Hand in the Sand',
		time: Time.Minute * 19,
		requirements: {
			level: {
				[SkillsEnum.Thieving]: 17,
				[SkillsEnum.Crafting]: 49
			}
		},
		rewards: {
			qp: 1,
			xp: {
				[SkillsEnum.Thieving]: 1000,
				[SkillsEnum.Crafting]: 9000
			}
		}
	},
	{
		id: Quests.EnakhrasLament,
		name: "Enakhra's Lament",
		time: Time.Minute * 21,
		requirements: {
			level: {
				[SkillsEnum.Crafting]: 50,
				[SkillsEnum.Firemaking]: 45,
				[SkillsEnum.Prayer]: 43,
				[SkillsEnum.Magic]: 39
			},
			ironLevel: [{ [SkillsEnum.Mining]: 45 }]
		},
		rewards: {
			qp: 2,
			xp: {
				[SkillsEnum.Crafting]: 7000,
				[SkillsEnum.Mining]: 7000,
				[SkillsEnum.Firemaking]: 7000,
				[SkillsEnum.Magic]: 7000
			},
			items: { Camulet: 1, 'Camel mask': 1 }
		}
	},
	{
		id: Quests.CabinFever,
		name: 'Cabin Fever',
		time: Time.Minute * 34,
		requirements: {
			quests: [Quests.PiratesTreasure, Quests.RumDeal, Quests.PriestinPeril],
			level: {
				[SkillsEnum.Agility]: 42,
				[SkillsEnum.Crafting]: 45,
				[SkillsEnum.Smithing]: 50,
				[SkillsEnum.Ranged]: 40
			}
		},
		rewards: {
			qp: 2,
			xp: {
				[SkillsEnum.Crafting]: 7000,
				[SkillsEnum.Smithing]: 7000,
				[SkillsEnum.Agility]: 7000
			},
			items: { 995: 10_000, "Book o' piracy": 1 }
		}
	},
	{
		id: Quests.FairyTaleIGrowingPains,
		name: 'Fairy Tale I - Growing Pains',
		time: Time.Minute * 42,
		requirements: {
			quests: [Quests.LostCity, Quests.NatureSpirit]
		},
		rewards: {
			qp: 2,
			xp: { [SkillsEnum.Farming]: 3500, [SkillsEnum.Attack]: 2000, [SkillsEnum.Magic]: 1000 },
			items: { 'Magic secateurs': 1 }
		}
	},
	/* amik varze: 44, cooks: 12, dawrf: 14, evil dave: 24, goblins: 8, guide: 10, monkey: 40, pirate: 24, skrach: 20, boss: 44 */
	{
		id: Quests.RecipeforDisasterCooks,
		name: "Recipe for Disaster - Another Cook's Quest",
		time: Time.Minute * 12,
		requirements: {
			quests: [Quests.CooksAssistant],
			level: { [SkillsEnum.Cooking]: 10 }
		},
		rewards: {
			qp: 1
		}
	},
	{
		id: Quests.RecipeforDisasterDwarf,
		name: 'Recipe for Disaster - Freeing the Mountain Dwarf',
		time: Time.Minute * 14,
		requirements: {
			quests: [Quests.RecipeforDisasterCooks, Quests.FishingContest]
		},
		rewards: {
			qp: 1,
			xp: { [SkillsEnum.Slayer]: 1000, [SkillsEnum.Cooking]: 1000 },
			items: { 'Dwarven rock cake': 1 }
		}
	},
	{
		id: Quests.RecipeforDisasterGoblin,
		name: 'Recipe for Disaster - Freeing the Goblin generals',
		time: Time.Minute * 8,
		requirements: {
			quests: [Quests.RecipeforDisasterCooks, Quests.GoblinDiplomacy]
		},
		rewards: {
			qp: 1,
			xp: { [SkillsEnum.Farming]: 1000, [SkillsEnum.Cooking]: 1000, [SkillsEnum.Crafting]: 1000 }
		}
	},
	{
		id: Quests.RecipeforDisasterPirate,
		name: 'Recipe for Disaster - Freeing Pirate Pete',
		time: Time.Minute * 24,
		requirements: {
			quests: [Quests.RecipeforDisasterCooks],
			level: {
				[SkillsEnum.Cooking]: 31
			},
			ironLevel: [
				{
					[SkillsEnum.Crafting]: 42,
					[SkillsEnum.Smithing]: 4
				}
			]
		},
		rewards: {
			qp: 1,
			xp: {
				[SkillsEnum.Fishing]: 1000,
				[SkillsEnum.Cooking]: 1000,
				[SkillsEnum.Crafting]: 1000,
				[SkillsEnum.Smithing]: 1000
			},
			items: {
				'Diving apparatus': 1,
				Fishbowl: 1
			}
		}
	},
	{
		id: Quests.RecipeforDisasterGuide,
		name: 'Recipe for Disaster - Freeing the Lumbridge Guide',
		time: Time.Minute * 10,
		requirements: {
			quests: [
				Quests.RecipeforDisasterCooks,
				Quests.BigChompyBirdHunting,
				Quests.Biohazard,
				Quests.DemonSlayer,
				Quests.MurderMystery,
				Quests.NatureSpirit,
				Quests.WitchsHouse
			],
			level: {
				[SkillsEnum.Cooking]: 40
			}
		},
		rewards: {
			qp: 1,
			xp: {
				[SkillsEnum.Magic]: 2500,
				[SkillsEnum.Cooking]: 2500
			}
		}
	},
	{
		id: Quests.RecipeforDisasterDave,
		name: 'Recipe for Disaster - Freeing Evil Dave',
		time: Time.Minute * 24,
		requirements: {
			quests: [Quests.RecipeforDisasterCooks, Quests.GertrudesCat, Quests.ShadowoftheStorm],
			level: {
				[SkillsEnum.Cooking]: 25
			}
		},
		rewards: {
			qp: 1,
			xp: {
				[SkillsEnum.Cooking]: 7000
			}
		}
	},
	{
		id: Quests.RecipeforDisasterMonkey,
		name: 'Recipe for Disaster - Freeing King Awowogei',
		time: Time.Minute * 40,
		requirements: {
			quests: [Quests.RecipeforDisasterCooks, Quests.MonkeyMadnessI],
			level: {
				[SkillsEnum.Cooking]: 70,
				[SkillsEnum.Agility]: 48
			}
		},
		rewards: {
			qp: 1,
			xp: {
				[SkillsEnum.Cooking]: 10_000,
				[SkillsEnum.Agility]: 10_000
			}
		}
	},
	{
		id: Quests.RecipeforDisasterSirAmik,
		name: 'Recipe for Disaster - Freeing Sir Amik Varze',
		time: Time.Minute * 44,
		requirements: {
			quests: [
				Quests.RecipeforDisasterCooks,
				Quests.LegendsQuest,
				Quests.FamilyCrest,
				Quests.HeroesQuest,
				Quests.ShiloVillage,
				Quests.UndergroundPass,
				Quests.WaterfallQuest
			],
			ironLevel: [{ [SkillsEnum.Farming]: 20 }]
		},
		rewards: {
			qp: 1,
			xp: {
				[SkillsEnum.Cooking]: 4000,
				[SkillsEnum.Hitpoints]: 4000
			}
		}
	},
	{
		id: Quests.RecipeforDisasterSkrach,
		name: 'Recipe for Disaster - Freeing Skrach Uglogwee',
		time: Time.Minute * 20,
		requirements: {
			quests: [Quests.RecipeforDisasterCooks, Quests.BigChompyBirdHunting],
			level: {
				[SkillsEnum.Cooking]: 41,
				[SkillsEnum.Firemaking]: 20
			}
		},
		rewards: {
			qp: 1,
			xp: {
				[SkillsEnum.Cooking]: 1500,
				[SkillsEnum.Woodcutting]: 1500,
				[SkillsEnum.Crafting]: 1500,
				[SkillsEnum.Ranged]: 1500
			}
		}
	},
	{
		id: Quests.RecipeforDisaster,
		name: 'Recipe for Disaster - Defeating the Culinaromancer',
		time: Time.Minute * 44,
		requirements: {
			qp: 175,
			quests: [
				Quests.RecipeforDisasterCooks,
				Quests.RecipeforDisasterDwarf,
				Quests.RecipeforDisasterGoblin,
				Quests.RecipeforDisasterPirate,
				Quests.RecipeforDisasterGuide,
				Quests.RecipeforDisasterDave,
				Quests.RecipeforDisasterMonkey,
				Quests.RecipeforDisasterSirAmik,
				Quests.RecipeforDisasterSkrach,
				Quests.DesertTreasure,
				Quests.HorrorfromtheDeep
			]
		},
		rewards: {
			qp: 1,
			customLogic: [
				{
					type: 'collect_reward',
					id: 1,
					function: msg => {
						return xpReward(msg, allSkills(20_000), allSkills(50));
					}
				}
			]
		}
	},
	{
		id: Quests.InAidoftheMyreque,
		name: 'In Aid of the Myreque',
		time: Time.Minute * 48,
		requirements: {
			quests: [Quests.InSearchoftheMyreque],
			level: {
				[SkillsEnum.Magic]: 7,
				[SkillsEnum.Crafting]: 25,
				[SkillsEnum.Mining]: 15
			},
			ironLevel: [{ [SkillsEnum.Smithing]: 50 }]
		},
		rewards: {
			qp: 2,
			xp: {
				[SkillsEnum.Attack]: 2000,
				[SkillsEnum.Strength]: 2000,
				[SkillsEnum.Crafting]: 2000,
				[SkillsEnum.Defence]: 2000
			},
			items: {
				Gadderhammer: 1,
				'Rod of ivandis(10)': 1
			}
		}
	},
	{
		id: Quests.ASoulsBane,
		name: "A Soul's Bane",
		time: Time.Minute * 37,
		requirements: {},
		rewards: { qp: 1, xp: { [SkillsEnum.Hitpoints]: 500, [SkillsEnum.Defence]: 500 }, items: { 995: 500 } }
	},
	{
		id: Quests.RagandBoneManI,
		name: 'Rag and Bone Man I',
		time: Time.Minute * 21,
		requirements: {},
		rewards: { qp: 1, xp: { [SkillsEnum.Cooking]: 500, [SkillsEnum.Prayer]: 500 } }
	},
	{
		id: Quests.RagandBoneManII,
		name: 'Rag and Bone Man II',
		time: Time.Minute * 127,
		// TODO - Add miniquest Miniquests.SkippyandtheMogres
		requirements: {
			quests: [
				Quests.RagandBoneManI,
				Quests.HorrorfromtheDeep,
				Quests.CreatureofFenkenstrain,
				Quests.ZogreFleshEaters,
				Quests.WaterfallQuest
			],
			level: {
				[SkillsEnum.Defence]: 20,
				[SkillsEnum.Slayer]: 40
			}
		},
		rewards: { qp: 1, xp: { [SkillsEnum.Prayer]: 5000 }, items: { Bonesack: 1, 'Ram skull helm': 1 } }
	},
	{
		id: Quests.SwanSong,
		name: 'Swan Song',
		time: Time.Minute * 43,
		requirements: {
			quests: [Quests.OneSmallFavour, Quests.GardenofTranquillity],
			qp: 100,
			level: {
				[SkillsEnum.Magic]: 66,
				[SkillsEnum.Cooking]: 62,
				[SkillsEnum.Fishing]: 62,
				[SkillsEnum.Smithing]: 45,
				[SkillsEnum.Firemaking]: 42,
				[SkillsEnum.Crafting]: 40
			}
		},
		rewards: {
			qp: 2,
			xp: {
				[SkillsEnum.Magic]: 15_000,
				[SkillsEnum.Prayer]: 10_000,
				[SkillsEnum.Fishing]: 10_000
			},
			items: {
				995: 25_000,
				'Brown apron': 1
			}
		}
	},
	{
		id: Quests.RoyalTrouble,
		name: 'Royal Trouble',
		time: Time.Minute * 37,
		requirements: {
			quests: [Quests.ThroneofMiscellania],
			level: {
				[SkillsEnum.Agility]: 40,
				[SkillsEnum.Slayer]: 40
			}
		},
		rewards: {
			qp: 1,
			xp: { [SkillsEnum.Agility]: 5000, [SkillsEnum.Slayer]: 5000, [SkillsEnum.Hitpoints]: 5000 },
			items: { 995: 20_000 }
		}
	},
	{
		id: Quests.DeathtotheDorgeshuun,
		name: 'Death to the Dorgeshuun',
		time: Time.Minute * 25,
		requirements: {
			quests: [Quests.TheLostTribe],
			level: {
				[SkillsEnum.Thieving]: 23,
				[SkillsEnum.Agility]: 23
			}
		},
		rewards: {
			qp: 1,
			xp: {
				[SkillsEnum.Thieving]: 2000,
				[SkillsEnum.Ranged]: 2000
			}
		}
	},
	{
		id: Quests.FairyTaleIICureaQueen,
		name: 'Fairy Tale II - Cure a Queen',
		time: Time.Minute * 37,
		requirements: {
			quests: [Quests.FairyTaleIGrowingPains],
			level: {
				[SkillsEnum.Thieving]: 40,
				[SkillsEnum.Farming]: 49,
				[SkillsEnum.Herblore]: 57
			}
		},
		rewards: {
			qp: 2,
			xp: {
				[SkillsEnum.Herblore]: 3500,
				[SkillsEnum.Thieving]: 2500
			},
			customLogic: [
				{
					type: 'collect_reward',
					id: 1,
					function: msg => {
						return xpReward(msg, allSkills(2500), allSkills(30));
					}
				}
			]
		}
	},
	{
		id: Quests.LunarDiplomacy,
		name: 'Lunar Diplomacy',
		time: Time.Minute * 94,
		requirements: {
			quests: [Quests.TheFremennikTrials, Quests.LostCity, Quests.RuneMysteries, Quests.ShiloVillage],
			level: {
				[SkillsEnum.Herblore]: 5,
				[SkillsEnum.Crafting]: 61,
				[SkillsEnum.Defence]: 40,
				[SkillsEnum.Firemaking]: 49,
				[SkillsEnum.Magic]: 65,
				[SkillsEnum.Mining]: 60,
				[SkillsEnum.Woodcutting]: 55
			}
		},
		rewards: {
			qp: 2,
			xp: {
				[SkillsEnum.Magic]: 5000,
				[SkillsEnum.Runecraft]: 5000
			},
			items: {
				'Seal of passage': 1,
				'Lunar amulet': 1,
				'Lunar ring': 1,
				'Lunar staff': 1,
				'Lunar helm': 1,
				'Lunar torso': 1,
				'Lunar legs': 1,
				'Lunar boots': 1,
				'Lunar gloves': 1,
				'Lunar cape': 1,
				'Astral rune': 50
			}
		}
	},
	{
		id: Quests.TheEyesofGlouphrie,
		name: 'The Eyes of Glouphrie',
		time: Time.Minute * 27,
		requirements: {
			quests: [Quests.TheGrandTree],
			level: {
				[SkillsEnum.Construction]: 5,
				[SkillsEnum.Magic]: 46
			},
			ironLevel: [
				{ [SkillsEnum.Woodcutting]: 45, [SkillsEnum.Runecraft]: 13 },
				{ [SkillsEnum.Firemaking]: 50, [SkillsEnum.Runecraft]: 13 }
			]
		},
		rewards: {
			qp: 2,
			xp: {
				[SkillsEnum.Magic]: 12_000,
				[SkillsEnum.Woodcutting]: 2500,
				[SkillsEnum.Runecraft]: 6000,
				[SkillsEnum.Construction]: 250
			},
			items: {
				'Crystal saw': 1
			}
		}
	},
	{
		id: Quests.DarknessofHallowvale,
		name: 'Darkness of Hallowvale',
		time: Time.Minute * 60,
		requirements: {
			quests: [Quests.InAidoftheMyreque],
			level: {
				[SkillsEnum.Construction]: 5,
				[SkillsEnum.Mining]: 20,
				[SkillsEnum.Thieving]: 22,
				[SkillsEnum.Agility]: 26,
				[SkillsEnum.Crafting]: 32,
				[SkillsEnum.Magic]: 33,
				[SkillsEnum.Strength]: 40
			}
		},
		rewards: {
			qp: 2,
			xp: {
				[SkillsEnum.Agility]: 7000,
				[SkillsEnum.Thieving]: 6000,
				[SkillsEnum.Construction]: 2000
			},
			customLogic: [1, 2, 3].map(id => {
				return {
					type: 'collect_reward',
					id,
					function: msg => {
						return xpReward(msg, allSkills(2000), allSkills(30));
					}
				};
			})
		}
	},
	{
		id: Quests.TheSlugMenace,
		name: 'The Slug Menace',
		time: Time.Minute * 30,
		requirements: {
			quests: [Quests.Wanted, Quests.SeaSlug],
			level: {
				[SkillsEnum.Crafting]: 30,
				[SkillsEnum.Runecraft]: 30,
				[SkillsEnum.Slayer]: 30,
				[SkillsEnum.Thieving]: 30
			}
		},
		rewards: {
			qp: 1,
			xp: {
				[SkillsEnum.Crafting]: 3500,
				[SkillsEnum.Runecraft]: 3500,
				[SkillsEnum.Thieving]: 3500
			},
			items: {
				'Proselyte sallet': 1,
				'Proselyte cuisse': 1,
				'Proselyte hauberk': 1
			}
		}
	},
	{
		id: Quests.ElementalWorkshopII,
		name: 'Elemental Workshop II',
		time: Time.Minute * 18,
		requirements: {
			quests: [Quests.ElementalWorkshopI],
			level: {
				[SkillsEnum.Magic]: 20,
				[SkillsEnum.Smithing]: 30
			}
		},
		rewards: {
			qp: 1,
			xp: {
				[SkillsEnum.Smithing]: 7500,
				[SkillsEnum.Crafting]: 7500
			},
			items: {
				'Mind shield': 1
			}
		}
	},
	{
		id: Quests.MyArmsBigAdventure,
		name: "My Arm's Big Adventure",
		time: Time.Minute * 34,
		// TODO - Add miniquest Miniquests.TaiBwoWannaiCleanup
		requirements: {
			quests: [Quests.EadgarsRuse, Quests.TheFeud, Quests.JunglePotion],
			level: {
				[SkillsEnum.Woodcutting]: 10,
				[SkillsEnum.Farming]: 29
			}
		},
		rewards: {
			qp: 1,
			xp: {
				[SkillsEnum.Herblore]: 10_000,
				[SkillsEnum.Farming]: 5000
			},
			items: { 'Burnt meat': 29 }
		}
	},
	{
		id: Quests.EnlightenedJourney,
		name: 'Enlightened Journey',
		time: Time.Minute * 13,
		requirements: {
			qp: 20,
			level: {
				[SkillsEnum.Firemaking]: 20,
				[SkillsEnum.Farming]: 30,
				[SkillsEnum.Crafting]: 36
			}
		},
		rewards: {
			qp: 1,
			xp: {
				[SkillsEnum.Crafting]: 2000,
				[SkillsEnum.Farming]: 3000,
				[SkillsEnum.Woodcutting]: 1500,
				[SkillsEnum.Firemaking]: 4000
			},
			items: {
				'Bomber jacket': 1,
				'Bomber cap': 1
			}
		}
	},
	{
		id: Quests.EaglesPeak,
		name: "Eagles' Peak",
		time: Time.Minute * 22,
		requirements: {
			level: {
				[SkillsEnum.Hunter]: 27
			}
		},
		rewards: {
			qp: 2,
			xp: {
				[SkillsEnum.Hunter]: 2500
			},
			items: {
				'Box trap': 1
			}
		}
	},
	{
		id: Quests.AnimalMagnetism,
		name: 'Animal Magnetism',
		time: Time.Minute * 22,
		requirements: {
			quests: [Quests.TheRestlessGhost, Quests.ErnesttheChicken, Quests.PriestinPeril],
			level: {
				[SkillsEnum.Slayer]: 18,
				[SkillsEnum.Crafting]: 19,
				[SkillsEnum.Ranged]: 30,
				[SkillsEnum.Woodcutting]: 35
			},
			ironLevel: [
				{ [SkillsEnum.Smithing]: 51, [SkillsEnum.Prayer]: 31 },
				{ [SkillsEnum.Thieving]: 28, [SkillsEnum.Prayer]: 31 },
				{ [SkillsEnum.Woodcutting]: 60, [SkillsEnum.Prayer]: 31 }
			]
		},
		rewards: {
			qp: 1,
			xp: {
				[SkillsEnum.Crafting]: 1000,
				[SkillsEnum.Fletching]: 1000,
				[SkillsEnum.Slayer]: 1000,
				[SkillsEnum.Woodcutting]: 2500
			},
			items: {
				"Ava's attractor": 1,
				"Ava's accumulator": 1
			}
		}
	},
	{
		id: Quests.Contact,
		name: 'Contact!',
		time: Time.Minute * 22,
		requirements: {
			quests: [Quests.PrinceAliRescue, Quests.IcthlarinsLittleHelper]
		},
		rewards: {
			qp: 1,
			xp: {
				[SkillsEnum.Thieving]: 7000
			},
			items: {
				Keris: 1
			},
			customLogic: [1, 2].map(id => {
				return {
					type: 'collect_reward',
					id,
					function: msg => {
						return xpReward(msg, {
							[SkillsEnum.Attack]: 7000,
							[SkillsEnum.Strength]: 7000,
							[SkillsEnum.Defence]: 7000,
							[SkillsEnum.Hitpoints]: 7000,
							[SkillsEnum.Ranged]: 7000,
							[SkillsEnum.Magic]: 7000
						});
					}
				};
			})
		}
	},
	{
		id: Quests.ColdWar,
		name: 'Cold War',
		time: Time.Minute * 31,
		requirements: {
			level: {
				[SkillsEnum.Hunter]: 10,
				[SkillsEnum.Agility]: 30,
				[SkillsEnum.Crafting]: 30,
				[SkillsEnum.Construction]: 34,
				[SkillsEnum.Thieving]: 15
			},
			ironLevel: [{ [SkillsEnum.Woodcutting]: 50 }]
		},
		rewards: {
			qp: 1,
			xp: {
				[SkillsEnum.Crafting]: 2000,
				[SkillsEnum.Agility]: 5000,
				[SkillsEnum.Construction]: 1500
			}
		}
	},
	{
		id: Quests.TheFremennikIsles,
		name: 'The Fremennik Isles',
		time: Time.Minute * 60,
		requirements: {
			quests: [Quests.TheFremennikTrials],
			level: {
				[SkillsEnum.Agility]: 40,
				[SkillsEnum.Construction]: 20
			},
			ironLevel: [{ [SkillsEnum.Woodcutting]: 56, [SkillsEnum.Crafting]: 46 }]
		},
		rewards: {
			qp: 1,
			xp: {
				[SkillsEnum.Construction]: 5000,
				[SkillsEnum.Crafting]: 5000,
				[SkillsEnum.Woodcutting]: 10_000
			},
			items: {
				'Helm of neitiznot': 1,
				'Silly jester hat': 1,
				'Silly jester top': 1,
				'Silly jester tights': 1,
				'Silly jester boots': 1
			},
			customLogic: [1, 2].map(id => {
				return {
					type: 'collect_reward',
					id,
					function: msg => {
						return xpReward(msg, {
							[SkillsEnum.Strength]: 10_000,
							[SkillsEnum.Attack]: 10_000,
							[SkillsEnum.Defence]: 10_000,
							[SkillsEnum.Hitpoints]: 10_000
						});
					}
				};
			})
		}
	},
	{
		id: Quests.TowerofLife,
		name: 'Tower of Life',
		time: Time.Minute * 25,
		requirements: {
			level: {
				[SkillsEnum.Construction]: 10
			}
		},
		rewards: {
			qp: 2,
			xp: {
				[SkillsEnum.Crafting]: 500,
				[SkillsEnum.Thieving]: 500,
				[SkillsEnum.Construction]: 1000
			},
			items: { 'hard hat': 1, "Builder's shirt": 1, "Builder's trousers": 1, "Builder's boots": 1 }
		}
	},
	{
		id: Quests.TheGreatBrainRobbery,
		name: 'The Great Brain Robbery',
		time: Time.Minute * 51,
		requirements: {
			quests: [Quests.CreatureofFenkenstrain, Quests.CabinFever, Quests.RecipeforDisasterPirate],
			level: {
				[SkillsEnum.Construction]: 30,
				[SkillsEnum.Crafting]: 16,
				[SkillsEnum.Prayer]: 50
			}
		},
		rewards: {
			qp: 2,
			xp: {
				[SkillsEnum.Crafting]: 3000,
				[SkillsEnum.Prayer]: 6000,
				[SkillsEnum.Construction]: 2000
			},
			// 10890 = Prayer book
			// 10887 = Barrelchest anchor
			items: { 10_887: 1, 10_890: 1 },
			customLogic: [
				{
					type: 'collect_reward',
					id: 1,
					function: msg => {
						return xpReward(msg, allSkills(5000), allSkills(30));
					}
				}
			]
		}
	},
	{
		id: Quests.WhatLiesBelow,
		name: 'What Lies Below',
		time: Time.Minute * 16,
		requirements: {
			quests: [Quests.RuneMysteries],
			level: {
				[SkillsEnum.Runecraft]: 35,
				[SkillsEnum.Mining]: 42
			}
		},
		rewards: {
			qp: 1,
			xp: {
				[SkillsEnum.Runecraft]: 8000,
				[SkillsEnum.Defence]: 2000
			},
			items: {
				// 11014 = Beacon ring
				11_014: 1
			}
		}
	},
	{
		id: Quests.OlafsQuest,
		name: "Olaf's Quest",
		time: Time.Minute * 25,
		requirements: {
			quests: [Quests.TheFremennikTrials],
			level: {
				[SkillsEnum.Firemaking]: 40,
				[SkillsEnum.Woodcutting]: 50
			}
		},
		rewards: {
			qp: 1,
			xp: {
				[SkillsEnum.Defence]: 12_000
			},
			items: {
				995: 20_000,
				Ruby: 4
			}
		}
	},
	{
		id: Quests.AnotherSliceofHAM,
		name: 'Another Slice of H.A.M.',
		time: Time.Minute * 27,
		requirements: {
			quests: [Quests.DeathtotheDorgeshuun, Quests.TheGiantDwarf, Quests.TheDigSite],
			level: {
				[SkillsEnum.Attack]: 15,
				[SkillsEnum.Prayer]: 25
			}
		},
		rewards: {
			qp: 1,
			xp: {
				[SkillsEnum.Mining]: 3000,
				[SkillsEnum.Prayer]: 3000
			},
			items: {
				'Ancient mace': 1
			}
		}
	},
	{
		id: Quests.DreamMentor,
		name: 'Dream Mentor',
		time: Time.Minute * 40,
		requirements: {
			combatLevel: 85,
			quests: [Quests.LunarDiplomacy, Quests.EadgarsRuse]
		},
		rewards: {
			qp: 2,
			xp: {
				[SkillsEnum.Hitpoints]: 15_000,
				[SkillsEnum.Magic]: 10_000
			},
			customLogic: [
				{
					type: 'collect_reward',
					id: 1,
					function: msg => {
						return xpReward(msg, {
							[SkillsEnum.Strength]: 15_000,
							[SkillsEnum.Defence]: 15_000,
							[SkillsEnum.Hitpoints]: 15_000,
							[SkillsEnum.Ranged]: 15_000,
							[SkillsEnum.Magic]: 15_000
						});
					}
				}
			]
		}
	},
	{
		id: Quests.GrimTales,
		name: 'Grim Tales',
		time: Time.Minute * 27,
		requirements: {
			quests: [Quests.WitchsHouse],
			level: {
				[SkillsEnum.Farming]: 45,
				[SkillsEnum.Herblore]: 52,
				[SkillsEnum.Thieving]: 58,
				[SkillsEnum.Agility]: 59,
				[SkillsEnum.Woodcutting]: 72
			}
		},
		rewards: {
			qp: 1,
			xp: {
				[SkillsEnum.Farming]: 4000,
				[SkillsEnum.Herblore]: 5000,
				[SkillsEnum.Hitpoints]: 5000,
				[SkillsEnum.Woodcutting]: 14_000,
				[SkillsEnum.Agility]: 6000,
				[SkillsEnum.Thieving]: 6000
			},
			items: {
				'Dwarven helmet': 1
			}
		}
	},
	{
		id: Quests.KingsRansom,
		name: "King's Ransom",
		time: Time.Minute * 21,
		requirements: {
			quests: [Quests.BlackKnightsFortress, Quests.HolyGrail, Quests.MurderMystery, Quests.OneSmallFavour],
			level: {
				[SkillsEnum.Magic]: 45,
				[SkillsEnum.Defence]: 65
			}
		},
		rewards: {
			qp: 1,
			xp: {
				[SkillsEnum.Defence]: 33_000,
				[SkillsEnum.Magic]: 5000
			},
			customLogic: [
				{
					type: 'collect_reward',
					id: 1,
					function: msg => {
						return xpReward(msg, allSkills(5000), allSkills(50));
					}
				}
			]
		}
	},
	{
		id: Quests.MonkeyMadnessII,
		name: 'Monkey Madness II',
		time: Time.Minute * 195,
		requirements: {
			quests: [
				Quests.EnlightenedJourney,
				Quests.TheEyesofGlouphrie,
				Quests.RecipeforDisasterMonkey,
				Quests.TrollStronghold,
				Quests.Watchtower
			],
			level: {
				[SkillsEnum.Slayer]: 69,
				[SkillsEnum.Crafting]: 70,
				[SkillsEnum.Hunter]: 60,
				[SkillsEnum.Agility]: 55,
				[SkillsEnum.Thieving]: 55,
				[SkillsEnum.Firemaking]: 60
			}
		},
		rewards: {
			qp: 4,
			xp: {
				[SkillsEnum.Slayer]: 25_000,
				[SkillsEnum.Agility]: 20_000,
				[SkillsEnum.Thieving]: 15_000,
				[SkillsEnum.Hunter]: 15_000
			},
			customLogic: [1, 2].map(id => {
				return {
					type: 'collect_reward',
					id,
					function: msg => {
						return xpReward(msg, {
							[SkillsEnum.Magic]: 50_000,
							[SkillsEnum.Ranged]: 50_000,
							[SkillsEnum.Attack]: 50_000,
							[SkillsEnum.Defence]: 50_000,
							[SkillsEnum.Strength]: 50_000,
							[SkillsEnum.Hitpoints]: 50_000
						});
					}
				};
			})
		}
	},
	{
		id: Quests.MisthalinMystery,
		name: 'Misthalin Mystery',
		time: Time.Minute * 19,
		requirements: {},
		rewards: {
			qp: 1,
			xp: { [SkillsEnum.Crafting]: 600 },
			items: { 'Uncut ruby': 1, 'Uncut emerald': 1, 'Uncut sapphire': 1 }
		}
	},
	{
		id: Quests.ClientofKourend,
		name: 'Client of Kourend',
		time: Time.Minute * 21,
		requirements: {
			quests: [Quests.XMarkstheSpot]
		},
		rewards: {
			qp: 1,
			items: {
				"Kharedst's memoirs": 1
			},
			// TODO - Add Kourend favour certificate when favours are added
			customLogic: [1, 2].map(id => {
				return {
					type: 'collect_reward',
					id,
					function: msg => {
						return xpReward(msg, allSkills(500));
					}
				};
			})
		}
	},
	{
		id: Quests.BoneVoyage,
		name: 'Bone Voyage',
		time: Time.Minute * 15,
		requirements: {
			quests: [Quests.TheDigSite]
		},
		rewards: { qp: 1 }
	},
	{
		id: Quests.TheQueenofThieves,
		name: 'The Queen of Thieves',
		time: Time.Minute * 15,
		requirements: {
			quests: [Quests.ClientofKourend],
			level: {
				[SkillsEnum.Thieving]: 20
			}
		},
		rewards: {
			qp: 1,
			xp: {
				[SkillsEnum.Thieving]: 2000
			},
			items: { 995: 2000 }
		}
	},
	{
		id: Quests.TheDepthsofDespair,
		name: 'The Depths of Despair',
		time: Time.Minute * 16,
		requirements: {
			quests: [Quests.ClientofKourend],
			level: {
				[SkillsEnum.Agility]: 18
			}
		},
		rewards: { qp: 1, xp: { [SkillsEnum.Agility]: 1500 }, items: { 995: 4000 } }
	},
	{
		id: Quests.TheCorsairCurse,
		name: 'The Corsair Curse',
		time: Time.Minute * 21,
		requirements: {},
		rewards: { qp: 2 }
	},
	{
		id: Quests.DragonSlayerII,
		name: 'Dragon Slayer II',
		time: Time.Minute * 166,
		requirements: {
			qp: 200,
			level: {
				[SkillsEnum.Magic]: 75,
				[SkillsEnum.Smithing]: 70,
				[SkillsEnum.Mining]: 68,
				[SkillsEnum.Crafting]: 62,
				[SkillsEnum.Agility]: 60,
				[SkillsEnum.Thieving]: 60,
				[SkillsEnum.Construction]: 50,
				[SkillsEnum.Hitpoints]: 50
			},
			quests: [
				Quests.LegendsQuest,
				Quests.DreamMentor,
				Quests.ATailofTwoCats,
				Quests.AnimalMagnetism,
				Quests.GhostsAhoy,
				Quests.BoneVoyage,
				Quests.ClientofKourend
			]
		},
		rewards: {
			qp: 5,
			xp: {
				[SkillsEnum.Smithing]: 25_000,
				[SkillsEnum.Mining]: 18_000,
				[SkillsEnum.Agility]: 15_000,
				[SkillsEnum.Thieving]: 15_000
			},
			customLogic: [1, 2, 3, 4].map(id => {
				return {
					type: 'collect_reward',
					id,
					function: msg => {
						return xpReward(msg, {
							[SkillsEnum.Magic]: 25_000,
							[SkillsEnum.Ranged]: 25_000,
							[SkillsEnum.Strength]: 25_000,
							[SkillsEnum.Attack]: 25_000,
							[SkillsEnum.Defence]: 25_000,
							[SkillsEnum.Hitpoints]: 25_000
						});
					}
				};
			})
		}
	},
	{
		id: Quests.TaleoftheRighteous,
		name: 'Tale of the Righteous',
		time: Time.Minute * 16,
		requirements: {
			quests: [Quests.ClientofKourend],
			level: { [SkillsEnum.Strength]: 16, [SkillsEnum.Mining]: 10 }
		},
		rewards: { qp: 1, items: { 995: 8000, 'Xerician fabric': 3 } }
	},
	{
		id: Quests.ATasteofHope,
		name: 'A Taste of Hope',
		time: Time.Minute * 39,
		requirements: {
			quests: [Quests.DarknessofHallowvale],
			level: {
				[SkillsEnum.Crafting]: 48,
				[SkillsEnum.Agility]: 45,
				[SkillsEnum.Attack]: 40,
				[SkillsEnum.Herblore]: 40,
				[SkillsEnum.Slayer]: 38
			}
		},
		rewards: {
			qp: 1,
			items: { 'Ivandis flail': 1, "Drakan's medallion": 1 },
			customLogic: [1, 2, 3].map(id => {
				return {
					type: 'collect_reward',
					id,
					function: msg => {
						return xpReward(msg, allSkills(2500), allSkills(35));
					}
				};
			})
		}
	},
	{
		id: Quests.MakingFriendswithMyArm,
		name: 'Making Friends with My Arm',
		time: Time.Minute * 39,
		requirements: {
			quests: [Quests.MyArmsBigAdventure, Quests.SwanSong, Quests.ColdWar, Quests.RomeoAndJuliet],
			level: {
				[SkillsEnum.Firemaking]: 66,
				[SkillsEnum.Mining]: 72,
				[SkillsEnum.Construction]: 35,
				[SkillsEnum.Agility]: 68
			}
		},
		rewards: {
			qp: 2,
			xp: {
				[SkillsEnum.Construction]: 2000,
				[SkillsEnum.Firemaking]: 5000,
				[SkillsEnum.Mining]: 10_000,
				[SkillsEnum.Agility]: 10_000
			}
		}
	},
	{
		id: Quests.TheForsakenTower,
		name: 'The Forsaken Tower',
		time: Time.Minute * 19,
		requirements: {
			quests: [Quests.ClientofKourend]
		},
		rewards: {
			qp: 1,
			xp: {
				[SkillsEnum.Mining]: 500,
				[SkillsEnum.Smithing]: 500
			},
			items: { 995: 6000 }
		}
	},
	{
		id: Quests.TheAscentofArceuus,
		name: 'The Ascent of Arceuus',
		time: Time.Minute * 21,
		requirements: {
			quests: [Quests.ClientofKourend],
			level: {
				[SkillsEnum.Hunter]: 12
			}
		},
		rewards: {
			qp: 1,
			xp: {
				[SkillsEnum.Hunter]: 1500,
				[SkillsEnum.Runecraft]: 500
			},
			items: { 995: 2000 }
		}
	},
	{
		id: Quests.XMarkstheSpot,
		name: 'X Marks the Spot',
		time: Time.Minute * 4,
		requirements: {},
		rewards: {
			qp: 1,
			items: { 995: 200 },
			customLogic: [{ type: 'collect_reward', id: 1, function: msg => xpReward(msg, allSkills(300)) }]
		}
	},
	{
		id: Quests.SongoftheElves,
		name: 'Song of the Elves',
		time: Time.Minute * 202,
		requirements: {
			quests: [Quests.MourningsEndPartII, Quests.MakingHistory],
			level: {
				[SkillsEnum.Agility]: 70,
				[SkillsEnum.Construction]: 70,
				[SkillsEnum.Farming]: 70,
				[SkillsEnum.Herblore]: 70,
				[SkillsEnum.Hunter]: 70,
				[SkillsEnum.Mining]: 70,
				[SkillsEnum.Smithing]: 70,
				[SkillsEnum.Woodcutting]: 70
			}
		},
		rewards: {
			qp: 4,
			xp: {
				[SkillsEnum.Agility]: 20_000,
				[SkillsEnum.Construction]: 20_000,
				[SkillsEnum.Farming]: 20_000,
				[SkillsEnum.Herblore]: 20_000,
				[SkillsEnum.Hunter]: 20_000,
				[SkillsEnum.Mining]: 20_000,
				[SkillsEnum.Smithing]: 20_000,
				[SkillsEnum.Woodcutting]: 20_000
			}
		}
	},
	{
		id: Quests.TheFremennikExiles,
		name: 'The Fremennik Exiles',
		time: Time.Minute * 45,
		requirements: {
			quests: [Quests.TheFremennikIsles, Quests.LunarDiplomacy, Quests.MountainDaughter, Quests.HeroesQuest],
			level: {
				[SkillsEnum.Crafting]: 65,
				[SkillsEnum.Slayer]: 60,
				[SkillsEnum.Smithing]: 60,
				[SkillsEnum.Fishing]: 60,
				[SkillsEnum.Runecraft]: 55
			}
		},
		rewards: {
			qp: 2,
			items: { "V's shield": 1 },
			xp: { [SkillsEnum.Slayer]: 15_000, [SkillsEnum.Crafting]: 15_000, [SkillsEnum.Runecraft]: 5000 }
		}
	},
	{
		id: Quests.SinsoftheFather,
		name: 'Sins of the Father',
		time: Time.Minute * 87,
		requirements: {
			quests: [Quests.VampyreSlayer, Quests.ATasteofHope],
			level: {
				[SkillsEnum.Woodcutting]: 62,
				[SkillsEnum.Fletching]: 60,
				[SkillsEnum.Crafting]: 56,
				[SkillsEnum.Agility]: 52,
				[SkillsEnum.Attack]: 50,
				[SkillsEnum.Slayer]: 50,
				[SkillsEnum.Magic]: 49
			}
		},
		rewards: {
			qp: 2,
			items: { 'Blisterwood flail': 1 },
			customLogic: [1, 2, 3].map(id => {
				return { type: 'collect_reward', id, function: msg => xpReward(msg, allSkills(15_000), allSkills(60)) };
			})
		}
	},
	{
		id: Quests.APorcineofInterest,
		name: 'A Porcine of Interest',
		time: Time.Minute * 7,
		requirements: {},
		rewards: { qp: 1, items: { 995: 5000 }, xp: { [SkillsEnum.Slayer]: 1000 } }
	},
	{
		id: Quests.GettingAhead,
		name: 'Getting Ahead',
		time: Time.Minute * 9,
		requirements: {
			level: {
				[SkillsEnum.Construction]: 26,
				[SkillsEnum.Crafting]: 30
			}
		},
		rewards: { qp: 1, items: { 995: 1000 }, xp: { [SkillsEnum.Crafting]: 4000, [SkillsEnum.Construction]: 3200 } }
	},
	{
		id: Quests.BelowIceMountain,
		name: 'Below Ice Mountain',
		time: Time.Minute * 15,
		requirements: {
			qp: 16
		},
		rewards: { qp: 1, items: { 995: 2000 } }
	},
	{
		id: Quests.ANightattheTheatre,
		name: 'A Night at the Theatre',
		time: Time.Minute * 39,
		requirements: {
			combatLevel: 90,
			quests: [Quests.PriestinPeril]
		},
		rewards: {
			qp: 2,
			customLogic: [1, 2].map(id => {
				return {
					type: 'collect_reward',
					id,
					function: msg =>
						xpReward(msg, {
							[SkillsEnum.Attack]: 20_000,
							[SkillsEnum.Strength]: 20_000,
							[SkillsEnum.Defence]: 20_000,
							[SkillsEnum.Ranged]: 20_000,
							[SkillsEnum.Magic]: 20_000,
							[SkillsEnum.Hitpoints]: 20_000
						})
				};
			})
		}
	},
	{
		id: Quests.AKingdomDivide,
		name: 'A Kingdom Divided',
		time: Time.Minute * 90,
		requirements: {
			quests: [
				Quests.TheDepthsofDespair,
				Quests.TheQueenofThieves,
				Quests.TheAscentofArceuus,
				Quests.TheForsakenTower,
				Quests.TaleoftheRighteous
			],
			level: {
				[SkillsEnum.Agility]: 54,
				[SkillsEnum.Thieving]: 52,
				[SkillsEnum.Woodcutting]: 52,
				[SkillsEnum.Herblore]: 50,
				[SkillsEnum.Mining]: 42,
				[SkillsEnum.Crafting]: 38,
				[SkillsEnum.Magic]: 35
			}
		},
		// 25818 = Book of the dead
		rewards: {
			qp: 2,
			items: { 25_818: 1 },
			customLogic: [
				{ type: 'collect_reward', id: 1, function: msg => xpReward(msg, allSkills(10_000), allSkills(40)) }
			]
		}
	}
];

export const MAXQP = QuestList.map(q => q.rewards.qp).reduce(
	(previousValue, currentValue) => previousValue + currentValue
);

function allSkills(xpOrLevel: number): Skills {
	const toReturn = <Partial<Skills>>{};
	objectKeys(SkillsEnum).map(s => {
		toReturn[s.toLowerCase() as SkillsEnum] = xpOrLevel;
	});
	return toReturn;
}

async function xpReward(msg: KlasaMessage, skills: Skills | Skills[], requirements?: Skills) {
	const selectedMessage = await msg.channel.send({
		content: 'Please, select your reward from the list below.',
		components: [
			[
				new MessageSelectMenu({
					type: 3,
					customID: 'xpSelect',
					options: Array.isArray(skills)
						? skills.map((opts, index) => {
								return {
									label: `Option ${index + 1}`,
									description: `${objectKeys(opts).join(', ')}`,
									value: `${index}`,
									emoji: skillEmoji[objectKeys(opts)[0]]
								};
						  })
						: objectEntries(skills).map(skill => {
								const hasReq =
									msg.author.skillLevel(skill[0]) >
									(requirements && requirements[skill[0]] ? requirements[skill[0]]! : 0);
								return {
									label: `${skill[1]!.toLocaleString()} in ${skill[0].toString()}`,
									description: `${
										hasReq ? 'You can collect this!' : `You need level ${requirements![skill[0]]}.`
									}`,
									value: `${skill[0]}`,
									emoji: hasReq ? skillEmoji[skill[0]] : Emoji.RedX
								};
						  }),
					placeholder: 'Select a reward...'
				})
			]
		]
	});
	try {
		const selection = await selectedMessage.awaitMessageComponentInteraction({
			filter: i => {
				if (i.user.id !== msg.author.id) {
					i.reply({
						ephemeral: true,
						content:
							'This reward is not for you. To check if you have any rewards missing collection, do +quest collect'
					});
					return false;
				}
				return true;
			},
			time: Time.Second * 15
		});
		if (selection.isSelectMenu() && selection.values) {
			const selectedSlot = selection.values[0];
			let xpAwarded = '';
			if (Array.isArray(skills)) {
				const _skillsToAdd = skills[Number(selectedSlot)];
				for (const _skill of objectEntries(_skillsToAdd)) {
					xpAwarded += await msg.author.addXP({
						skillName: _skill[0],
						amount: _skill[1]!
					});
				}
			} else {
				xpAwarded += await msg.author.addXP({
					skillName: selectedSlot as SkillsEnum,
					amount: skills[selectedSlot as SkillsEnum]!
				});
			}
			await selectedMessage.edit({ components: [], content: `You got rewarded ${xpAwarded}.` });
			return true;
		}
		await selectedMessage.edit({ components: [], content: 'This is not a valid option.' });
		return false;
	} catch (e) {
		await selectedMessage.edit({ components: [], content: 'Please, try again.' });
		return false;
	}
}

function meetQuestRequirements(quest: IQuest, user: KlasaUser) {
	// Check requirements
	const requirementsFailure: string[] = [];
	const skills: string[] = [];
	const quests: string[] = [];

	if (quest.requirements?.combatLevel && quest.requirements?.combatLevel > user.combatLevel) {
		skills.push(`${Emoji.CombatSword} ${quest.requirements?.combatLevel}`);
	}

	// Skills
	if (quest.requirements?.level) {
		for (const [skill, level] of objectEntries(quest.requirements.level)) {
			if (user.skillLevel(skill) < level!) {
				skills.push(`${formatSkillRequirements({ [skill]: level! })} (You are **${user.skillLevel(skill)}**)`);
			}
		}
	}

	// Quest Points
	const userQP = user.settings.get(UserSettings.QP);
	if (quest.requirements?.qp && userQP < quest.requirements?.qp) {
		skills.push(`${Emoji.QuestIcon} **${quest.requirements?.qp}** QP (You have **${userQP ?? 0}**)`);
	}

	if (skills.length > 0) {
		requirementsFailure.push('**Stats**: ');
		requirementsFailure.push(skills.join(', '));
	}

	// Quests
	if (quest.requirements?.quests) {
		let questsMissing: IQuest[] = [];
		for (const q of quest.requirements?.quests) {
			const questsDone = user.settings.get(UserSettings.Quests);
			if (!questsDone.includes(q)) {
				questsMissing.push(QuestList.find(_q => _q.id === q)!);
			}
		}
		if (questsMissing.length > 0) {
			quests.push(`${questsMissing.map(q => q.name).join(', ')}`);
		}
	}

	if (quests.length > 0) {
		requirementsFailure.push('**Quests**: ');
		requirementsFailure.push(quests.join(', '));
	}

	return requirementsFailure;
}

async function completeUserQuestID(user: KlasaUser, questID: number) {
	const mainQuest = QuestList.find(q => q.id === questID);
	if (mainQuest) await user.addQP(mainQuest.rewards.qp);
	return user.settings.update(UserSettings.Quests, questID, {
		arrayAction: 'add'
	});
}

async function grandfatherUser(msg: KlasaMessage) {
	let tempQuestList = [...QuestList];
	tempQuestList.sort((a, b) => b.rewards.qp - a.rewards.qp);
	let userNewQp = 0;
	let userMaxQp = msg.author.settings.get(UserSettings.QP);
	let questsDone: number[] = [];
	let i = 0;

	let xpToReceive: Skills = {};
	let itemsToReceive = new Bank();

	while (userNewQp < userMaxQp) {
		let questAdded = false;
		tempQuestLoop: for (let index = 0; index < tempQuestList.length; index++) {
			const value = tempQuestList[index];
			if (value.requirements?.qp && userNewQp < value.requirements?.qp) continue;
			if (value.requirements?.quests) {
				for (const q of value.requirements?.quests) {
					if (!questsDone.includes(q)) {
						continue tempQuestLoop;
					}
				}
			}
			i++;
			questAdded = true;
			questsDone.push(value.id);
			userNewQp += value.rewards.qp;

			// Get custom rewards
			if (value.rewards.customLogic) {
				for (const customReward of value.rewards.customLogic)
					if (customReward.type === 'collect_reward') questsDone.push(value.id + customReward.id);
			}
			// Get item rewarded
			if (value.rewards.items) itemsToReceive.add(resolveBank(value.rewards.items));
			// Get xp that were to be rewarded
			if (value.rewards.xp)
				for (const [skill, xp] of objectEntries(value.rewards.xp))
					xpToReceive[skill] = (xpToReceive[skill] ?? 0) + xp!;

			delete tempQuestList[index];
			break;
		}
		tempQuestList = tempQuestList.filter(q => q !== undefined);
		if (!questAdded) break;
	}

	await msg.confirm(
		`You are about to convert your old quest points into the new Quest system.
Your current quest point is **${userMaxQp}**. That will be converted into ${userNewQp}, from a total of ${i} quests.
**You will not receive any reward from having these quests completed.**
If you want to receve quest rewards, you'll have to start over in the new quest system.
For that, you'll have **ONE** chance to reset your quest points and start over.
In your first quest trip after clicking Confirm below, you'll receive the option to reset or not..`
	);
	questsDone.push(Quests.Grandfathered);
	await msg.author.settings.update(UserSettings.QP, userNewQp);
	await msg.author.settings.update(UserSettings.Quests, questsDone, {
		arrayAction: 'overwrite'
	});

	return msg.channel.send('Your quests have been updated.');
}

export default class extends BotCommand {
	public constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {
			usage: '[collect|log] [quest:...string]',
			aliases: ['q'],
			usageDelim: ' ',
			subcommands: true
		});
	}

	async log(msg: KlasaMessage, [_cmd]: [string]) {
		await msg.author.settings.sync(true);
		const userQuests = msg.author.settings.get(UserSettings.Quests);
		let result = `Current QP: ${msg.author.settings.get(UserSettings.QP)} / ${MAXQP}\n`;
		for (const quest of QuestList) {
			result += `${userQuests.includes(quest.id) ? '[DONE]' : ''} ${quest.name}\n`;
		}
		result = String(result);
		console.log(Boolean(msg), _cmd);
		return msg.channel.send(result);
	}

	@requiresMinion
	@minionNotBusy
	async collect(msg: KlasaMessage, [_cmd]: [string]) {
		console.log('collect', _cmd);
		const questsDone = msg.author.settings.get(UserSettings.Quests);
		if (!_cmd) {
			const canCollect = [];
			for (const questsDoneKey of QuestList) {
				const quest = QuestList.find(q => q.id === questsDoneKey.id)!;
				const { customLogic } = quest.rewards;
				if (customLogic) {
					for (const data of customLogic) {
						if (
							data.type === 'collect_reward' &&
							questsDone.includes(quest.id) &&
							!questsDone.includes(quest.id + data.id)
						) {
							canCollect.push(`\`?q collect ${quest.name.toLowerCase()} ${data.id}\``);
						}
					}
				}
			}
			return msg.channel.send({
				content: `${
					canCollect.length > 0
						? `You can collect the following rewards: ${canCollect.join(', ')}`
						: 'Nothing to collect.'
				}`
			});
		}
		const explodedCmd = _cmd.split(' ');
		const rewardId = explodedCmd.pop();
		const questName = explodedCmd.join(' ');
		const quest = QuestList.find(q => stringMatches(q.name, questName) || q.id === Number(questName));
		if (!questName || !quest) {
			return msg.channel.send(
				`There is no quest called **${_cmd}**. Look on your \`+questlog\` for more infrmation on what adventures you can go!`
			);
		}

		if (!questsDone.includes(quest.id)) {
			return msg.channel.send('You have not completed this quest.');
		}

		if (!quest.rewards.customLogic || !quest.rewards.customLogic.find(c => c.type === 'collect_reward')) {
			return msg.channel.send('This quest have no collectable reward.');
		}

		const reward = quest.rewards.customLogic.find(
			c => c.type === 'collect_reward' && c.id === Number(rewardId)
		) as ICustomRewardCollect;

		if (!reward) {
			return msg.channel.send(
				`This is not a valid reward to collect. Valid options are: ${quest.rewards.customLogic.map(
					c => `?q collect ${quest.name.toLowerCase()} ${c.type === 'collect_reward' ? c.id : ''}`
				)}`
			);
		}

		if (questsDone.includes(quest.id + reward.id)) {
			return msg.channel.send('You already collected this reward.');
		}

		if (await reward.function(msg)) await completeUserQuestID(msg.author, quest.id + reward.id);
	}

	@requiresMinion
	@minionNotBusy
	async run(msg: KlasaMessage, [_quest]: [string]) {
		console.log('run', _quest);
		let quest: IQuest | undefined = undefined;
		await msg.author.settings.sync(true);
		const questsDone = msg.author.settings.get(UserSettings.Quests);

		if (questsDone.length === 0 && msg.author.settings.get(UserSettings.QP) > 0) {
			return grandfatherUser(msg);
		}

		if (questsDone.includes(Quests.Grandfathered)) {
			const message = await msg.channel.send({
				content:
					'You still have the option to reset your quests. Are you sure you want to do a quest anyway?\n**If you press yes, you wont be able to reset anymore! You have been warned!**',
				components: [
					[
						new MessageButton({
							type: 'BUTTON',
							customID: 'doitanyway',
							style: 'PRIMARY',
							label: 'Yes, I do not want to reset'
						}),
						new MessageButton({
							type: 'BUTTON',
							customID: 'takemeoutofhere',
							style: 'SECONDARY',
							label: 'Not sure yet, take me out of here.'
						}),
						new MessageButton({
							type: 'BUTTON',
							customID: 'resetme',
							style: 'DANGER',
							label: 'No, I want to reset my quests!'
						})
					]
				]
			});
			try {
				const selection = await message.awaitMessageComponentInteraction({
					filter: i => {
						if (i.user.id !== msg.author.id) {
							i.reply({ ephemeral: true, content: 'This is not your confirmation message.' });
							return false;
						}
						return true;
					}
				});
				if (selection.customID === 'resetme') {
					await msg.author.settings.update(UserSettings.QP, 0);
					await msg.author.settings.update(UserSettings.Quests, [], { arrayAction: 'overwrite' });
					return message.edit({
						content:
							'You now have 0 quest points. You can start doing quests by issuing `+q` or choosing a quest by hand, by doing, for example, `+q waterfall quest`.',
						components: []
					});
				}
				if (selection.customID === 'takemeoutofhere') {
					return message.edit({
						content: "You'll be asked again the next time you try to do a quest trip.",
						components: []
					});
				}
				await message.delete();
			} catch (e) {
				return message.edit({
					content: "You'll be asked again the next time you try to do a quest trip.",
					components: []
				});
			}
		}

		if (questsDone.length === QuestList.length) {
			return msg.channel.send('You have done all the quests! Congratulations!');
		}
		if (!_quest) {
			for (const q of QuestList) {
				if (questsDone.includes(q.id)) continue;
				if (meetQuestRequirements(q, msg.author).length === 0) {
					quest = q;
					break;
				}
			}
			if (!quest) {
				return msg.channel.send('You dont have the requirements to do any quest at the moment!');
			}
		} else {
			quest = QuestList.find(q => stringMatches(q.name, _quest) || q.id === Number(_quest));
			if (!quest) {
				return msg.channel.send(
					`There is no quest called **${_quest}**. Look on your \`+questlog\` for more infrmation on what adventures you can go!`
				);
			}
			if (questsDone.includes(quest.id)) {
				return msg.channel.send(`You already completed the quest **${quest.name}**.`);
			}
			const requirementsFailure = meetQuestRequirements(quest, msg.author);
			if (requirementsFailure.length > 0) {
				return msg.channel.send(
					`You do not meet all the requirements for the quest **${
						quest.name
					}**. You are missing:\n${requirementsFailure.join('\n')}`
				);
			}
		}

		// Give rewards
		// xp
		if (quest.rewards?.xp) {
			for (const [skill, amount] of Object.entries(quest.rewards.xp)) {
				await msg.author.addXP({ skillName: skill as SkillsEnum, amount });
			}
		}
		// items
		if (quest.rewards?.items) {
			await msg.author.addItemsToBank(resolveBank(quest.rewards.items));
		}

		await completeUserQuestID(msg.author, quest.id);

		// Custom reward
		let customRewardString = '';
		if (quest.rewards.customLogic) {
			for (const reward of quest.rewards.customLogic) {
				if (reward.type === 'direct_reward') {
					const customReward = reward.function();
					switch (customReward[0]) {
						case 'xp': {
							for (const [skill, amount] of Object.entries(customReward[1])) {
								await msg.author.addXP({ skillName: skill as SkillsEnum, amount });
							}
							customRewardString += formatSkillRequirements(customReward[1]);
							break;
						}
						case 'item': {
							const { itemsAdded } = await msg.author.addItemsToBank(resolveBank(customReward[1]));
							customRewardString += new Bank(itemsAdded).toString();
							break;
						}
					}
				}
			}
		}

		// if (quest.rewards.customLogic) {
		// 	for (const [id, f] of objectEntries(quest.rewards.customLogic)) {
		// 		if (!(await userHasQuestID(msg.author, quest.id + id))) {
		// 			if (await f(msg)) await completeUserQuestID(msg.author, quest.id + id);
		// 			break;
		// 		}
		// 	}
		// }

		return msg.channel.send(
			`Your minion would be doing **${quest.name}** quest. You would receive: ${quest.rewards?.qp} QP${
				quest.rewards?.xp ? `, ${formatSkillRequirements(quest.rewards?.xp)}` : ''
			}${quest.rewards?.items ? `, ${new Bank(quest.rewards?.items)}` : ''}${customRewardString}`
		);
	}
}
