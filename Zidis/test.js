// const DiscordVoiceClient = require("./index");
require("dotenv").config();
const fs = require("fs");
const { Transform } = require("stream");

// Thông tin kết nối
const botToken = process.env.TOKEN;
const token = botToken;
const guildId = "1150638980803592262";
const channelId = "1162041451895599154";
const userId = "1303274959405056070";


const { Client } = require("./");

const bot = new Client(token);

bot.on("ready", async (payload) => {
	console.log(`${payload.user.username} is online and ready!`);
});

bot.on("messageCreate", (message) => {
	console.log(`Message from ${message.author.username}: ${message.content}`);

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
