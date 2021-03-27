import NextAuth from "next-auth";
import Providers from "next-auth/providers";

export default (req, res) => NextAuth(req, res, {
	database: {
		type: "mongodb",
		url: process.env.DATABASE_URL,
		useNewUrlParser: true,
		useUnifiedTopology: true,
	},
	providers: [
		Providers.Email({
			server: {
				host: process.env.EMAIL_HOST,
				port: process.env.EMAIL_PORT,
				auth: {
					user: process.env.EMAIL_LOGIN,
					pass: process.env.EMAIL_PASSWORD
				}
			},
			from: process.env.EMAIL_FROM
		}),
		Providers.Google({
			clientId: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
		}),
		Providers.GitHub({
			clientId: process.env.GITHUB_CLIENT_ID,
			clientSecret: process.env.GITHUB_CLIENT_SECRET,
			scope: "user"
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