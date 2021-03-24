import { NextApiRequest, NextApiResponse } from "next";

class ApiResponse {
	public readonly data?: any;
	public readonly error?: string;

	constructor(data?: any, error?: string) {
		this.data == data ?? null;
		this.error = error ?? null;
	}

	public static data(data: any) {
		return new ApiResponse(data);
	}

	public static error(message: string) {
		return new ApiResponse(null, message);
	}
}

function requireMethod(method: string, req: NextApiRequest, res: NextApiResponse) {
	let valid = req.method == method;
	if(!valid) res.status(405).end(ApiResponse.error("Invalid Method"));
	return valid;
}

export {
	ApiResponse,
	requireMethod
}