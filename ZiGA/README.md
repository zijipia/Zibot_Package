# @zibot/giveaway

A simple and efficient giveaway management system for Discord bots using `discord.js`. This package allows you to create, manage,
pause, resume, and end giveaways with ease.

## Installation

```sh
npm install @zibot/giveaway
```

## Features

- 🎉 Create giveaways with customizable duration and prizes

- ✋ Pause and resume giveaways

- 🏆 Automatically pick winners when the giveaway ends

- 📋 Fetch active giveaways

- 🎭 Role-based participation

- 🟦 Button-based interaction

## Usage

### Importing the Module

```javascript
const { Client, GatewayIntentBits } = require("discord.js");
const { Giveaways } = require("@zibot/giveaway");

const client = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

const giveaways = new Giveaways(client, {
	store: "./giveaways.json",
	updateInterval: 60000, // 1 minute
});

client.once("ready", () => {
	console.log(`Logged in as ${client.user.tag}`);
	giveaways.init();
});

client.login("YOUR_BOT_TOKEN");
```

### Creating a Giveaway

```javascript
giveaways.createGiveaway(
	"channel-id", // The channel where the giveaway will be posted
	"Free Nitro", // Prize name
	60000, // Duration in milliseconds (1 minute)
	1, // Number of winners
	{ content: "🎉 Giveaway Started! 🎉" }, // Optional custom message
);
```
### Editing a Giveaway
```javascript
const messageId = "123456789012345678"; // ID of message giveaway

giveaways.editGiveaway(messageId, {
  prize: "New Awesome Prize", // Prize name
  duration: 300000, // Duration in milliseconds  (5 minute)
  winnerCount: 2 // Number of winners
});

console.log("Giveaway updated!");

```

### Joining a Giveaway

```javascript
giveaways.joinGiveaway("message-id", "user-id");
```

### Ending a Giveaway

```javascript
giveaways.endGiveaway("message-id");
```

### Pausing a Giveaway

```javascript
giveaways.pauseGiveaway("message-id");
```

### Resuming a Giveaway

```javascript
giveaways.unpauseGiveaway("message-id");
```

### Fetching Active Giveaways

```javascript
const activeGiveaways = giveaways.fetchGiveaways();
console.log(activeGiveaways);
```

---

## Use Button Interaction

### Creating a Giveaway

```javascript
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require("discord.js");

async function startGiveaway(channel) {
  const embed = new EmbedBuilder()
    .setTitle("🎉 Giveaway!")
    .setDescription("Click the button below to enter!")
    .setColor("Gold");

  const button = new ButtonBuilder()
    .setCustomId("join_giveaway")
    .setLabel("Join Giveaway")
    .setStyle(ButtonStyle.Primary);

  const row = new ActionRowBuilder().addComponents(button);

  const message = await channel.send({ embeds: [embed], components: [row] });

  giveaways.createGiveaway(channel.id, "Awesome Prize", 60000, 1, message);
}

```

### Handling Button Interaction

```javascript
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId === "join_giveaway") {
    const joined = giveaways.joinGiveaway(interaction.message.id, interaction.user.id);
    
    if (joined) {
      await interaction.reply({ content: "You have joined the giveaway!", ephemeral: true });
    } else {
      await interaction.reply({ content: "You are already in the giveaway!", ephemeral: true });
    }
  }
});

```

## Events

You can listen to various events for better control over the giveaway process:

```javascript
giveaways.on("giveawayCreated", (client, giveaway) => {
	console.log("New giveaway created:", giveaway);
});

giveaways.on("giveawayEdited", (giveaway) => {
	console.log(`Giveaway  Edited: ${giveaway.messageId}`);
});

giveaways.on("giveawayEnded", (giveaway, winners) => {
	console.log(`Giveaway ended! Winners: ${winners.join(", ")}`);
});

giveaways.on("userJoined", (giveaway, userId) => {
	console.log(`User ${userId} joined giveaway: ${giveaway.messageId}`);
});
```

## License

MIT License

## Contributors

- **ZiBot** - Creator & Maintainer

## Support

For any issues or feature requests, please create an issue on the GitHub repository.
