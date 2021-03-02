import { AppBar, Box, IconButton, makeStyles, Toolbar, Typography, useMediaQuery, useTheme } from "@material-ui/core";
import { MenuTwoTone as MenuIcon } from "@material-ui/icons";
import React from "react";
import UserDisplay from "./user_display";


interface MyAppBarProps {
	onMenuToggle: () => void;
}

const MyAppBar = ({onMenuToggle}: MyAppBarProps) => {
	const theme = useTheme();
	const tiny = useMediaQuery(theme.breakpoints.down("sm"));

	return (
		<AppBar position="sticky">
			<Toolbar>
				<IconButton edge="start" onClick={() => onMenuToggle()}><MenuIcon /></IconButton>
				<Box mr={1} />
				<Typography variant={tiny ? "h6" : "h5"}>Matchmaker</Typography>
				<Box flexGrow={1} />
				<UserDisplay tiny={tiny} />
			</Toolbar>
		</AppBar>
	)
}

export default  MyAppBar;