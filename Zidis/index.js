const WebSocket = require("ws");
const { EventEmitter } = require("events");
const opus = require("opusscript");
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
	}

	playAudio(filePath) {
		const audioBuffer = fs.readFileSync(filePath);
		const opusEncoded = this.encodeOpus(audioBuffer);
		const packet = this.createVoicePacket(opusEncoded);

		this.voiceWs.send(packet);
	}

	encodeOpus(audioBuffer) {
		const encoder = new opus.Encoder(48000, 2); // 48kHz, stereo
		return encoder.encode(audioBuffer);
	}

	createVoicePacket(encodedAudio) {
		return JSON.stringify({
			op: 5,
			d: {
				audio_data: encodedAudio.toString("base64"),
			},
		});
	}
}

module.exports = DiscordVoiceClient;
