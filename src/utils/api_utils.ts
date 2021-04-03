import { NextApiRequest, NextApiResponse } from "next";

class ApiResponse {
	public readonly data?: any;
	public readonly error?: string;

	constructor(data?: any, error?: string) {
		this.data == data ?? null;
		this.error = error ?? null;
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
	if(typeof type == "object") return validateBySchema(value, type);
	if(type === "any" || typeof value !== type) return false;
	if(oneOf && type === "string" && !oneOf.includes(value)) return false;
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

function extractData<T>(body: string, schema: ArgumentSchema, res: NextApiResponse): T {
	const data = getValidJson(body, res);
	if(!data) return null;
	if(!validateBySchema<T>(data, schema)) {
		res.status(400).end(ApiResponse.error("Invalid or missing argument"));
		return null;
	}
	return data;
}

export {
	ApiResponse,
	requireMethod,
	getValidJson,
	validateType,
	validateBySchema,
	extractData
}