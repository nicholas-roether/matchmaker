import mongoose from "mongoose";
import Database from "../database/database"

async function handleDatabase<T>(callback: (db: Database) => T | Promise<T>, db?: Database) {
	let mustDisconnectDb = false;
	if(!db) {
		db = new Database();
		mustDisconnectDb = true;
	}
	await db.connect();
	const result = callback(db);
	if(mustDisconnectDb) db.disconnect();
	return result;
}

async function getUser(tournamentId: string, userId: string, db: Database) {
	const tournament = await db.models.Tournament.findById(tournamentId).select("users").exec();
	return tournament.get("users").find(u => u.user.equals(userId));
}

async function hasOwnerPrivilege(tournamentId: string, userId: string, db?: Database) {
	return await handleDatabase(async db => {
		const ownerId = (await db.models.Tournament.findById(tournamentId).select("owner").exec()).get("owner") as mongoose.Types.ObjectId;
		return ownerId.equals(userId);
	}, db);
}

async function hasModeratorPrivilege(tournamentId: string, userId: string, db?: Database) {
	return await handleDatabase(async db => {
		const user = await getUser(tournamentId, userId, db);
		if(!user) return false;
		return user.isModerator;
	}, db);
}

async function hasStreamerPrivilege(tournamentId: string, userId: string, db?: Database) {
	return await handleDatabase(async db => {
		const user = await getUser(tournamentId, userId, db);
		if(!user) return false;
		return user.isStreamer;
	}, db);
}

export {
	hasOwnerPrivilege,
	hasModeratorPrivilege,
	hasStreamerPrivilege
}