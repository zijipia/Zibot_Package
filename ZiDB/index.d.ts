export class Database {
	constructor(dbPath?: string);
	findOne<T>(collection: string, query: Partial<T>): Promise<T | null>;
	save<T>(collection: string, document: T): Promise<T>;
	updateOne<T>(collection: string, query: Partial<T>, update: Partial<T>): Promise<{ modifiedCount: number }>;
	deleteOne<T>(collection: string, query: Partial<T>): Promise<{ deletedCount: number }>;
	find<T>(collection: string, query: Partial<T>): Promise<T[]>;
}

export function createModel<T>(
	db: Database,
	name: string,
): {
	findOne(query: Partial<T>): Promise<T | null>;
	save(document: T): Promise<T>;
	updateOne(query: Partial<T>, update: Partial<T>): Promise<{ modifiedCount: number }>;
	deleteOne(query: Partial<T>): Promise<{ deletedCount: number }>;
	find(query: Partial<T>): Promise<T[]>;
};
