import { Container, makeStyles } from "@material-ui/core";
import React from "react";
import MyAppBar from "./myappbar/myappbar";

const useStyles = makeStyles(theme => ({
	wrapper: {
		background: theme.palette.background.default,
		color: theme.palette.type === "light" ? "#000" : "#fff",
		minHeight: "100vh"
	}
}))

export interface PageProps {
	children: React.ReactNode
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