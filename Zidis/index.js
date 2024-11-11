const WebSocket = require("ws");
const { EventEmitter } = require("events");
const opus = require("opusscript");
const prism = require("prism-media");

const fs = require("fs");

const voiceGatewayUrl = "wss://gateway.discord.gg/?v=10&encoding=json";

class DiscordVoiceClient extends EventEmitter {
	constructor(botToken, guildId, channelId, userId) {
		super();
		this.botToken = botToken;
		this.guildId = guildId;
		this.channelId = channelId;
		this.userId = userId;
		this.voiceWs = null;
		this.gatewayWs = null;
		this.encoder = new opus(48000, 2); // Initialize Opus encoder for 48kHz, stereo
		this.decoder = new prism.opus.Decoder({ frameSize: 960, channels: 2, rate: 48000 });
	}

	connect() {
		this.gatewayWs = new WebSocket(voiceGatewayUrl);

		this.gatewayWs.on("open", () => {
			console.log("Connected to Discord Gateway");

			const payload = {
				op: 4,
				d: {
					guild_id: this.guildId,
					channel_id: this.channelId,
					self_mute: false,
					self_deaf: false,
				},
			};
			this.gatewayWs.send(JSON.stringify(payload));
		});

		this.gatewayWs.on("message", (data) => {
			const message = JSON.parse(data);

			if (message.op === 3) {
				// Heartbeat
				this.gatewayWs.send(JSON.stringify({ op: 1, d: null }));
			}

			if (message.op === 2) {
				const { endpoint, token } = message.d;
				this.connectToVoiceServer(endpoint, token);
			}
		});

		this.gatewayWs.on("close", () => {
			console.log("Disconnected from Discord Gateway");
		});
	}

	connectToVoiceServer(endpoint, token) {
		this.voiceWs = new WebSocket(`wss://${endpoint}`);

		this.voiceWs.on("open", () => {
			console.log("Connected to Discord Voice Server");

			const authPayload = {
				op: 1,
				d: {
					server_id: this.guildId,
					user_id: this.userId,
					session_id: "SESSION_ID",
					token: token,
				},
			};

			this.voiceWs.send(JSON.stringify(authPayload));
		});

		this.voiceWs.on("message", (data) => {
			this.emit("voiceMessage", data);
		});

		this.voiceWs.on("close", () => {
			console.log("Disconnected from Discord Voice Server");
		});

		this.voiceWs.on("error", (err) => {
			console.error("Voice WebSocket Error:", err);
		});
	}

	async playAudio(filePath) {
		const pcmStream = this.decodeFileToPCM(filePath);

		for await (const pcmChunk of pcmStream) {
			if (pcmChunk.length === 3840) {
				// Ensure correct frame size
				const opusEncoded = this.encodeOpus(pcmChunk);
				if (opusEncoded) {
					const packet = this.createVoicePacket(opusEncoded);
					this.voiceWs.send(packet);
				}
			} else {
				console.warn("Skipping PCM chunk due to incorrect size:", pcmChunk.length);
			}
		}
	}

	decodeFileToPCM(filePath) {
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

		const pcmDecoder = inputStream.pipe(ffmpeg).pipe(this.decoder);

		// Handle stream errors
		pcmDecoder.on("error", (err) => {
			console.error("PCM Decoder Error:", err);
		});

		return pcmDecoder;
	}

	encodeOpus(pcmData) {
		const frameSize = 960 * 2 * 2; // 3840 bytes for 20ms frame size
		if (pcmData.length !== frameSize) {
			console.warn(`Frame size mismatch: got ${pcmData.length}, expected ${frameSize}`);
			return null; // Return null to skip encoding
		}
		try {
			return this.encoder.encode(pcmData);
		} catch (error) {
			console.error("Encoding error:", error);
			return null;
		}
	}

	createVoicePacket(encodedAudio) {
		if (!encodedAudio) return null;
		return JSON.stringify({
			op: 5,
			d: {
				audio_data: encodedAudio.toString("base64"),
			},
		});
	}
}
module.exports = DiscordVoiceClient;
