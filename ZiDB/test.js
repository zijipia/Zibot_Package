const { Database, createModel } = require("./index.js");

const db = new Database("./custom-db.json");

db.ZiUser = createModel(db, "ZiUser");
db.ZiAutoresponder = createModel(db, "ZiAutoresponder");
db.ZiWelcome = createModel(db, "ZiWelcome");
db.ZiGuild = createModel(db, "ZiGuild");

(async () => {
	// Lưu một người dùng
	await db.ZiUser.save({ userID: "123", name: "John Doe", xp: 100, level: 1 });

	// Tìm người dùng
	const user = await db.ZiUser.findOne({ userID: "123" });
	console.log(user);

	// Cập nhật level người dùng
	await db.ZiUser.updateOne({ userID: "123" }, { level: 2 });

	// Xóa người dùng
	// await db.ZiUser.deleteOne({ userID: "123" });

	// Lưu một guild
	await db.ZiGuild.save({ guildId: "456", voice: { logMode: true } });

	// Tìm guild
	const guild = await db.ZiGuild.findOne({ guildId: "456" });
	console.log(guild);

	await db.ZiUser.updateOne(
		{ userID: "12345" },
		{
			$set: {
				xp: 100,
				level: 2,
				coin: 500,
			},
		},
		{ upsert: true },
	);

	console.log(await db.ZiUser.findOne({ userID: "12345" }));
})();
