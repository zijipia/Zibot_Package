const WebSocket = require("ws");
const fetch = require("node-fetch");
const EventEmitter = require("events");

module.exports = class Client extends EventEmitter {
	constructor(token, options = { _init: true, intents: 3276799 }) {
		super();
		this.token = token;
		this.user = null;
		this.guilds = null;
		this.ws = null;
		this.heartbeatInterval = null;
		this.sequenceNumber = null;
		this.gatewayUrl = "wss://gateway.discord.gg/?v=10&encoding=json";
		this.intents = options.intents;
		this.options = options;
		this.headers = {
			Authorization: `Bot ${this.token}`,
			"Content-Type": "application/json",
		};
		this.isReady = false;
		if (options._init) this.connect();
	}

	debug(message, ...args) {
		if (this.listeners("debug").length > 0) this.emit("debug", `[DEBUG] ${message}`, ...args);
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
				this.user = payload.user;
				this.guilds = payload.guilds;
				this.debug(`Logged in as ${this.user.username}`);
				this.emit("ready", payload);
				break;
			case "VOICE_STATE_UPDATE":
				this.emit("voiceStateUpdate", payload);
			case "VOICE_SERVER_UPDATE":
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

	async sendInteractionResponse(interaction_id, interactionToken, content) {
		this.debug("sendInteractionResponse called with:", { interaction_id, interactionToken, content });

		return this.apiRequest(`https://discord.com/api/v10/interactions/${interaction_id}/${interactionToken}/callback`, "POST", {
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

	async sendMessage(channel_id, content) {
		this.debug("sendMessage called with:", { channel_id, content });
		return this.apiRequest(
			`https://discord.com/api/v10/channels/${channel_id}/messages`,
			"POST",
			typeof content === "string" ? { content } : content,
		);
	}

	async editMessage(message_id, channel_id, newContent) {
		this.debug("editMessage called with:", { message_id, channel_id, newContent });

		if (!channel_id || !message_id) {
			throw new Error("Invalid parameters: channel_id or message_id is undefined.");
		}

		const contentPayload = typeof newContent === "string" ? { content: newContent } : newContent;
		if (!contentPayload || typeof contentPayload.content !== "string") {
			throw new Error("Invalid content format for editMessage: content should be a string.");
		}

		return this.apiRequest(`https://discord.com/api/v10/channels/${channel_id}/messages/${message_id}`, "PATCH", contentPayload);
	}

	async replyMessage(message_id, channel_id, replyContent) {
		this.debug("replyMessage called with:", { message_id, channel_id, replyContent });

		const responsePayload = typeof replyContent === "string" ? { content: replyContent } : replyContent;
		if (typeof responsePayload.content !== "string") {
			throw new Error("Invalid content format for replyMessage.");
		}

		return this.apiRequest(`https://discord.com/api/v10/channels/${channel_id}/messages`, "POST", {
			...responsePayload,
			message_reference: { message_id: message_id },
		});
	}

	//#endregion
};
