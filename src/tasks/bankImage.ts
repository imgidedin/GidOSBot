import { Canvas, createCanvas, Image, registerFont } from 'canvas';
import * as fs from 'fs';
import { KlasaUser, Task, TaskStore, util } from 'klasa';
import fetch from 'node-fetch';
import { Bank } from 'oldschooljs';
import { toKMB } from 'oldschooljs/dist/util/util';
import * as path from 'path';

import { bankImageCache, Events } from '../lib/constants';
import { allCLItems } from '../lib/data/Collections';
import { filterableTypes } from '../lib/data/filterables';
import backgroundImages from '../lib/minions/data/bankBackgrounds';
import { BankBackground } from '../lib/minions/types';
import { getUserSettings } from '../lib/settings/settings';
import { UserSettings } from '../lib/settings/types/UserSettings';
import { BankSortMethods, sorts } from '../lib/sorts';
import { ItemBank } from '../lib/types';
import {
	addArrayOfNumbers,
	cleanString,
	formatItemStackQuantity,
	generateHexColorForCashStack,
	sha256Hash
} from '../lib/util';
import { canvasImageFromBuffer, canvasToBufferAsync, fillTextXTimesInCtx } from '../lib/util/canvasUtil';

registerFont('./src/lib/resources/osrs-font.ttf', { family: 'Regular' });
registerFont('./src/lib/resources/osrs-font-compact.otf', { family: 'Regular' });
registerFont('./src/lib/resources/osrs-font-bold.ttf', { family: 'Regular' });

const bankRepeaterFile = fs.readFileSync('./src/lib/resources/images/bank_backgrounds/r1.jpg');

const coxPurpleBg = fs.readFileSync('./src/lib/resources/images/bank_backgrounds/14_purple.jpg');

export type BankImageResult =
	| {
			cachedURL: null;
			image: Buffer;
			cacheKey: string;
			isTransparent: boolean;
	  }
	| {
			cachedURL: string;
			image: null;
			cacheKey: string;
			isTransparent: boolean;
	  };

const CACHE_DIR = './icon_cache';

const itemSize = 32;
const distanceFromTop = 32;
const distanceFromSide = 16;

const { floor, ceil } = Math;

export default class BankImageTask extends Task {
	public itemIconsList: Set<number>;
	public itemIconImagesCache: Map<number, Image>;
	public backgroundImages: BankBackground[] = [];

	public repeatingImage: Image | null = null;

	public borderCorner: Image | null = null;
	public borderHorizontal: Image | null = null;
	public borderVertical: Image | null = null;

	public constructor(store: TaskStore, file: string[], directory: string) {
		super(store, file, directory, {});

		// This tells us simply whether the file exists or not on disk.
		this.itemIconsList = new Set();

		// If this file does exist, it might be cached in this, or need to be read from fs.
		this.itemIconImagesCache = new Map();
	}

	async init() {
		await this.run();
	}

	async run() {
		await this.cacheFiles();

		this.repeatingImage = await canvasImageFromBuffer(bankRepeaterFile);

		this.backgroundImages = await Promise.all(
			backgroundImages.map(async img => ({
				...img,
				image: await canvasImageFromBuffer(
					fs.readFileSync(
						`./src/lib/resources/images/bank_backgrounds/${img.id}.${img.transparent ? 'png' : 'jpg'}`
					)
				),
				repeatImage: fs.existsSync(`./src/lib/resources/images/bank_backgrounds/r${img.id}.jpg`)
					? await canvasImageFromBuffer(
							fs.readFileSync(`./src/lib/resources/images/bank_backgrounds/r${img.id}.jpg`)
					  )
					: null
			}))
		);

		this.borderCorner = await canvasImageFromBuffer(
			fs.readFileSync('./src/lib/resources/images/bank_border_c.png')
		);
		this.borderHorizontal = await canvasImageFromBuffer(
			fs.readFileSync('./src/lib/resources/images/bank_border_h.png')
		);
		this.borderVertical = await canvasImageFromBuffer(
			fs.readFileSync('./src/lib/resources/images/bank_border_v.png')
		);
	}

	async cacheFiles() {
		// Ensure that the icon_cache dir exists.
		fs.promises.mkdir(CACHE_DIR).catch(() => null);

		// Get a list of all files (images) in the dir.
		const filesInDir = await fs.promises.readdir(CACHE_DIR);

		// For each one, set a cache value that it exists.
		for (const fileName of filesInDir) {
			this.itemIconsList.add(parseInt(path.parse(fileName).name));
		}
	}

	async getItemImage(itemID: number, quantity: number): Promise<Image> {
		const isOnDisk = this.itemIconsList.has(itemID);
		const cachedImage = this.itemIconImagesCache.get(itemID);

		if (!isOnDisk) {
			await this.fetchAndCacheImage(itemID);
			return this.getItemImage(itemID, quantity);
		}

		if (!cachedImage) {
			const imageBuffer = await fs.promises.readFile(path.join(CACHE_DIR, `${itemID}.png`));
			try {
				const image = await canvasImageFromBuffer(imageBuffer);
				this.itemIconImagesCache.set(itemID, image);
				return this.getItemImage(itemID, quantity);
			} catch (err) {
				console.error(`Failed to load item icon with id: ${itemID}`);
				return this.getItemImage(1, 1);
			}
		}

		return cachedImage;
	}

	async fetchAndCacheImage(itemID: number) {
		const imageBuffer = await fetch(`https://chisel.weirdgloop.org/static/img/osrs-sprite/${itemID}.png`).then(
			result => result.buffer()
		);

		await fs.promises.writeFile(path.join(CACHE_DIR, `${itemID}.png`), imageBuffer);

		const image = await canvasImageFromBuffer(imageBuffer);

		this.itemIconsList.add(itemID);
		this.itemIconImagesCache.set(itemID, image);
	}

	drawBorder(canvas: Canvas, titleLine = true) {
		const ctx = canvas.getContext('2d');
		// Draw top border
		ctx.fillStyle = ctx.createPattern(this.borderHorizontal, 'repeat-x');
		ctx.fillRect(0, 0, canvas.width, this.borderHorizontal!.height);

		// Draw bottom border
		ctx.save();
		ctx.fillStyle = ctx.createPattern(this.borderHorizontal, 'repeat-x');
		ctx.translate(0, canvas.height);
		ctx.scale(1, -1);
		ctx.fillRect(0, 0, canvas.width, this.borderHorizontal!.height);
		ctx.restore();

		// Draw title line
		if (titleLine) {
			ctx.save();
			ctx.fillStyle = ctx.createPattern(this.borderHorizontal, 'repeat-x');
			ctx.translate(this.borderVertical!.width, 27);
			ctx.fillRect(0, 0, canvas.width, this.borderHorizontal!.height);
			ctx.restore();
		}

		// Draw left border
		ctx.save();
		ctx.fillStyle = ctx.createPattern(this.borderVertical, 'repeat-y');
		ctx.translate(0, this.borderVertical!.width);
		ctx.fillRect(0, 0, this.borderVertical!.width, canvas.height);
		ctx.restore();

		// Draw right border
		ctx.fillStyle = ctx.createPattern(this.borderVertical, 'repeat-y');
		ctx.save();
		ctx.translate(canvas.width, 0);
		ctx.scale(-1, 1);
		ctx.fillRect(0, 0, this.borderVertical!.width, canvas.height);
		ctx.restore();

		// Draw corner borders
		// Top left
		ctx.save();
		ctx.translate(0, 0);
		ctx.scale(1, 1);
		ctx.drawImage(this.borderCorner, 0, 0);
		ctx.restore();

		// Top right
		ctx.save();
		ctx.translate(canvas.width, 0);
		ctx.scale(-1, 1);
		ctx.drawImage(this.borderCorner, 0, 0);
		ctx.restore();

		// Bottom right
		ctx.save();
		ctx.translate(canvas.width, canvas.height);
		ctx.scale(-1, -1);
		ctx.drawImage(this.borderCorner, 0, 0);
		ctx.restore();

		// Bottom left
		ctx.save();
		ctx.translate(0, canvas.height);
		ctx.scale(1, -1);
		ctx.drawImage(this.borderCorner, 0, 0);
		ctx.restore();
	}

	async generateBankImage(
		_bank: Bank | ItemBank,
		title = '',
		showValue = true,
		flags: { [key: string]: string | number } = {},
		user?: KlasaUser,
		collectionLog?: ItemBank
	): Promise<BankImageResult> {
		const bank = _bank instanceof Bank ? _bank : new Bank(_bank);
		let compact = Boolean(flags.compact);
		const spacer = compact ? 2 : 12;

		const settings =
			typeof user === 'undefined' ? null : typeof user === 'string' ? await getUserSettings(user) : user.settings;

		const favorites = settings?.get(UserSettings.FavoriteItems);

		const bankBackgroundID = settings?.get(UserSettings.BankBackground) ?? flags.background ?? 1;
		const currentCL = collectionLog ?? settings?.get(UserSettings.CollectionLogBank);
		let partial = false;

		// Filtering
		const searchQuery = flags.search as string | undefined;
		const filter = flags.filter
			? filterableTypes.find(type => type.aliases.some(alias => flags.filter === alias)) ?? null
			: null;
		if (filter || searchQuery) {
			partial = true;
			bank.filter(item => {
				if (searchQuery) return cleanString(item.name).includes(cleanString(searchQuery));
				return filter!.items.includes(item.id);
			}, true);
		}

		let items = bank.items();

		// Sorting
		const sort = flags.sort ? BankSortMethods.find(s => s === flags.sort) ?? 'value' : 'value';
		if (sort || favorites?.length) {
			items = items.sort((a, b) => {
				if (favorites) {
					const aFav = favorites.includes(a[0].id);
					const bFav = favorites.includes(b[0].id);
					if (aFav && bFav) return sorts[sort](a, b);
					if (bFav) return 1;
					if (aFav) return -1;
				}
				return sorts[sort](a, b);
			});
		}

		const totalValue = addArrayOfNumbers(items.map(([i, q]) => i.price * q));

		const chunkSize = compact ? 140 : 56;
		const chunked = util.chunk(items, chunkSize);

		// Get page flag to show the current page, full and showNewCL to avoid showing page n of y
		const { page, noBorder, wide } = flags;
		if (Number(page) >= 0) {
			title += ` - Page ${(Number(page) ? Number(page) : 0) + 1} of ${chunked.length}`;
		}

		// Paging
		if (typeof page === 'number' && !flags.full) {
			const pageLoot = chunked[page];
			if (!pageLoot) throw 'You have no items on this page.';
			items = pageLoot;
		}

		if (items.length > 500 && !flags.nc) compact = true;

		const itemWidthSize = compact ? 12 + 21 : 36 + 21;

		let width = wide ? 5 + this.borderVertical!.width + 20 + ceil(Math.sqrt(items.length)) * itemWidthSize : 488;
		if (width < 488) width = 488;
		const itemsPerRow = floor((width - this.borderVertical!.width * 2) / itemWidthSize);
		const canvasHeight =
			floor(
				floor(ceil(items.length / itemsPerRow) * floor((itemSize + spacer / 2) * (compact ? 0.9 : 1.08))) +
					itemSize * 1.5
			) - 2;

		let bgImage = this.backgroundImages.find(bg => bg.id === bankBackgroundID)!;
		const isTransparent = Boolean(bgImage.transparent);

		const isPurple: boolean =
			flags.showNewCL !== undefined &&
			currentCL !== undefined &&
			Object.keys(bank.bank).some(i => !currentCL[i] && allCLItems.includes(parseInt(i)));

		if (isPurple && bankBackgroundID === 14) {
			bgImage = { ...bgImage, image: await canvasImageFromBuffer(coxPurpleBg) };
		}

		const hexColor = user?.settings.get(UserSettings.BankBackgroundHex);

		const cacheKey = [
			title,
			user?.id ?? 'nouser',
			showValue,
			bankBackgroundID,
			searchQuery,
			items.length,
			partial,
			page,
			isPurple,
			totalValue,
			canvasHeight,
			Object.entries(flags).toString(),
			sha256Hash(items.map(i => `${i[0].id}-${i[1]}`).join('')),
			hexColor ?? 'no-hex'
		].join('-');

		let cached = bankImageCache.get(cacheKey);
		if (cached) {
			return {
				cachedURL: cached,
				image: null,
				cacheKey,
				isTransparent
			};
		}

		const canvas = createCanvas(width, bankBackgroundID === 1 ? canvasHeight : Math.max(331, canvasHeight));

		const ctx = canvas.getContext('2d');
		ctx.font = '16px OSRSFontCompact';
		ctx.imageSmoothingEnabled = false;

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		if (!isTransparent) {
			ctx.fillStyle = ctx.createPattern(bgImage.repeatImage ?? this.repeatingImage, 'repeat');
			ctx.fillRect(0, 0, canvas.width, canvas.height);
		}
		if (hexColor && isTransparent) {
			ctx.fillStyle = hexColor;
			ctx.fillRect(0, 0, canvas.width, canvas.height);
		}

		if (bankBackgroundID !== 20) {
			ctx.drawImage(
				bgImage!.image,
				0,
				0,
				wide ? canvas.width : bgImage.image!.width!,
				wide ? canvas.height : bgImage.image!.height!
			);
		}

		// Skips border if noBorder is set
		if (!isTransparent && noBorder !== 1) {
			this.drawBorder(canvas, bgImage.name === 'Default');
		}
		if (showValue) {
			title += ` (Value: ${toKMB(totalValue)})`;
		}

		// Draw Bank Title
		ctx.textAlign = 'center';
		ctx.font = '16px RuneScape Bold 12';

		ctx.fillStyle = '#000000';
		fillTextXTimesInCtx(ctx, title, floor(canvas.width / 2) + 1, 22);

		ctx.fillStyle = '#ff981f';
		fillTextXTimesInCtx(ctx, title, floor(canvas.width / 2), 21);

		// Draw Items
		ctx.textAlign = 'start';
		ctx.fillStyle = '#494034';
		ctx.font = compact ? '14px OSRSFontCompact' : '16px OSRSFontCompact';

		let xLoc = 0;
		let yLoc = compact ? 5 : 0;
		for (let i = 0; i < items.length; i++) {
			if (i % itemsPerRow === 0) yLoc += floor((itemSize + spacer / 2) * (compact ? 0.9 : 1.08));
			// For some reason, it starts drawing at -2 so we compensate that
			// Adds the border width
			// Adds distance from side
			// 36 + 21 is the itemLength + the space between each item
			xLoc = 2 + this.borderVertical!.width + (compact ? 9 : 20) + (i % itemsPerRow) * itemWidthSize;
			const [item, quantity] = items[i];
			const itemImage = await this.getItemImage(item.id, quantity).catch(() => {
				console.error(`Failed to load item image for item with id: ${item.id}`);
			});
			if (!itemImage) {
				this.client.emit(Events.Warn, `Item with ID[${item.id}] has no item image.`);
				continue;
			}

			const itemHeight = compact ? itemImage.height / 1 : itemImage.height;
			const itemWidth = compact ? itemImage.width / 1 : itemImage.width;

			// Check if new cl item
			const isNewCLItem = flags.showNewCL && currentCL && !currentCL[item.id] && allCLItems.includes(item.id);

			if (isNewCLItem) {
				let dArr = [-1, -1, 0, -1, 1, -1, -1, 0, 1, 0, -1, 1, 0, 1, 1, 1];
				let s = 1;
				let i = 0;
				let x = 0;
				let y = 0;
				const purplecanvas = new Canvas(itemImage.width + 3, itemImage.height + 3);
				const pctx = purplecanvas.getContext('2d');
				for (; i < dArr.length; i += 2) pctx.drawImage(itemImage, x + dArr[i] * s, y + dArr[i + 1] * s);
				pctx.globalAlpha = 0.5;
				pctx.globalCompositeOperation = 'source-in';
				pctx.fillStyle = '#ac7fff';
				pctx.fillRect(0, 0, canvas.width, canvas.height);
				pctx.globalCompositeOperation = 'source-over';
				ctx.drawImage(
					pctx.canvas,
					floor(xLoc + (itemSize - itemWidth) / 2) + 2,
					floor(yLoc + (itemSize - itemHeight) / 2),
					itemWidth + 3,
					itemHeight + 3
				);
			}

			ctx.drawImage(
				itemImage,
				floor(xLoc + (itemSize - itemWidth) / 2) + 2,
				floor(yLoc + (itemSize - itemHeight) / 2),
				itemWidth,
				itemHeight
			);

			const quantityColor = isNewCLItem ? '#ac7fff' : generateHexColorForCashStack(quantity);
			const formattedQuantity = formatItemStackQuantity(quantity);

			// Draw qty shadow
			ctx.fillStyle = '#000000';
			fillTextXTimesInCtx(ctx, formattedQuantity, xLoc + distanceFromSide - 17, yLoc + distanceFromTop - 23);

			// Draw qty
			ctx.fillStyle = quantityColor;
			fillTextXTimesInCtx(ctx, formattedQuantity, xLoc + distanceFromSide - 18, yLoc + distanceFromTop - 24);

			let bottomItemText: string | number | null = null;

			if (flags.sv) {
				bottomItemText = item.price * quantity;
			}

			if (flags.av) {
				bottomItemText = (item.highalch ?? 0) * quantity;
			}
			if (flags.id) {
				bottomItemText = item.id.toString();
			}

			if (flags.names) {
				bottomItemText = `${item.name!.replace('Grimy', 'Grmy').slice(0, 7)}..`;
			}

			if (bottomItemText) {
				ctx.fillStyle = 'black';
				let text = typeof bottomItemText === 'number' ? toKMB(bottomItemText) : bottomItemText;
				fillTextXTimesInCtx(ctx, text, floor(xLoc), yLoc + distanceFromTop);
				ctx.fillStyle =
					typeof bottomItemText === 'string' ? 'white' : generateHexColorForCashStack(bottomItemText);
				fillTextXTimesInCtx(ctx, text, floor(xLoc - 1), yLoc + distanceFromTop - 1);
			}
		}

		const image = await canvasToBufferAsync(canvas, 'image/png');

		return {
			image,
			cacheKey,
			cachedURL: null,
			isTransparent
		};
	}
}
