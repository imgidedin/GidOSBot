import { Task } from 'klasa';

import {
	addLFGLoot,
	addLFGNoDrops,
	addLFGText,
	availableQueues,
	prepareLFGMessage,
	sendLFGMessages
} from '../../lib/lfg/LfgUtils';
import { LfgStatusTable } from '../../lib/typeorm/LfgStatusTable.entity';
import { LfgActivityTaskOptions } from '../../lib/types/minions';

function mergeLoot(loot_a: Record<string, number>, loot_b: Record<string, number>) {
	const result = loot_a;
	Object.entries(loot_b).forEach(data => {
		result[data[0]] = (result[data[0]] ?? 0) + data[1];
	});
	return result;
}

export default class extends Task {
	async run(data: LfgActivityTaskOptions) {
		const { queueId } = data;
		const lfgQueue = availableQueues.find(queue => queue.uniqueID === queueId)!;

		let extra = lfgQueue.extraParams;

		// Add extra params to the activity
		let handleData = {
			...data,
			...extra,
			...data.extras
		};

		let lootString = prepareLFGMessage(lfgQueue.name, data.quantity, data.channels);

		const { usersWithLoot, usersWithoutLoot, extraMessage } = await lfgQueue.lfgClass.HandleTripFinish({
			data: handleData,
			client: this.client,
			queue: lfgQueue
		});

		let totalLoot: Record<string, number> = {};

		usersWithLoot.forEach(e => {
			if (typeof e.lootedItems === 'string') {
				const validString = e.lootedItems.split('.')[0] ?? '';
				const [qty, item] = validString.split('x').map(s => s.trim());
				totalLoot = mergeLoot(totalLoot, { [item]: Number(qty) });
			} else {
				totalLoot = mergeLoot(totalLoot, e.lootedItems.bank);
			}
			lootString = addLFGLoot(
				lootString,
				e.emoji,
				e.user,
				e.lootedItems.toString(),
				e.spoiler ?? true,
				data.channels
			);
		});

		if (usersWithoutLoot) {
			lootString = await addLFGNoDrops(lootString, this.client, usersWithoutLoot, data.channels);
		}

		if (extraMessage) {
			lootString = addLFGText(lootString, extraMessage, data.channels);
		}

		// Update global statistics
		let table = await LfgStatusTable.findOne(lfgQueue.uniqueID);
		if (!table) {
			table = new LfgStatusTable();
			table.id = lfgQueue.uniqueID;
		}
		table.qtyKilledDone = (table.qtyKilledDone ?? 0) + data.quantity;
		table.timesSent = (table.timesSent ?? 0) + 1;
		table.usersServed = (table.usersServed ?? 0) + data.users.length;
		table.lootObtained = mergeLoot(table.lootObtained ?? {}, totalLoot);
		await table.save();

		await sendLFGMessages(lootString, this.client, data.channels);
	}
}