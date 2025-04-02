const { writeFile, readFile } = require("fs/promises");
const path = require("path");

class Database {
	constructor(filePath = "./database.json") {
		this.dbPath = path.resolve(filePath);
	}

	async _readData() {
		try {
			const data = await readFile(this.dbPath, "utf-8");
			return JSON.parse(data);
		} catch (error) {
			if (error.code === "ENOENT") {
				await this._writeData({});
				return {};
			}
			throw error;
		}
	}

	async _writeData(data) {
		await writeFile(this.dbPath, JSON.stringify(data, null, 2));
	}

	async findOne(collection, query) {
		const db = await this._readData();
		return (
			Object.values(db[collection] || {}).find((item) => Object.keys(query).every((key) => item[key] === query[key])) || null
		);
	}

	async save(collection, document) {
		const db = await this._readData();
		if (!db[collection]) db[collection] = {};
		const id = document._id || Date.now().toString();
		db[collection][id] = { ...document, _id: id };
		await this._writeData(db);
		return db[collection][id];
	}

	async updateOne(collection, query, update, options = {}) {
		const db = await this._readData();
		const key = Object.keys(db[collection] || {}).find((id) =>
			Object.keys(query).every((k) => db[collection][id][k] === query[k]),
		);

		if (key) {
			if (update.$set) {
				db[collection][key] = { ...db[collection][key], ...update.$set };
			} else {
				db[collection][key] = { ...db[collection][key], ...update };
			}
			await this._writeData(db);
			return { modifiedCount: 1 };
		}

		if (options.upsert) {
			const newDoc = { ...query, ...update.$set, _id: Date.now().toString() };
			if (!db[collection]) db[collection] = {};
			db[collection][newDoc._id] = newDoc;
			await this._writeData(db);
			return { modifiedCount: 1, upserted: newDoc._id };
		}

		return { modifiedCount: 0 };
	}

	async deleteOne(collection, query) {
		const db = await this._readData();
		const key = Object.keys(db[collection] || {}).find((id) =>
			Object.keys(query).every((k) => db[collection][id][k] === query[k]),
		);
		if (key) {
			delete db[collection][key];
			await this._writeData(db);
			return { deletedCount: 1 };
		}
		return { deletedCount: 0 };
	}

	async find(collection, query) {
		const db = await this._readData();
		return Object.values(db[collection] || {}).filter((item) => Object.keys(query).every((key) => item[key] === query[key]));
	}
}

function createModel(db, name) {
	return {
		findOne: (query) => db.findOne(name, query),
		save: (document) => db.save(name, document),
		updateOne: (query, update, options) => db.updateOne(name, query, update, options),
		deleteOne: (query) => db.deleteOne(name, query),
		find: (query) => db.find(name, query),
	};
}

module.exports = { Database, createModel };
