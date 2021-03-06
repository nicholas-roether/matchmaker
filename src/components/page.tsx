import { Container, makeStyles, useMediaQuery, useTheme } from "@material-ui/core";
import React from "react";
import { cls } from "../utils/jsx_utils";
import Menu, { menuWidth } from "./myappbar/menu";
import MyAppBar from "./myappbar/myappbar";

const useStyles = makeStyles(theme => ({
	wrapper: {
		color: theme.palette.type === "light" ? "#000" : "#fff",
		minHeight: "100vh",
		width: "100%",
		display: "flex",
		overflow: "hidden"
	},
	contentWrapper: {
		flexGrow: 1,
		maxWidth: "100%"
	},
	desktopContentWrapper: {
		flexGrow: 1,
		transition: theme.transitions.create("margin", {
			easing: theme.transitions.easing.sharp,
			duration: theme.transitions.duration.leavingScreen
		}),
		marginLeft: -menuWidth
	},
	desktopContentWrapperOpen: {
		transition: theme.transitions.create("margin", {
			easing: theme.transitions.easing.easeOut,
			duration: theme.transitions.duration.enteringScreen
		}),
		marginLeft: 0
	}
}))

export interface PageProps {
	children: React.ReactNode
}

const Page = ({children}: PageProps) => {
	const classes = useStyles();
	const theme = useTheme();
	// Prioritize mobile stylings to prevent display issues during load
	const mobile = !useMediaQuery(theme.breakpoints.up("sm"));
	const [menuOpen, setMenuOpen] = React.useState(false);
	return (
		<div className={classes.wrapper}>
			<Menu variant={mobile ? "mobile" : "desktop"} open={menuOpen} onOpen={() => setMenuOpen(true)} onClose={() => setMenuOpen(false)} />
			<div className={cls(classes.contentWrapper, [classes.desktopContentWrapper, !mobile], [classes.desktopContentWrapperOpen, !mobile && menuOpen])}>
				<MyAppBar onMenuToggle={() => setMenuOpen(!menuOpen)} />
				<Container component="main" maxWidth="lg">
					{children}
				</Container>
			</div>
		</div>
	);
}

export default Page;