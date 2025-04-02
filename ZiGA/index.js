const { EventEmitter } = require("events");
const { writeFile, readFile } = require("fs/promises");

class Giveaways extends EventEmitter {
	constructor(client, options = { init: true }) {
		super();
		this.client = client;
		this.options = options;
		this.giveaways = [];
		this.giveawaysInterval = null;
		this.store = options.store || null;
		this.updateInterval = options.updateInterval || 1000 * 60 * 5;
		if (options.init) this.init();
	}

	init() {
		if (this.giveawaysInterval) clearInterval(this.giveawaysInterval);
		this.giveawaysInterval = setInterval(() => this.checkGiveaways(), this.updateInterval);
		this.loadGiveaways();
	}

	async createGiveaway(channelId, prize, duration, winnerCount, context) {
		const channel = this.client.channels.cache.get(channelId);
		if (!channel) throw new Error("Kênh không tồn tại!");

		const endTime = Date.now() + duration;
		const message = await channel.send(
			context ??
				`🎉 **Giveaway!** 🎉\n\n**Phần thưởng:** ${prize}\n**Thời gian còn lại:** ${
					duration / 1000
				} giây\n**Số người thắng:** ${winnerCount}`,
		);

		const giveaway = {
			channelId,
			messageId: message.id,
			prize,
			endTime,
			winnerCount: Math.max(1, winnerCount),
			entries: [],
			ended: false,
			paused: false,
		};
		this.giveaways.push(giveaway);
		this.emit("giveawayCreated", this.client, giveaway);
		return giveaway;
	}

	editGiveaway(messageId, newData) {
		const giveaway = this.giveaways.find((g) => g.messageId === messageId);
		if (!giveaway || giveaway.ended) return false;

		if (newData.prize) giveaway.prize = newData.prize;
		if (newData.duration) giveaway.endTime = Date.now() + newData.duration;
		if (newData.winnerCount) giveaway.winnerCount = Math.max(1, newData.winnerCount);

		this.emit("giveawayEdited", giveaway);
		this.saveGiveaways();
		return true;
	}

	joinGiveaway(messageId, userId, requiredRole = null) {
		const giveaway = this.giveaways.find((g) => g.messageId === messageId);
		if (!giveaway || giveaway.ended || giveaway.paused) return false;
		const member = this.client.users.cache.get(userId);
		if (requiredRole && !member.roles.cache.has(requiredRole)) return false;
		if (!giveaway.entries.includes(userId)) {
			giveaway.entries.push(userId);
			this.emit("userJoined", giveaway, userId);
			this.saveGiveaways();
			return true;
		}
		return false;
	}

	checkGiveaways() {
		const now = Date.now();
		this.giveaways.forEach((giveaway) => {
			if (!giveaway.ended && !giveaway.paused && now >= giveaway.endTime) {
				this.endGiveaway(giveaway);
			}
		});
	}

	endGiveaway(messageId) {
		const giveaway = this.giveaways.find((g) => g.messageId === messageId);
		if (!giveaway || giveaway.ended) return false;
		giveaway.ended = true;
		const winners = this.pickWinners(giveaway);
		this.emit("giveawayEnded", giveaway, winners);
		this.giveaways = this.giveaways.filter((g) => g !== giveaway);
		this.saveGiveaways();
		return winners;
	}

	pauseGiveaway(messageId) {
		const giveaway = this.giveaways.find((g) => g.messageId === messageId);
		if (!giveaway || giveaway.ended) return false;
		giveaway.paused = true;
		this.emit("giveawayPaused", giveaway);
		this.saveGiveaways();
		return true;
	}

	unpauseGiveaway(messageId) {
		const giveaway = this.giveaways.find((g) => g.messageId === messageId);
		if (!giveaway || giveaway.ended) return false;
		giveaway.paused = false;
		this.emit("giveawayUnpaused", giveaway);
		this.saveGiveaways();
		return true;
	}

	fetchGiveaways() {
		return this.giveaways;
	}

	pickWinners(giveaway) {
		if (giveaway.entries.length === 0) return [];
		const winners = [];
		const entries = [...giveaway.entries];
		for (let i = 0; i < giveaway.winnerCount; i++) {
			if (entries.length === 0) break;
			const randomIndex = Math.floor(Math.random() * entries.length);
			winners.push(entries.splice(randomIndex, 1)[0]);
		}
		return winners;
	}

	saveGiveaways() {
		writeFile("giveaways.json", JSON.stringify(this.giveaways, null, 2)).catch(console.error);
		this.emit("giveawaysSaved", this.giveaways);
	}

	loadGiveaways() {
		readFile("giveaways.json")
			.then((data) => {
				this.giveaways = JSON.parse(data);
				this.giveaways.forEach((giveaway) => {
					if (giveaway.endTime < Date.now()) giveaway.ended = true;
				});
				this.emit("giveawaysLoaded", this.giveaways);
			})
			.catch(() => {
				this.giveaways = [];
				writeFile("giveaways.json", JSON.stringify([])).catch(console.error);
			});
	}
}

module.exports = { Giveaways };
