// const DiscordVoiceClient = require("./index");
require("dotenv").config();
const fs = require("fs");
const { Transform } = require("stream");
const prism = require("prism-media");
const { createAudioResource, StreamType } = require("@discordjs/voice");

// Thông tin kết nối
const botToken = process.env.TOKEN;
const token = botToken;
const guildId = "1150638980803592262";
const channelId = "1162041451895599154";
const userId = "1303274959405056070";

class PcmStream extends Transform {
	constructor(options) {
		super(options);
		this.buffer = Buffer.alloc(0);
	}

	_transform(chunk, encoding, callback) {
		this.buffer = Buffer.concat([this.buffer, chunk]);
		const fittingChunkSize = Math.floor(this.buffer.length / 2) * 2;
		if (fittingChunkSize > 0) {
			this.push(this.buffer.slice(0, fittingChunkSize));
			this.buffer = this.buffer.slice(fittingChunkSize);
		}
		callback();
	}

	_flush(callback) {
		if (this.buffer.length > 0) {
			this.push(this.buffer);
		}
		callback();
	}
}

// // Khởi tạo DiscordVoiceClient
// const voiceClient = new DiscordVoiceClient(botToken, guildId, channelId, userId);

// // Kết nối đến Discord Voice
// voiceClient.connect();

// // Lắng nghe sự kiện "voiceMessage" để xử lý tin nhắn từ voice server
// voiceClient.on("voiceMessage", (data) => {
// 	console.log("Received data from voice server:", data);
// });

// // Phát âm thanh từ file
// voiceClient.playAudio("./Anemone.mp3");

// process.on("uncaughtException", (err) => {
// 	if (err.code === "EPIPE") {
// 		console.error("Caught EPIPE error, ignoring it:", err);
// 	} else {
// 		console.error("Uncaught Exception:", err);
// 		process.exit(1); // Exit if it's not an EPIPE error
// 	}
// });
const DiscordBot = require("./bot");

const bot = new DiscordBot(token);

bot.on("ready", async (payload) => {
	console.log(`${payload.user.username} is online and ready!`);
	await bot.connectToVoice("1150638980803592262", "1271131254909042748");
});

bot.on("messageCreate", (message) => {
	console.log(`Message from ${message.author.username}: ${message.content}`);
	let resource = createAudioResource("./Anemone.mp3");

	bot.playAudio(resource.playStream);

	if (message.content === "ping") {
		message
			.reply("pong!")
			.then((mm) => {
				console.log("Replied with pong!");
				bot.editMessage(mm.id, mm.channel_id, "hm.......");
			})
			.catch(console.error);
	}
});

bot.on("interactionCreate", (interaction) => {
	console.log("Received an interaction:", interaction);

	interaction
		.reply({
			content: "Hello, this is a reply to your interaction!",
			embeds: [
				{
					title: "Interaction Reply",
					description: "This is an embedded message response",
					color: 0x00ff00,
				},
			],
		})
		.then(() => {
			console.log("Interaction replied!");
		})
		.catch(console.error);
});

bot.on("debug", console.log);

function decodeFileToPCM(filePath) {
	const inputStream = fs.createReadStream(filePath);

	// FFmpeg with error handling
	const ffmpeg = new prism.FFmpeg({
		args: ["-analyzeduration", "0", "-loglevel", "0", "-f", "s16le", "-ar", "48000", "-ac", "2"],
	});

	// Handle FFmpeg errors
	ffmpeg.on("error", (err) => {
		console.error("FFmpeg Error:", err);
	});

	// Catch any close event to avoid EPIPE errors
	ffmpeg.on("close", (code, signal) => {
		console.log(`FFmpeg process closed with code ${code} and signal ${signal}`);
	});

	const pcmDecoder = inputStream.pipe(ffmpeg).pipe(new prism.opus.Decoder({ frameSize: 960, channels: 2, rate: 48000 }));

	// Handle stream errors
	pcmDecoder.on("error", (err) => {
		console.error("PCM Decoder Error:", err);
	});

	return pcmDecoder;
}
