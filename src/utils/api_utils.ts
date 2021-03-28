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

function getValidJson(body: string, res: NextApiResponse): string {
	try {
		return JSON.parse(body);
	} catch(e) {
		res.status(400).end(ApiResponse.error(`Invalid Request: ${e}`).json());
		return null;
	}
}

export {
	ApiResponse,
	requireMethod,
	getValidJson
}