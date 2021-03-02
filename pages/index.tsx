import { Box, Button, Container, Typography, useMediaQuery, useTheme } from '@material-ui/core';
import { signIn } from 'next-auth/client';
import Head from 'next/head'
import React from 'react';

const Home = () => {
	const theme = useTheme();
	const small = useMediaQuery(theme.breakpoints.down("xs"));
	return (
		<>
			<Head>
				<title>Matchmaker | Home</title>
			</Head>
			<Container maxWidth="md">
				<Box mt={small ? 6 : 10} textAlign="center" marginX="auto">
					<Typography variant={small ? "h3": "h2"} gutterBottom>
						Organize tournaments,<br />
						the easy way.
					</Typography>
					<Typography paragraph style={{fontSize: small ? "1.2em" : "1.7em"}}>
						With Matchmaker, you can organize tournaments of any scale,
						for free! Let us handle the organizational hassle while you
						enjoy the competition.
					</Typography>
					<Box mt={3}>
						<Button variant="contained" color="primary" size={small ? "medium" : "large"} onClick={() => signIn()}>Get Started</Button>
						<Box mr={1} display="inline" />
						<Button variant="outlined" color="primary" size={small ? "medium" : "large"}>Watch Tutorial</Button>
					</Box>
				</Box>
			</Container>
		</>
	)
}

export default Home;