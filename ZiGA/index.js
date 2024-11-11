const { EventEmitter } = require("events");

class Giveaways extends EventEmitter {
	/**
	 * @param {import("discord.js").Client} client - Discord client
	 * @param {object} options - Options cho Giveaways
	 * @param {number} options.updateInterval - Khoảng thời gian cập nhật giveaways (ms)
	 */
	constructor(client, options = { init: true }) {
		super();
		this.client = client;
		this.options = options;
		this.giveaways = []; // Danh sách các giveaway
		this.giveawaysInterval = null;
		this.updateInterval = options.updateInterval || 1000 * 60 * 5; // Mặc định là 5 phút
		if (options.init) this.init();
	}

	/**
	 * Khởi động quá trình kiểm tra giveaways
	 */
	init() {
		if (this.giveawaysInterval) clearInterval(this.giveawaysInterval);
		this.giveawaysInterval = setInterval(() => this.checkGiveaways(), this.updateInterval);
		this.client.on("messageCreate", (message) => this.handleMessage(message));
	}

	/**
	 * Tạo giveaway mới
	 * @param {string} channelId - ID của kênh Discord
	 * @param {string} prize - Phần thưởng của giveaway
	 * @param {number} duration - Thời gian (ms) cho giveaway
	 * @param {number} winnerCount - Số lượng người thắng
	 */
	async createGiveaway(channelId, prize, duration, winnerCount) {
		const channel = this.client.channels.cache.get(channelId);
		if (!channel) throw new Error("Kênh không tồn tại!");

		const endTime = Date.now() + duration;

		const giveaway = {
			channelId,
			prize,
			endTime,
			winnerCount,
			entries: [],
			ended: false,
		};

		this.giveaways.push(giveaway);

		this.emit("giveawayCreated", giveaway);
		return giveaway;
	}

	/**
	 * Tham gia giveaway
	 * @param {string} messageId - ID của giveaway message
	 * @param {string} userId - ID của người dùng tham gia
	 */
	joinGiveaway(messageId, userId) {
		const giveaway = this.giveaways.find((g) => g.messageId === messageId);
		if (!giveaway || giveaway.ended) return false;

		if (!giveaway.entries.includes(userId)) {
			giveaway.entries.push(userId);
			this.emit("userJoined", giveaway, userId);
			return true;
		}
		return false;
	}

	/**
	 * Kiểm tra và kết thúc giveaways nếu đã đến thời gian
	 */
	checkGiveaways() {
		const now = Date.now();

		this.giveaways.forEach((giveaway) => {
			if (!giveaway.ended && now >= giveaway.endTime) {
				this.endGiveaway(giveaway);
			}
		});
	}

	/**
	 * Kết thúc giveaway và chọn người thắng
	 * @param {object} giveaway - Giveaway cần kết thúc
	 */
	endGiveaway(giveaway) {
		giveaway.ended = true;

		const winners = this.pickWinners(giveaway);
		this.emit("giveawayEnded", giveaway, winners);

		// Xóa giveaway sau khi kết thúc
		this.giveaways = this.giveaways.filter((g) => g !== giveaway);
		return winners;
	}

	/**
	 * Chọn người thắng từ giveaway
	 * @param {object} giveaway - Giveaway cần chọn người thắng
	 * @returns {Array<string>} Danh sách ID người thắng
	 */
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

	/**
	 * Xử lý sự kiện message (tham gia giveaway khi người dùng nhắn tin)
	 * @param {import("discord.js").Message} message
	 */
	async handleMessage(message) {
		if (message.content === "!join") {
			const giveaway = this.giveaways.find((g) => g.channelId === message.channel.id && !g.ended);
			if (giveaway) {
				const success = this.joinGiveaway(message.id, message.author.id);
				if (success) {
					message.reply("Bạn đã tham gia giveaway thành công!");
				} else {
					message.reply("Bạn đã tham gia giveaway trước đó rồi!");
				}
			}
		}
	}

	/**
	 * Lưu giveaways vào storage (cần được tích hợp)
	 */
	saveGiveaways() {
		// Bạn có thể tích hợp lưu vào database ở đây
		this.emit("giveawaysSaved", this.giveaways);
	}

	/**
	 * Nạp giveaways từ storage (cần được tích hợp)
	 */
	loadGiveaways() {
		// Bạn có thể tích hợp tải từ database ở đây
		this.emit("giveawaysLoaded", this.giveaways);
	}
}

module.exports = {
	Giveaways,
};
