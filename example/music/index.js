const { Client, GatewayIntentBits, Partials } = require("discord.js");
const PlayerManager = require("@zibot/player");
const { ZiExtractor } = require("@zibot/ziextractor");
// const { SoundCloudExtractor } = require("./SoundCloudExtractor.js"); // Adjust the path as needed
// const { YtDlpExtractor } = require("./YtDlpExtractor.js"); // Adjust the path as needed
const config = {
	prefix: "!",
};
require("dotenv").config();

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
	],
	partials: [Partials.Channel],
});

const player = new PlayerManager(client, {
	extractors: [new ZiExtractor({})],
});

client.once("ready", () => {
	console.log(`✅ Logged in as ${client.user.tag}`);
});

// player.on("trackStart", (guildId, track) => {
// 	const channel = client.guilds.cache.get(guildId)?.systemChannel;
// 	if (channel) channel.send(`🎵 Now playing: **${track.title}**`);
// });

// player.on("queueEnd", (guildId) => {
// 	const channel = client.guilds.cache.get(guildId)?.systemChannel;
// 	if (channel) channel.send("✅ Queue ended.");
// });

player.on("debug", console.log);

client.on("messageCreate", async (message) => {
	if (!message.content.startsWith(config.prefix) || message.author.bot) return;
	const [cmd, ...args] = message.content.slice(config.prefix.length).trim().split(/ +/);

	const voiceChannel = message.member?.voice?.channel;
	if (!voiceChannel) return message.reply("🔇 Bạn cần vào voice channel trước.");

	if (cmd === "play") {
		const query = args.join(" ");
		if (!query) return message.reply("❗ Hãy nhập tên bài hát hoặc URL.");

		try {
			const tracks = await player.search(query, {
				requestedBy: message.author,
				metadata: { from: message.channel.id },
			});

			if (!tracks.length) return message.reply("❌ Không tìm thấy bài hát nào.");

			await player.play(voiceChannel, tracks[0], {
				volume: 100,
				requestedBy: message.author,
				metadata: { from: message.channel.id },
				selfDeaf: true,
				leaveOnEmpty: true,
				leaveOnEnd: true,
				leaveOnEmptyCooldown: 60_000,
				leaveOnEndCooldown: 180_000,
				pauseOnEmpty: true,
			});

			message.reply(`▶️ Đã thêm **${tracks[0].title}** vào hàng đợi!`);
		} catch (err) {
			console.error(err);
			message.reply("❌ Có lỗi xảy ra khi phát bài hát.");
		}
	}

	if (cmd === "skip") {
		player.skip(message.guild.id);
		message.reply("⏭ Đã chuyển bài.");
	}

	if (cmd === "stop") {
		player.stop(message.guild.id);
		message.reply("⏹ Đã dừng phát nhạc.");
	}

	if (cmd === "pause") {
		player.pause(message.guild.id);
		message.reply("⏸ Đã tạm dừng.");
	}

	if (cmd === "resume") {
		player.resume(message.guild.id);
		message.reply("▶️ Tiếp tục phát.");
	}

	if (cmd === "np") {
		const track = player.nowPlaying(message.guild.id);
		if (track) {
			message.reply(`🎶 Đang phát: **${track.title}** - ${track.url}`);
		} else {
			message.reply("Không có bài nào đang phát.");
		}
	}

	if (cmd === "queue") {
		const queue = player.getQueue(message.guild.id);
		if (!queue.length) return message.reply("📭 Hàng đợi rỗng.");
		const list = queue
			.slice(0, 10)
			.map((t, i) => `${i + 1}. **${t.title}**`)
			.join("\n");
		message.reply(`📀 Hàng đợi:\n${list}`);
	}

	if (cmd === "repeat") {
		const enabled = player.toggleRepeat(message.guild.id);
		message.reply(`🔁 Repeat ${enabled ? "bật" : "tắt"}.`);
	}

	if (cmd === "volume") {
		const vol = parseInt(args[0]);
		if (isNaN(vol)) return message.reply("🔊 Nhập số từ 0 đến 200.");
		player.setVolume(message.guild.id, vol / 100);
		message.reply(`🔊 Đặt âm lượng: ${vol}%`);
	}
});

client
	.login(process.env.TOKEN)
	.then(() => console.log("✅ Bot đã đăng nhập thành công."))
	.catch((err) => console.error("❌ Lỗi đăng nhập:", err));
