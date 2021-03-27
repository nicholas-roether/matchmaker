/// <reference types="next" />
/// <reference types="next/types/global" />

declare global {
	namespace NodeJS {
		interface ProcessEnv {
			NEXTAUTH_URL: string;
			EMAIL_HOST: string;
			EMAIL_PORT: number;
			EMAIL_LOGIN: string;
			EMAIL_PASSWORD: string;
			EMAIL_FROM: string;
			DATABASE_URL: string;
			GOOGLE_CLIENT_ID: string;
			GOOGLE_CLIENT_SECRET: string;
			GITHUB_CLIENT_ID: string;
			GITHUB_CLIENT_SECRET: string;
		}
	}
}

export {}