import { registerFont } from 'canvas';
import { Canvas } from 'canvas-constructor';
import { MessageAttachment } from 'discord.js';
import * as fs from 'fs';

import { canvasImageFromBuffer } from './canvasUtil';

registerFont('./src/lib/resources/osrs-font-quill-8.ttf', { family: 'Regular' });

export const textBoxFile = fs.readFileSync('./src/lib/resources/images/textbox.png');
const mejJalChatHead = fs.readFileSync('./src/lib/resources/images/mejJal.png');
const janeChatHead = fs.readFileSync('./src/lib/resources/images/jane.png');
const santaChatHead = fs.readFileSync('./src/lib/resources/images/santa.png');
const izzyChatHead = fs.readFileSync('./src/lib/resources/images/izzy.png');
const alryTheAnglerChatHead = fs.readFileSync('./src/lib/resources/images/alryTheAngler.png');
// const monkeyChatHead = fs.readFileSync('./src/lib/resources/images/monkey.png');
const monkeyChildChatHead = fs.readFileSync('./src/lib/resources/images/monkeychild.png');

export const chatHeads = {
	mejJal: mejJalChatHead,
	jane: janeChatHead,
	santa: santaChatHead,
	izzy: izzyChatHead,
	alry: alryTheAnglerChatHead,
	// monkey: monkeyChildChatHead,
	placeHolderName: monkeyChildChatHead
};

const names: Record<keyof typeof chatHeads, string> = {
	mejJal: 'TzHaar-Mej-Jal',
	jane: 'Guildmaster Jane',
	santa: 'Santa',
	izzy: "Cap'n Izzy No-Beard",
	alry: 'Alry the Angler',
	placeHolderName: 'placeHolderName'
};

export default async function chatHeadImage({ content, head }: { content: string; head: keyof typeof chatHeads }) {
	const canvas = new Canvas(519, 142);
	canvas.context.imageSmoothingEnabled = false;
	const headImage = await canvasImageFromBuffer(chatHeads[head]);
	const bg = await canvasImageFromBuffer(textBoxFile);

	const image = await canvas
		.addImage(bg as any, 0, 0)
		.addImage(headImage as any, 28, bg.height / 2 - headImage.height / 2)
		.setTextAlign('center')
		.setTextFont('16px RuneScape Quill 8')

		.setColor('#810303')
		.addText(names[head], 307, 36)

		.setColor('#000')
		.addMultilineText(content, 307, 58, 361, 18)

		.toBufferAsync();

	return new MessageAttachment(image);
}
