import NextAuth from "next-auth";
import { session } from "next-auth/client";
import Providers from "next-auth/providers";

export default (req, res) => NextAuth(req, res, {
	providers: [
		Providers.Google({
			clientId: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
			
		})
	],
	callbacks: {
		async jwt(token, _, account) {
			if(account) {
				token.id = account.id;
				token.accessToken = account.accessToken
			}
			return token;
		},
		async session(session, user) {
			session.user = user;
			return session;
		}
	}
});