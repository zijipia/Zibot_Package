require("dotenv").config();
const { Client, GatewayIntentBits, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require("discord.js");
const { Giveaways } = require("@zibot/giveaway");

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessageReactions,
	],
});

const giveaways = new Giveaways(client, { store: "./giveaways.json", updateInterval: 60000 });

client.once("ready", () => {
	console.log(`✅ Logged in as ${client.user.tag}`);
	giveaways.init();
});

// 📌 Xử lý lệnh Slash Command
client.on("interactionCreate", async (interaction) => {
	if (!interaction.isCommand()) return;

	const { commandName, options } = interaction;

	if (commandName === "start") {
		const channel = interaction.channel;
		const prize = options.getString("prize");
		const duration = options.getInteger("duration") * 1000; // Convert seconds to ms
		const winnerCount = options.getInteger("winners");

		const embed = new EmbedBuilder()
			.setTitle("🎉 Giveaway!")
			.setDescription(`**Prize:** ${prize}\n**Winners:** ${winnerCount}\nClick the button below to enter!`)
			.setColor("Gold");

		const button = new ButtonBuilder().setCustomId("join_giveaway").setLabel("Join Giveaway").setStyle(ButtonStyle.Primary);

		const row = new ActionRowBuilder().addComponents(button);

		const message = await channel.send({ embeds: [embed], components: [row] });

		giveaways.createGiveaway(channel.id, prize, duration, winnerCount, message);
		await interaction.reply({ content: "✅ Giveaway started!", ephemeral: true });
	}

	if (commandName === "edit") {
		const messageId = options.getString("message_id");
		const prize = options.getString("prize");
		const duration = options.getInteger("duration") ? options.getInteger("duration") * 1000 : undefined;
		const winnerCount = options.getInteger("winners");

		const success = giveaways.editGiveaway(messageId, { prize, duration, winnerCount });

		await interaction.reply({ content: success ? "✅ Giveaway updated!" : "❌ Giveaway not found!", ephemeral: true });
	}

	if (commandName === "end") {
		const messageId = options.getString("message_id");
		giveaways.endGiveaway(messageId);
		await interaction.reply({ content: "✅ Giveaway ended!", ephemeral: true });
	}

	if (commandName === "pause") {
		const messageId = options.getString("message_id");
		giveaways.pauseGiveaway(messageId);
		await interaction.reply({ content: "⏸️ Giveaway paused!", ephemeral: true });
	}

	if (commandName === "resume") {
		const messageId = options.getString("message_id");
		giveaways.unpauseGiveaway(messageId);
		await interaction.reply({ content: "▶️ Giveaway resumed!", ephemeral: true });
	}

	if (commandName === "list") {
		const activeGiveaways = giveaways.fetchGiveaways();
		if (activeGiveaways.length === 0) {
			return interaction.reply({ content: "❌ No active giveaways!", ephemeral: true });
		}

		const embed = new EmbedBuilder().setTitle("📋 Active Giveaways").setColor("Aqua");

		activeGiveaways.forEach((g) => {
			embed.addFields({ name: g.prize, value: `Ends <t:${Math.floor(g.endTime / 1000)}:R>` });
		});

		await interaction.reply({ embeds: [embed] });
	}
});

// 📌 Xử lý nút tham gia Giveaway
client.on("interactionCreate", async (interaction) => {
	if (!interaction.isButton() || interaction.customId !== "join_giveaway") return;

	const joined = giveaways.joinGiveaway(interaction.message.id, interaction.user.id);

	await interaction.reply({
		content: joined ? "✅ You have joined the giveaway!" : "⚠️ You are already in the giveaway!",
		ephemeral: true,
	});
});

// 📌 Đăng ký Slash Commands
client.on("ready", async () => {
	const commands = [
		{
			name: "start",
			description: "Start a new giveaway",
			options: [
				{ name: "prize", type: 3, description: "The prize", required: true },
				{ name: "duration", type: 4, description: "Duration in seconds", required: true },
				{ name: "winners", type: 4, description: "Number of winners", required: true },
			],
		},
		{
			name: "edit",
			description: "Edit an existing giveaway",
			options: [
				{ name: "message_id", type: 3, description: "Message ID of the giveaway", required: true },
				{ name: "prize", type: 3, description: "New prize", required: false },
				{ name: "duration", type: 4, description: "New duration in seconds", required: false },
				{ name: "winners", type: 4, description: "New number of winners", required: false },
			],
		},
		{
			name: "end",
			description: "End a giveaway",
			options: [{ name: "message_id", type: 3, description: "Message ID of the giveaway", required: true }],
		},
		{
			name: "pause",
			description: "Pause a giveaway",
			options: [{ name: "message_id", type: 3, description: "Message ID of the giveaway", required: true }],
		},
		{
			name: "resume",
			description: "Resume a giveaway",
			options: [{ name: "message_id", type: 3, description: "Message ID of the giveaway", required: true }],
		},
		{
			name: "list",
			description: "List all active giveaways",
			options: [],
		},
	];

	const guild = client.guilds.cache.first();
	if (guild) {
		await guild.commands.set(commands);
		console.log("✅ Slash commands registered!");
	}
});

client.login(process.env.DISCORD_TOKEN);
