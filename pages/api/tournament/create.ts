import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/client";
import Database from "../../../src/database/database";
import { Player, Team } from "../../../src/tournament/competitor";
import TournamentController from "../../../src/tournament/tournament_controller";
import TournamentLayout from "../../../src/tournament/tournament_layout";
import { ApiResponse, ArgumentSchema, extractData, requireMethod, validateBySchema } from "../../../src/utils/api_utils";

interface TournamentCreateOptions {
	name: string;
	competitorType: "team" | "single"
	description?: string;
	logo?: string;
	time?: number;
	qualificationTime?: number;
	competitors: string[] | {name: string, members: string[]}[];
	startingMatchups?: string[][];
	layout: {
		hasGroupPhase?: boolean;
		numGroups?: number;
		winnersPerGroup?: number;
		hasQualificationPhase?: boolean;
		competitorsAfterQualification?: number
	}
}

const schema: ArgumentSchema = {
	name: {type: "string"},
	competitorType: {
		type: "string",
		oneOf: ["team", "single"],
	},
	description: {type: "string", optional: true},
	logo: {type: "string", optional: true},
	time: {type: "number", optional: true},
	qualificationTime: {type: "number", optional: true},
	competitors: {
		type: "any",
		validate: (competitors) => {
			if(!Array.isArray(competitors)) return false;
			if(competitors.every(c => typeof c === "string")) return true;
			if(competitors.every(c => validateBySchema(c, {
				name: {type: "string"},
				members: {
					type: "string",
					array: true
				}
			}))) return true;
			return false;
		}
	},
	startingMatchups: {
		type: "any",
		optional: true,
		validate: (matchups) => {
			return Array.isArray(matchups) && matchups.every(e => Array.isArray(e) && e.every(e2 => typeof e2 == "string"));
		}
	},
	layout: {
		type: {
			hasGroupPhase: {type: "boolean", optional: true},
			numGroups: {type: "number", optional: true},
			winnersPerGroup: {type: "number", optional: true},
			hasQualificationPhase: {type: "boolean", optional: true},
			competitorsAfterQualification: {type: "number", optional: true},
		},
		validate: (layout) => {
			if(layout.hasGroupPhase && !("numGroups" in layout && "winnersPerGroup" in layout))
				return false;
			if(layout.hasQualificationPhase && !("competitorsAfterQualification" in layout))
				return false;
			return true;
		}
	}
}

export default async function(req: NextApiRequest, res: NextApiResponse) {
	if(!requireMethod("POST", req, res)) return;

	const data = extractData<TournamentCreateOptions>(req.body, schema, res);
	if(!data) return;

	const session = await getSession({ req }) as any;
	if(!session) return res.status(401).end(ApiResponse.error("You need to be logged in to create a tournament").json());
	const id = session.user.id;

	let success = true;

	const db = new Database();
	await db.connect().catch(e => {
		success = false;
		res.status(500).end(ApiResponse.error(`Database connection failed: ${e.toString()}`).json());
	});
	if(!success) return;

	try {
		let competitors: Player[] | Team[];
		if(data.competitorType == "single") 
			competitors = data.competitors.map(e => new Player(e));
		else
			competitors = data.competitors.map(e => new Team(e.name, e.members.map(m => new Player(m))));

		const [tournament, controller] = await TournamentController.createTournament({
			owner: id,
			name: data.name,
			description: data.description,
			logo: data.logo,
			time: new Date(data.time),
			qualificationTime: new Date(data.qualificationTime),
			competitors,
			layout: new TournamentLayout({
				numCompetitors: data.competitors.length,
				hasGroupPhase: data.layout.hasGroupPhase ?? false,
				numGroups: data.layout.numGroups,
				winnersPerGroup: data.layout.winnersPerGroup,
				hasQualificationPhase: data.layout.hasQualificationPhase ?? false,
				competitorsAfterQualification: data.layout.competitorsAfterQualification
			}),
			startingMatchups: data.startingMatchups?.map(matchup => matchup.map(name => competitors.find(c => c.name == name)))
		}, db).catch(e => {
			success = false;
			res.status(500).end(ApiResponse.error(`Tournament creation failed: ${e.toString()}`));
			return [null, null];
		});
		controller.disconnect();

		if(!success) return;

		res.status(200).end(ApiResponse.data(tournament.id).json());
	} catch(e) {
		return res.status(500).end(ApiResponse.error(e.toString()).json());
	}
}