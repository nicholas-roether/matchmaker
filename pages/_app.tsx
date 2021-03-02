import { CssBaseline, makeStyles, ThemeProvider } from "@material-ui/core";
import Head from "next/head"
import React from "react"
import Page from "../components/page";
import theme from "../constants/theme";


function MyApp({ Component, pageProps }) {
	React.useEffect(() => {
		const jssStyles = document.querySelector("#jss-server-side");
		if (jssStyles) jssStyles.parentElement.removeChild(jssStyles);
	}, []);
	return (
		<>
			<Head>
				<title>Matchmaker</title>
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<link rel="icon" href="/favicon.ico" />
				<link rel="preconnect" href="https://fonts.gstatic.com" />
				<link href="https://fonts.googleapis.com/css2?family=Monda:wght@400;700&family=Open+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
				
				<meta name="author" content="Nicholas Roether" />
				<meta name="description" content="Easy to use online tournament organization tool" />
				<meta name="theme-color" content={theme.palette.primary.main}/>
				{/* TODO SEO */}
				<meta name="keywords" content="Tournament, Video Game, Tournament Maker" />
			</Head>
			<CssBaseline />
			<ThemeProvider theme={theme}>
				<Page>
					<Component {...pageProps} />
				</Page>
			</ThemeProvider>
		</>
	)
}

export default MyApp