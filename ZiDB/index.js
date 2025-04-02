const { writeFile, readFile } = require("fs/promises");
const path = require("path");

class Database {
	constructor(dbPath) {
		this.dbPath = dbPath || path.join(__dirname, "database.json");
	}

	async readData() {
		try {
			const data = await readFile(this.dbPath, "utf-8");
			return JSON.parse(data);
		} catch (error) {
			if (error.code === "ENOENT") {
				await writeFile(this.dbPath, JSON.stringify({}, null, 2));
				return {};
			}
			throw error;
		}
	}

	async writeData(data) {
		await writeFile(this.dbPath, JSON.stringify(data, null, 2));
	}

	async findOne(collection, query) {
		const db = await this.readData();
		return (
			Object.values(db[collection] || {}).find((item) => Object.keys(query).every((key) => item[key] === query[key])) || null
		);
	}

	async save(collection, document) {
		const db = await this.readData();
		if (!db[collection]) db[collection] = {};
		const id = document._id || Date.now().toString();
		db[collection][id] = { ...document, _id: id };
		await this.writeData(db);
		return db[collection][id];
	}

	async updateOne(collection, query, update) {
		const db = await this.readData();
		const key = Object.keys(db[collection] || {}).find((id) =>
			Object.keys(query).every((k) => db[collection][id][k] === query[k]),
		);
		if (key) {
			db[collection][key] = { ...db[collection][key], ...update };
			await this.writeData(db);
			return { modifiedCount: 1 };
		}
		return { modifiedCount: 0 };
	}

	async deleteOne(collection, query) {
		const db = await this.readData();
		const key = Object.keys(db[collection] || {}).find((id) =>
			Object.keys(query).every((k) => db[collection][id][k] === query[k]),
		);
		if (key) {
			delete db[collection][key];
			await this.writeData(db);
			return { deletedCount: 1 };
		}
		return { deletedCount: 0 };
	}

	async find(collection, query) {
		const db = await this.readData();
		return Object.values(db[collection] || {}).filter((item) => Object.keys(query).every((key) => item[key] === query[key]));
	}
}

function createModel(dbInstance, name) {
	return {
		findOne: (query) => dbInstance.findOne(name, query),
		save: (document) => dbInstance.save(name, document),
		updateOne: (query, update) => dbInstance.updateOne(name, query, update),
		deleteOne: (query) => dbInstance.deleteOne(name, query),
		find: (query) => dbInstance.find(name, query),
	};
}

module.exports = { Database, createModel };
