import { Client, MessageCreateOptions } from "discord.js";
import { EventEmitter } from "events";

export interface Giveaway {
	channelId: string;
	messageId: string;
	prize: string;
	endTime: number;
	winnerCount: number;
	entries: string[];
	ended: boolean;
	paused?: boolean;
	remainingTime?: number;
}

export interface GiveawaysOptions {
	store?: string;
	updateInterval?: number;
	init?: boolean;
}

export class Giveaways extends EventEmitter {
	constructor(client: Client, options?: GiveawaysOptions);

	client: Client;
	options: GiveawaysOptions;
	giveaways: Giveaway[];

	init(): void;

	createGiveaway(
		channelId: string,
		prize: string,
		duration: number,
		winnerCount: number,
		context?: MessageCreateOptions,
	): Promise<Giveaway>;

	editGiveaway(
		messageId: string,
		newData: {
			prize?: string;
			duration?: number;
			winnerCount?: number;
		},
	): boolean;

	joinGiveaway(messageId: string, userId: string): boolean;

	fetchGiveaways(): Giveaway[];

	pauseGiveaway(messageId: string): boolean;

	unpauseGiveaway(messageId: string): boolean;

	endGiveaway(messageId: string): string[];

	pickWinners(giveaway: Giveaway): string[];

	saveGiveaways(): void;

	loadGiveaways(): void;
}
