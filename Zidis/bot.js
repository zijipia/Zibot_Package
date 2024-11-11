const WebSocket = require("ws");
const fetch = require("node-fetch");
const EventEmitter = require("events");
const OpusEncoder = require("opusscript");
const prism = require("prism-media");

class DiscordBot extends EventEmitter {
	constructor(token, options = { _init: true, intents: 3276799 }) {
		super();
		this.token = token;
		this.ws = null;
		this.heartbeatInterval = null;
		this.sequenceNumber = null;
		this.gatewayUrl = "wss://gateway.discord.gg/?v=10&encoding=json";
		this.intents = options.intents;
		this.headers = {
			Authorization: `Bot ${this.token}`,
			"Content-Type": "application/json",
		};
		this.voiceWs = null; // Voice WebSocket connection
		this.heartbeatVoiceInterval = null; // Heartbeat for voice connection
		this.encoder = new OpusEncoder(48000, 2); // Opus encoder for 48kHz, stereo
		this.isReady = false;
		if (options._init) this.connect();
	}

	debug(message, ...args) {
		this.emit("debug", `[DEBUG] ${message}`, ...args);
	}

	async connect(retries = 1) {
		this.debug("Connecting to Discord Gateway...");
		this.ws = new WebSocket(this.gatewayUrl);

		this.ws.on("open", () => {
			this.debug("WebSocket connection opened");
			this.identify();
		});
		this.ws.on("message", (data) => this.handleMessage(data));
		this.ws.on("close", (code, reason) => {
			this.debug("WebSocket closed with code:", code, "reason:", reason);
			clearInterval(this.heartbeatInterval);
			setTimeout(() => this.connect(retries + 1), Math.min(1000 * 2 ** retries, 60000));
		});
		this.ws.on("error", (error) => this.debug("WebSocket error:", error));
	}

	identify() {
		this.debug("Identifying bot...");
		this.ws.send(
			JSON.stringify({
				op: 2,
				d: {
					token: this.token,
					intents: this.intents,
					properties: { os: "linux", browser: "node", device: "node" },
				},
			}),
		);
	}

	heartbeat(interval) {
		this.debug("Starting heartbeat with interval:", interval);
		this.heartbeatInterval = setInterval(() => {
			this.debug("Sending heartbeat...");
			this.ws.send(JSON.stringify({ op: 1, d: this.sequenceNumber }));
		}, interval);
	}

	async handleMessage(data) {
		const { t: event, s: seq, op, d: payload } = JSON.parse(data);
		if (seq) this.sequenceNumber = seq;
		this.debug("Received message with operation:", op, "event:", event);
		switch (op) {
			case 10:
				this.heartbeat(payload.heartbeat_interval);
				break;
			case 11:
				this.debug("Heartbeat acknowledged");
				break;
		}

		switch (event) {
			case "MESSAGE_CREATE":
				this.emit("messageCreate", this.extendMessage(payload));
				break;
			case "INTERACTION_CREATE":
				this.emit("interactionCreate", this.extendInteraction(payload));
				break;
			case "READY":
				this.isReady = true;
				this.debug(`Logged in as ${payload.user.username}`);
				this.emit("ready", payload);
				break;
			case "VOICE_STATE_UPDATE":
				// console.error("voiceStateUpdate");
				// console.log(payload);
				this.emit("voiceStateUpdate", payload);
			case "VOICE_SERVER_UPDATE":
				// console.error("voiceServerUpdate");
				// console.log(payload);
				this.emit("voiceServerUpdate", payload);
		}
	}

	async apiRequest(url, method, body) {
		this.debug("Making API request", { url, method, body });
		try {
			const response = await fetch(url, {
				method,
				headers: this.headers,
				body: JSON.stringify(body),
			});
			const data = response.status === 204 ? null : await response.json();

			if (!response.ok) {
				this.debug(`Error in ${method} ${url}:`, data);
				throw new Error(data?.message || "Request failed");
			}

			this.debug("API request successful", data);
			return data;
		} catch (error) {
			this.debug("API Request failed:", error.message);
			throw error;
		}
	}

	//#region Interaction

	extendInteraction(interaction) {
		interaction.reply = async (content) => this.sendInteractionResponse(interaction.id, interaction.token, content);
		return interaction;
	}

	async sendInteractionResponse(interactionId, interactionToken, content) {
		this.debug("sendInteractionResponse called with:", { interactionId, interactionToken, content });

		return this.apiRequest(`https://discord.com/api/v10/interactions/${interactionId}/${interactionToken}/callback`, "POST", {
			type: 4,
			data: content,
		});
	}

	//#endregion
	//#region Message

	extendMessage(message) {
		message.reply = async (content) => this.replyMessage(message.id, message.channel_id, content);
		message.edit = async (content) => this.editMessage(message.id, message.channel_id, content);
		return message;
	}

	async sendMessage(channelId, content) {
		this.debug("sendMessage called with:", { channelId, content });
		return this.apiRequest(
			`https://discord.com/api/v10/channels/${channelId}/messages`,
			"POST",
			typeof content === "string" ? { content } : content,
		);
	}

	async editMessage(messageId, channelId, newContent) {
		this.debug("editMessage called with:", { messageId, channelId, newContent });

		if (!channelId || !messageId) {
			throw new Error("Invalid parameters: channelId or messageId is undefined.");
		}

		const contentPayload = typeof newContent === "string" ? { content: newContent } : newContent;
		if (!contentPayload || typeof contentPayload.content !== "string") {
			throw new Error("Invalid content format for editMessage: content should be a string.");
		}

		return this.apiRequest(`https://discord.com/api/v10/channels/${channelId}/messages/${messageId}`, "PATCH", contentPayload);
	}

	async replyMessage(messageId, channelId, replyContent) {
		this.debug("replyMessage called with:", { messageId, channelId, replyContent });

		const responsePayload = typeof replyContent === "string" ? { content: replyContent } : replyContent;
		if (typeof responsePayload.content !== "string") {
			throw new Error("Invalid content format for replyMessage.");
		}

		return this.apiRequest(`https://discord.com/api/v10/channels/${channelId}/messages`, "POST", {
			...responsePayload,
			message_reference: { message_id: messageId },
		});
	}

	//#endregion
	//#region  Voice
	async connectToVoice(guildId, channelId, retry = true) {
		// Wait until the bot is fully ready
		if (!this.isReady) {
			this.debug("Bot not ready yet. Waiting for READY event...");
			await new Promise((resolve) => this.once("ready", resolve));
		}

		this.debug("Attempting to connect to voice channel", { guildId, channelId });

		let voiceStateData = null;
		let voiceServerData = null;
		let voiceServerHandled = false; // Flag to ensure voiceServerUpdate is handled once

		const tryConnectVoice = () => {
			if (voiceStateData && voiceServerData && !voiceServerHandled) {
				// Mark as handled
				const { endpoint, token } = voiceServerData;
				const { session_id } = voiceStateData;
				if (!endpoint || !token) return;
				voiceServerHandled = true;

				if (!endpoint) {
					this.debug("No voice endpoint found in voiceServerUpdate", voiceServerData);
					if (retry) {
						this.debug("Retrying connection to voice channel in 5 seconds...");
						setTimeout(() => this.connectToVoice(guildId, channelId, false), 5000);
					} else {
						this.debug("Failed to retrieve voice server endpoint after retry");
						this.emit("error", new Error("Failed to retrieve voice server endpoint"));
						return;
					}
				}
				this.voiceWs = new WebSocket(`wss://${endpoint}/?v=4`);

				this.voiceWs.on("open", () => {
					this.debug("Voice WebSocket opened, identifying for voice connection");
					this.voiceWs.send(
						JSON.stringify({
							op: 0,
							d: { server_id: guildId, user_id: this.userId, session_id, token },
						}),
					);
				});

				this.voiceWs.on("message", (data) => this.handleVoiceMessage(JSON.parse(data)));
			}
		};

		this.once("voiceStateUpdate", (voiceState) => {
			voiceStateData = voiceState;
			tryConnectVoice();
		});

		this.on("voiceServerUpdate", (voiceServer) => {
			voiceServerData = voiceServer;
			tryConnectVoice();
		});

		try {
			this.ws.send(
				JSON.stringify({
					op: 4,
					d: {
						guild_id: guildId,
						channel_id: channelId,
						self_mute: false,
						self_deaf: false,
					},
				}),
			);
		} catch (error) {
			this.debug("Failed to connect to voice channel:", error);
			if (retry) {
				this.debug("Retrying connection to voice channel in 5 seconds...");
				setTimeout(() => this.connectToVoice(guildId, channelId, false), 5000);
			} else {
				throw new Error(error.message || "Unknown error in connectToVoice");
			}
		}
	}

	handleVoiceMessage(packet) {
		const { op, d } = packet;

		switch (op) {
			case 2: {
				// Voice ready event
				this.debug("Voice server ready");
				const { ip, port, ssrc } = d;

				// Begin UDP connection (omitted here for simplicity)
				break;
			}
			case 8:
				// Start voice WebSocket heartbeating
				this.debug("Voice WebSocket starting heartbeat");
				this.heartbeatVoiceInterval = setInterval(
					() => this.voiceWs.send(JSON.stringify({ op: 3, d: Math.floor(Date.now() / 1000) })),
					d.heartbeat_interval,
				);
				break;
		}
	}

	async playAudio(audioStream) {
		// if (!this.voiceWs) throw new Error("Not connected to a voice channel");

		// this.debug("Playing audio stream");
		// console.log(audioStream);

		const pcmStream = audioStream.pipe(new prism.FFmpeg({ args: ["-f", "s16le", "-ar", "48000", "-ac", "2"] }));
		// const opusStream = pcmStream.pipe(new prism.opus.Encoder({ rate: 48000, channels: 2, frameSize: 960 }));

		// opusStream.on("data", (chunk) => {
		// 	this.voiceWs.send(chunk); // Send Opus data to Discord
		// });

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
	//#endregion
}

module.exports = DiscordBot;
