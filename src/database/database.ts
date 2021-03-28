import mongoose from "mongoose";
import { CompetitorSchema, TournamentSchema, UserSchema } from "./schema";

export type MongooseModel = mongoose.Model<mongoose.Document<any>>;

interface Models {
	User: MongooseModel
	Competitor: MongooseModel,
	Tournament: MongooseModel
}

class Database {
	private static connectionString = process.env.DATABASE_URL;
	private connection: mongoose.Connection;
	public models: Models;

	public async connect() {
		if(this.connected) return;
		this.connection = await mongoose.createConnection(Database.connectionString, {useNewUrlParser: true}).catch(e => {
			console.log(`Database connection failed: ${e.toString()}`);
			throw e;
		});
		this.models = {
			User: this.connection.model("user", UserSchema),
			Competitor: this.connection.model("competitor", CompetitorSchema),
			Tournament: this.connection.model("tournament", TournamentSchema)
		}
	}

	public get connected() { return Boolean(this.connection); }

	// TODO actually call this
	public async disconnect() {
		await this.connection.close().catch(e => {
			console.log(`Failed to close connection ${this.connection.id}: ${e.toString()}`);
		});
	}
}

export default Database;