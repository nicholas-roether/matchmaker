import { AppBar, Box, IconButton, Toolbar, Typography, useMediaQuery, useTheme } from "@material-ui/core";
import { MenuTwoTone as MenuIcon } from "@material-ui/icons";
import React from "react";
import UserDisplay from "./user_display";

const MyAppBar = () => {
	const theme = useTheme();
	const mobile = useMediaQuery(theme.breakpoints.down("sm"));
	return (
		<AppBar>
			<Toolbar>
				<IconButton edge="start"><MenuIcon /></IconButton>
				<Box mr={1} />
				<Typography variant={mobile ? "h6" : "h5"}>Matchmaker</Typography>
				<Box flexGrow={1} />
				<UserDisplay mobile={mobile} />
			</Toolbar>
		</AppBar>
	)
}

export default  MyAppBar;