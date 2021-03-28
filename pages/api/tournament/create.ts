import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/client";
import Database from "../../../src/database/database";
import { Player, Team } from "../../../src/tournament/competitor";
import TournamentController from "../../../src/tournament/tournament_controller";
import TournamentLayout from "../../../src/tournament/tournament_layout";
import { ApiResponse, getValidJson, requireMethod } from "../../../src/utils/api_utils";

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

function verifyTournamentCreateOptions(obj: any): obj is TournamentCreateOptions {
	if(!obj) return false;
	if(!("name" in obj)) return false;
	if(!("competitorType" in obj) || (obj.competitorType != "team" && obj.competitorType != "single")) return false;
	if("description" in obj && typeof obj.description != "string") return false;
	if("logo" in obj && typeof obj.logo != "string") return false;
	if("time" in obj && typeof obj.time != "number") return false;
	if("qualificationTime" in obj && typeof obj.qualificationTime != "number") return false;
	if(!("competitors" in obj) || !Array.isArray(obj.competitors)) return false;
	if(obj.competitorType == "team" && obj.competitors.some(e => {
		if(!("name" in e) || typeof e.name != "string") return false;
		if(!("members" in e) || !Array.isArray(e) || e.some(m => typeof m != "string")) return false;
		return true;
	})) return false;
	else if(obj.competitors.some(e => typeof e != "string")) return false;
	if("startingMatchups" in obj && (!Array.isArray(obj.startingMatchups) || obj.some(e => !Array.isArray(e) || e.some(n => typeof n != "string" || !(obj.competitorType == "team" ? obj.competitors.find(t => t.name == n) : obj.competitors.includes(n)))))) return false;
	if(!("layout" in obj)) return false;
	if(obj.layout.hasGroupPhase && (!("numGroups" in obj.layout && typeof obj.layout.numGroups == "number") || !("winnersPerGroup" in obj.layout && typeof obj.layout.winnersPerGroup == "number"))) return false;
	if(obj.layout.hasQualificationPhase && !("competitorsAfterQualification" in obj.layout && typeof obj.layout.competitorsAfterQualification == "number")) return false;
	return true;
}

export default async function(req: NextApiRequest, res: NextApiResponse) {
	if(!requireMethod("POST", req, res)) return;

	const data = getValidJson(req.body, res);
	if(!data) return;
	if(!verifyTournamentCreateOptions(data)) return res.status(400).end(ApiResponse.error("Invalid Request").json());

	const session = await getSession({ req }) as any;
	if(!session) return res.status(401).end(ApiResponse.error("You need to be logged in to create a tournament").json());
	const id = session.user.id;

	const db = new Database();
	await db.connect();

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
		}, db);
		controller.disconnect();

		res.status(200).end(ApiResponse.data(tournament.id).json());
	} catch(e) {
		return res.status(500).end(ApiResponse.error(e.toString()).json());
	}
}