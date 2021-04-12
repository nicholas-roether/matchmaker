import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/client";
import Database from "../database/database";
import { hasModeratorPrivilege, hasOwnerPrivilege, hasStreamerPrivilege } from "../tournament/tournament_permissions";

class ApiResponse {
	public readonly data?: any;
	public readonly error?: string;

	constructor(data?: any, error?: string) {
		this.data = data;
		this.error = error;
	}

	public json() {
		return JSON.stringify(this);
	}

	public static data(data: any) {
		return new ApiResponse(data);
	}

	public static error(message: string) {
		return new ApiResponse(null, message);
	}

	public static isApiResponse(data: any): data is ApiResponse {
		return (!("error" in data) && "data" in data) || typeof data.error === "string";
	}

	public static fromJson(json: string) {
		const data = JSON.parse(json);
		return this.isApiResponse(data) ? data : null;
	}
 }

function requireMethod(method: string, req: NextApiRequest, res: NextApiResponse) {
	let valid = req.method == method;
	if(!valid) res.status(405).end(ApiResponse.error("Invalid Method").json());
	return valid;
}

function getValidJson(body: string, res: NextApiResponse) {
	try {
		return JSON.parse(body);
	} catch(e) {
		res.status(400).end(ApiResponse.error(`Invalid Request: ${e}`).json());
		return null;
	}
}

type Type = "string" | "number" |  "boolean" | "any";

export type ArgumentSchemaType = Type | ArgumentSchema

export interface ArgumentSchemaTypeOptions {
	type: ArgumentSchemaType,
	array?: boolean,
	optional?: boolean,
	oneOf?: string[],
	validate?: (value: any) => boolean
};

export type ArgumentSchema = {[key: string]: ArgumentSchemaTypeOptions};

function validateType(value: any, type: ArgumentSchemaType, oneOf?: string[]) {
	if(typeof type === "object") return validateBySchema(value, type);
	if(type !== "any" && typeof value !== type) return false;
	if(oneOf && type === "string" && !oneOf.includes(value)) return false;
	return true;
}

function validateBySchema<T>(value: any, schema: ArgumentSchema): value is T {
	for(const key in schema) {
		const {type, array = false, optional = false, oneOf, validate = () => true} = schema[key];
		if(!(key in value)) {
			if(!optional) return false;
		} else {
			const val = value[key];
			if(array) {
				if(!Array.isArray(val) || !val.every(e => validateType(e, type, oneOf))) return false;
			} else if(!validateType(val, type, oneOf)) return false;
			if(!validate(val)) return false;
		}
	}
	return true;
}

function extractData<T>(body: string | {[key: string]: any}, schema: ArgumentSchema, res: NextApiResponse): T {
	const data = typeof body === "string" ? getValidJson(body, res) : body;
	if(!data) return null;
	if(!validateBySchema<T>(data, schema)) {
		res.status(400).end(ApiResponse.error("Invalid or missing argument").json());
		return null;
	}
	return data;
}

async function requireLogin(req: NextApiRequest, res: NextApiResponse, customMessage?: string) {
	return {user: {id: "y42LW46J9luq3Xq9XMly"}};
	// const session = await getSession({ req }) as any;
	// if(!session) {
	// 	res.status(401).end(ApiResponse.error(customMessage ?? "You need to be logged in to perform this action").json());
	// 	return null;
	// }
	// return session;
}

async function requirePrivilege(
	req: NextApiRequest,
	res: NextApiResponse,
	validator: (session: any) => Promise<boolean>,
	message: string,
) {
	const session = await requireLogin(req, res, message);
	if(!session) return;
	if(!(await validator(session))) {
		res.status(401).end(ApiResponse.error(message).json());
		return null;
	}
	return session;
}

async function requireStreamerPrivilege(
	tournamentId: string,
	req: NextApiRequest,
	res: NextApiResponse,
	customMessage?: string,
	db?: Database
) {
	return requirePrivilege(
		req,
		res,
		session => hasStreamerPrivilege(tournamentId, session.user.id, db),
		customMessage ?? "You need to be a streamer to perform this action"
	)
}

async function requireModeratorPrivilege(
	tournamentId: string,
	req: NextApiRequest,
	res: NextApiResponse,
	customMessage?: string,
	db?: Database
) {
	return requirePrivilege(
		req,
		res,
		session => hasModeratorPrivilege(tournamentId, session.user.id, db),
		customMessage ?? "You need to be a moderator to perform this action"
	)
}

async function requireOwnerPrivilege(
	tournamentId: string,
	req: NextApiRequest,
	res: NextApiResponse,
	customMessage?: string,
	db?: Database
) {
	return requirePrivilege(
		req,
		res,
		session => hasOwnerPrivilege(tournamentId, session.user.id, db),
		customMessage ?? "You need to be the owner of this tournament to perform this action"
	)
}

export {
	ApiResponse,
	requireMethod,
	getValidJson,
	validateType,
	validateBySchema,
	extractData,
	requireLogin,
	requireStreamerPrivilege,
	requireModeratorPrivilege,
	requireOwnerPrivilege
}