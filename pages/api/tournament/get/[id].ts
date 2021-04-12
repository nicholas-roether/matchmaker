import * as mongoose from "mongoose";
import { NextApiRequest, NextApiResponse } from "next";
import Database from "../../../../src/database/database";
import { Competitor } from "../../../../src/tournament/competitor";
import TournamentDBAdapter from "../../../../src/tournament/tournament_db_adapter";
import TournamentModel from "../../../../src/tournament/tournament_model";
import { ApiResponse, ArgumentSchema, extractData, requireMethod } from "../../../../src/utils/api_utils";
import { isValidEncodedObjectId } from "../../../../src/utils/db_utils";

interface TournamentGetOptions {
	id: string;
}

const schema: ArgumentSchema = {
	id: {
		type: "string",
		validate: (id) => isValidEncodedObjectId(id)
	}
}

export default async function(req: NextApiRequest, res: NextApiResponse) {
	if(!requireMethod("GET", req, res)) return;
	
	const data = extractData<TournamentGetOptions>(req.query, schema, res);
	if(!data) return;
	
	const db = new Database();
	await db.connect();

	let tournament: TournamentModel<Competitor>;
	try {
		tournament = await TournamentDBAdapter.getTournament(data.id, db);
	} catch(e) {
		return res.status(404).end(ApiResponse.error(`Failed to get tournament: ${e}`).json());
	}

	db.disconnect();
	if(!tournament) return res.status(500).end(ApiResponse.error("An unknown error occured").json());
	return res.status(200).end(ApiResponse.data(tournament.toRaw()).json());
}