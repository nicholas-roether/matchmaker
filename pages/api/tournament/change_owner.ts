import { NextApiRequest, NextApiResponse } from "next";
import { ArgumentSchema, defaultApiHeaders, extractData, requireMethod, requireOwnerPrivilege } from "../../../src/utils/api_utils";

interface ChangeOwnerOptions {
	tournament: string;
	newOwner: string;
}

const schema: ArgumentSchema = {
	tournament: {type: "string"},
	newOwner: {type: "string"}
}

export default async function(req: NextApiRequest, res: NextApiResponse) {
	defaultApiHeaders(res);

	if(!requireMethod("POST", req, res)) return;

	const data = extractData<ChangeOwnerOptions>(req.body, schema, res);
	if(!data) return;
	
	// const db 
	const session = requireOwnerPrivilege(data.tournament, req, res)
}