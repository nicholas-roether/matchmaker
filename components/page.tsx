import { Container, makeStyles } from "@material-ui/core";
import React from "react";
import MyAppBar from "./myappbar";

const useStyles = makeStyles(theme => ({
	wrapper: {
		background: theme.palette.background.default,
		minHeight: "100vh"
	}
}))

export interface PageProps {
	children: JSX.Element
}

const Page = ({children}: PageProps) => {
	const classes = useStyles();
	return (
		<div className={classes.wrapper}>
			<MyAppBar />
			<Container component="main" maxWidth="lg">
				{children}
			</Container>
		</div>
	);
}

export default Page;