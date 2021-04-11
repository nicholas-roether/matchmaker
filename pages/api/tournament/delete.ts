import * as mongoose from "mongoose";
import { NextApiRequest, NextApiResponse } from "next";
import Database from "../../../src/database/database";
import TournamentDBAdapter from "../../../src/tournament/tournament_db_adapter";
import { ApiResponse, ArgumentSchema, extractData, requireMethod, requireOwnerPrivilege } from "../../../src/utils/api_utils";

interface TournamentDeleteOptions {
	id: string;
}

const schema: ArgumentSchema = {
	id: {
		type: "string",
		validate: (id) => mongoose.Types.ObjectId.isValid(id)
	}
}

export default async function(req: NextApiRequest, res: NextApiResponse) {
	if(!requireMethod("POST", req, res)) return;

	const data = extractData<TournamentDeleteOptions>(req.body, schema, res);
	if(!data) return;

	const db = new Database();
	const session = requireOwnerPrivilege(data.id, req, res, "Only the owner can delete a tournament", db);
	if(!session) return;

	try {
		const [_, controller] = await TournamentDBAdapter.getTournament(data.id, db);
		controller.delete();
	} catch(e) {
		return res.status(400).end(ApiResponse.error(`Failed to delete tournament: ${e}`).json());
	}

	db.disconnect();
	return res.status(200).end("{}");
}